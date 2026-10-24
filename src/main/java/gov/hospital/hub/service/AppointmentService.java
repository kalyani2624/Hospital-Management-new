package gov.hospital.hub.service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import gov.hospital.hub.entity.Appointment;
import gov.hospital.hub.entity.Doctor;
import gov.hospital.hub.entity.Hospital;
import gov.hospital.hub.entity.Patient;
import gov.hospital.hub.exception.DoubleBookingException;
import gov.hospital.hub.exception.ForbiddenException;
import gov.hospital.hub.exception.ResourceNotFoundException;
import gov.hospital.hub.repository.AppointmentRepository;
import gov.hospital.hub.repository.DoctorRepository;
import gov.hospital.hub.repository.HospitalRepository;
import gov.hospital.hub.repository.PatientRepository;

/**
 * Booking is @Transactional and checks the (doctor, slot) pair first.
 * A duplicate BOOKED row for the same slot raises 409 DoubleBookingException.
 */
@Service
public class AppointmentService {

    private final AppointmentRepository appointments;
    private final PatientRepository patients;
    private final DoctorRepository doctors;
    private final HospitalRepository hospitals;

    public AppointmentService(AppointmentRepository appointments, PatientRepository patients,
            DoctorRepository doctors, HospitalRepository hospitals) {
        this.appointments = appointments;
        this.patients = patients;
        this.doctors = doctors;
        this.hospitals = hospitals;
    }

    public List<Appointment> list() {
        return appointments.findAll();
    }

    /** Paged list (P0: bound bulk PHI dump, default size 20). */
    public org.springframework.data.domain.Page<Appointment> list(
            org.springframework.data.domain.Pageable pageable) {
        return appointments.findAll(pageable);
    }

    public Appointment get(Long id) {
        return appointments.findById(id).orElseThrow(
                () -> new ResourceNotFoundException("appointment " + id + " not found"));
    }

    public record BookRequest(Long patientId, Long doctorId, Long hospitalId,
            LocalDateTime appointmentTime, String reason) {
    }

    @Transactional
    public Appointment book(BookRequest req) {
        if (req.appointmentTime() == null) {
            throw new IllegalArgumentException("appointmentTime is required");
        }
        if (req.appointmentTime().isBefore(LocalDateTime.now())) {
            throw new IllegalArgumentException(
                    "appointmentTime must be in the future");
        }
        boolean clash = appointments.existsByDoctorIdAndAppointmentTimeAndStatus(
                req.doctorId(), req.appointmentTime(), "BOOKED");
        if (clash) {
            // WHY 409: slot is a real conflict, not a bad request - client must pick another slot.
            throw new DoubleBookingException("doctor " + req.doctorId()
                    + " already booked at " + req.appointmentTime());
        }
        Patient patient = patients.findById(req.patientId()).orElseThrow(
                () -> new ResourceNotFoundException("patient " + req.patientId() + " not found"));
        Doctor doctor = doctors.findById(req.doctorId()).orElseThrow(
                () -> new ResourceNotFoundException("doctor " + req.doctorId() + " not found"));
        Hospital hospital = hospitals.findById(req.hospitalId()).orElseThrow(
                () -> new ResourceNotFoundException(
                        "hospital " + req.hospitalId() + " not found"));
        Appointment appointment = new Appointment();
        appointment.setPatient(patient);
        appointment.setDoctor(doctor);
        appointment.setHospital(hospital);
        appointment.setAppointmentTime(req.appointmentTime());
        appointment.setStatus("BOOKED");
        appointment.setReason(req.reason() == null || req.reason().isBlank() ? null : req.reason());
        try {
            return appointments.saveAndFlush(appointment);
        } catch (org.springframework.dao.DataIntegrityViolationException e) {
            // P0 TOCTOU: concurrent inserts both passed the exists() check;
            // the DB UNIQUE(doctor_id, appointment_time, status) backstop fires here.
            throw new DoubleBookingException("doctor " + req.doctorId()
                    + " already booked at " + req.appointmentTime());
        }
    }

    @Transactional
    public Appointment cancel(Long id) {
        Appointment appointment = get(id);
        appointment.setStatus("CANCELLED");
        return appointments.save(appointment);
    }

