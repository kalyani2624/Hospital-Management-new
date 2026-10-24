package gov.hospital.hub.entity;

import java.time.LocalDateTime;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import jakarta.validation.constraints.NotNull;

/**
 * Appointment links patient + doctor + hospital in the single central DB.
 * Double-booking is rejected in the service layer with 409.
 * P0 TOCTOU backstop: DB UNIQUE(doctor_id, appointment_time, status) so two
 * concurrent BOOKED inserts for the same slot cannot both commit; the loser
 * gets DataIntegrityViolationException -> 409 (see AppointmentService.book).
 * Status is included so a CANCELLED row does not block re-booking the slot.
 */
@Entity
@Table(name = "appointments", uniqueConstraints = {
        @UniqueConstraint(columnNames = {"doctor_id", "appointment_time", "status"})})
public class Appointment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "patient_id", nullable = false)
    private Patient patient;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "doctor_id", nullable = false)
    private Doctor doctor;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "hospital_id", nullable = false)
    private Hospital hospital;

    /**
     * No @Future here: completed / cancelled rows legitimately hold past times
     * and Hibernate re-validates on update (status transitions), which would
     * otherwise 400 a doctor finishing yesterday's consult. The "must be
     * future" rule lives in AppointmentService.book so booking still rejects
     * past slots while history stays writable.
     */
    @NotNull(message = "appointmentTime is required")
    @Column(name = "appointment_time", nullable = false)
    private LocalDateTime appointmentTime;

    /** BOOKED, CANCELLED, COMPLETED. */
    @Column(nullable = false)
    private String status = "BOOKED";

    /** Patient's stated reason for the visit (patient portal booking). Optional. */
    private String reason;

    public Appointment() {
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Patient getPatient() {
        return patient;
    }

    public void setPatient(Patient patient) {
        this.patient = patient;
    }

    public Doctor getDoctor() {
        return doctor;
    }

    public void setDoctor(Doctor doctor) {
        this.doctor = doctor;
    }

    public Hospital getHospital() {
        return hospital;
    }

    public void setHospital(Hospital hospital) {
        this.hospital = hospital;
    }

    public LocalDateTime getAppointmentTime() {
        return appointmentTime;
    }

    public void setAppointmentTime(LocalDateTime appointmentTime) {
        this.appointmentTime = appointmentTime;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public String getReason() {
        return reason;
    }

    public void setReason(String reason) {
        this.reason = reason;
    }
}
