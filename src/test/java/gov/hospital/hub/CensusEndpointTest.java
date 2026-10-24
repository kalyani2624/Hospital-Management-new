package gov.hospital.hub;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;

import java.time.LocalDateTime;
import java.util.List;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.transaction.annotation.Transactional;

import gov.hospital.hub.entity.Appointment;
import gov.hospital.hub.entity.Doctor;
import gov.hospital.hub.entity.Hospital;
import gov.hospital.hub.entity.Patient;
import gov.hospital.hub.repository.AppointmentRepository;
import gov.hospital.hub.repository.DoctorRepository;
import gov.hospital.hub.repository.HospitalRepository;
import gov.hospital.hub.repository.PatientRepository;
import gov.hospital.hub.service.AppointmentService;
import gov.hospital.hub.service.AppointmentService.BookRequest;
import gov.hospital.hub.soap.CensusEndpoint;
import gov.hospital.hub.soap.GetDoctorScheduleRequest;
import gov.hospital.hub.soap.GetDoctorScheduleResponse;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;

/**
 * Proves Bug-1 fix: SOAP getDoctorSchedule no longer throws
 * LazyInitializationException for Patient#id (no session).
 * Naming: methodName_stateUnderTest_expectedBehavior.
 */
@SpringBootTest
@Transactional
class CensusEndpointTest {

    @Autowired
    private CensusEndpoint endpoint;
    @Autowired
    private AppointmentService appointments;
    @Autowired
    private AppointmentRepository appointmentRepository;
    @Autowired
    private HospitalRepository hospitals;
    @Autowired
    private DoctorRepository doctors;
    @Autowired
    private PatientRepository patients;
    @PersistenceContext
    private EntityManager entityManager;

    private Doctor seedSchedule(String centralId) {
        Hospital hospital = hospitals.save(new Hospital("SOAP Test Hospital", "Delhi",
                "CENTRAL", 100));
        Doctor doctor = doctors.save(new Doctor("Dr Soap", "Cardiology", hospital, null));
        Patient patient = patients.save(
                new Patient(centralId, "Soap Patient", 33, "F", "9999999999", hospital));
        LocalDateTime slot = LocalDateTime.now().plusDays(3).withNano(0);
        appointments.book(new BookRequest(patient.getId(), doctor.getId(), hospital.getId(),
                slot, null));
        return doctor;
    }

    @Test
    void getDoctorSchedule_seededDoctor_returnsEntryWithPatientCentralId() {
        String centralId = "CENT-SOAP-" + System.nanoTime();
        Doctor doctor = seedSchedule(centralId);
        GetDoctorScheduleRequest request = new GetDoctorScheduleRequest();
        request.setDoctorId(doctor.getId());
        GetDoctorScheduleResponse response = endpoint.getDoctorSchedule(request);
        assertFalse(response.getSchedule().isEmpty());
        assertEquals(centralId, response.getSchedule().get(0).getPatientCentralId());
    }

    @Test
    void findByDoctorIdWithPatient_afterClear_patientStillInitialized() {
        String centralId = "CENT-SOAP-JOIN-" + System.nanoTime();
        Doctor doctor = seedSchedule(centralId);
        entityManager.flush();
        entityManager.clear();
        // WHY clear: detaches everything; without join-fetch the next line would
        // throw LazyInitializationException (Bug-1 repro). Join-fetch keeps it loaded.
        List<Appointment> rows = appointmentRepository.findByDoctorIdWithPatient(doctor.getId());
        assertFalse(rows.isEmpty());
        assertEquals(centralId, rows.get(0).getPatient().getCentralId());
    }
}
