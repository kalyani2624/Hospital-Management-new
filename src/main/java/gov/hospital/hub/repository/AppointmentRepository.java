package gov.hospital.hub.repository;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import gov.hospital.hub.entity.Appointment;
import gov.hospital.hub.entity.Patient;

public interface AppointmentRepository extends JpaRepository<Appointment, Long> {

    boolean existsByDoctorIdAndAppointmentTimeAndStatus(Long doctorId, LocalDateTime appointmentTime,
            String status);

    List<Appointment> findByPatientId(Long patientId);

    List<Appointment> findByDoctorId(Long doctorId);

    /** Earliest-first schedule for one doctor — the Doctor module's diary. */
    List<Appointment> findByDoctorIdOrderByAppointmentTimeAsc(Long doctorId);

    List<Appointment> findByDoctorIdAndStatusOrderByAppointmentTimeAsc(Long doctorId, String status);

    /** Distinct patients a doctor is assigned to (via their appointments). */
    @Query("select distinct a.patient from Appointment a where a.doctor.id = :doctorId")
    List<Patient> findDistinctPatientsByDoctorId(@Param("doctorId") Long doctorId);

    /**
     * Schedule read with patient join-fetched.
     * WHY: SOAP getDoctorSchedule runs outside open-in-view; without join fetch
     * accessing a.getPatient() throws LazyInitializationException (Bug-1).
     */
    @Query("select a from Appointment a join fetch a.patient where a.doctor.id = :doctorId")
    List<Appointment> findByDoctorIdWithPatient(@Param("doctorId") Long doctorId);

    List<Appointment> findByHospitalId(Long hospitalId);
}