    /**
     * Front-desk reschedule: moves a BOOKED appointment to a new future slot.
     * The duplicate check mirrors booking so a reschedule can never create two
     * BOOKED rows for the same doctor and time.
     */
    @Transactional
    public Appointment reschedule(Long id, LocalDateTime newTime) {
        Appointment appointment = get(id);
        if (!"BOOKED".equalsIgnoreCase(appointment.getStatus())) {
            throw new IllegalStateException(
                    "appointment " + id + " is " + appointment.getStatus()
                            + " - only BOOKED appointments can be rescheduled");
        }
        if (newTime == null) {
            throw new IllegalArgumentException("appointmentTime is required");
        }
        if (newTime.isBefore(LocalDateTime.now())) {
            throw new IllegalArgumentException("appointmentTime must be in the future");
        }
        Long doctorId = appointment.getDoctor().getId();
        boolean clash = appointments.existsByDoctorIdAndAppointmentTimeAndStatus(
                doctorId, newTime, "BOOKED");
        if (clash) {
            throw new DoubleBookingException("doctor " + doctorId
                    + " already booked at " + newTime);
        }
        appointment.setAppointmentTime(newTime);
        try {
            return appointments.saveAndFlush(appointment);
        } catch (org.springframework.dao.DataIntegrityViolationException e) {
            throw new DoubleBookingException("doctor " + doctorId
                    + " already booked at " + newTime);
        }
    }

    /**
     * One doctor's assigned appointments, earliest first. {@code filter} is a
     * server-side lens: all | today | upcoming | completed | cancelled so the
     * Doctor module never ships every row to the client.
     */
    @Transactional(readOnly = true)
    public List<Appointment> forDoctor(Long doctorId, String filter) {
        doctors.findById(doctorId).orElseThrow(
                () -> new ResourceNotFoundException("doctor " + doctorId + " not found"));
        List<Appointment> rows = appointments.findByDoctorIdOrderByAppointmentTimeAsc(doctorId);
        if (filter == null || filter.isBlank() || filter.equalsIgnoreCase("all")) {
            return rows;
        }
        LocalDateTime now = LocalDateTime.now();
        return switch (filter.toLowerCase()) {
            case "today" -> {
                LocalDateTime from = LocalDate.now().atStartOfDay();
                LocalDateTime to = from.plusDays(1);
                yield rows.stream().filter(a -> !a.getAppointmentTime().isBefore(from)
                        && a.getAppointmentTime().isBefore(to)
                        && !"CANCELLED".equalsIgnoreCase(a.getStatus()))
                        .collect(Collectors.toList());
            }
            case "upcoming" -> rows.stream().filter(a -> a.getAppointmentTime().isAfter(now)
                    && "BOOKED".equalsIgnoreCase(a.getStatus())).collect(Collectors.toList());
            case "completed" -> rows.stream()
                    .filter(a -> "COMPLETED".equalsIgnoreCase(a.getStatus()))
                    .collect(Collectors.toList());
            case "cancelled" -> rows.stream()
                    .filter(a -> "CANCELLED".equalsIgnoreCase(a.getStatus()))
                    .collect(Collectors.toList());
            default -> throw new IllegalArgumentException(
                    "unknown filter '" + filter + "' (all|today|upcoming|completed|cancelled)");
        };
    }

    /**
     * Consultation done: a Doctor marks their own BOOKED appointment COMPLETED.
     * Only the assigned doctor may complete; a non-assigned doctor gets 403.
     */
    @Transactional
    public Appointment complete(Long id, Long doctorId) {
        Appointment appointment = get(id);
        if (doctorId == null || !appointment.getDoctor().getId().equals(doctorId)) {
            throw new ForbiddenException(
                    "doctor " + doctorId + " cannot complete appointment " + id
                            + " — not assigned");
        }
        if (!"BOOKED".equalsIgnoreCase(appointment.getStatus())) {
            throw new IllegalStateException(
                    "appointment " + id + " is " + appointment.getStatus()
                            + " — only BOOKED appointments can be completed");
        }
        appointment.setStatus("COMPLETED");
        return appointments.save(appointment);
    }
}
