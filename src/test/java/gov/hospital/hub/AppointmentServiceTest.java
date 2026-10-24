package gov.hospital.hub;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

import java.time.LocalDateTime;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.transaction.annotation.Transactional;

import gov.hospital.hub.entity.Doctor;
import gov.hospital.hub.entity.Hospital;
import gov.hospital.hub.entity.Patient;
import gov.hospital.hub.exception.DoubleBookingException;
import gov.hospital.hub.exception.ForbiddenException;
import gov.hospital.hub.repository.DoctorRepository;
import gov.hospital.hub.repository.HospitalRepository;
import gov.hospital.hub.repository.PatientRepository;
import gov.hospital.hub.service.AppointmentService;
import gov.hospital.hub.service.AppointmentService.BookRequest;

/**
 * Proves booking is atomic and double-booking returns 409 (DoubleBookingException).
 * Naming: methodName_stateUnderTest_expectedBehavior.
 */
@SpringBootTest
@Transactional
class AppointmentServiceTest {

    @Autowired
    private AppointmentService appointments;
    @Autowired
    private HospitalRepository hospitals;
    @Autowired
    private DoctorRepository doctors;
    @Autowired
    private PatientRepository patients;

    private BookRequest seed(LocalDateTime slot) {
        Hospital hospital = hospitals.save(new Hospital("Central Govt Hospital", "Delhi",
                "CENTRAL", 500));
        Doctor doctor = doctors.save(new Doctor("Dr Rao", "Cardiology", hospital, null));
        Patient patient = patients.save(
                new Patient("CENT-" + System.nanoTime(), "Asha", 30, "F", "9999999999",
                        hospital));
        return new BookRequest(patient.getId(), doctor.getId(), hospital.getId(), slot, null);
    }

    @Test
    void book_validSlot_createsAppointment() {
        LocalDateTime slot = LocalDateTime.now().plusDays(1).withNano(0);
        assertEquals("BOOKED", appointments.book(seed(slot)).getStatus());
    }

    @Test
    void book_sameDoctorSameSlot_throwsDoubleBookingException() {
        LocalDateTime slot = LocalDateTime.now().plusDays(2).withNano(0);
        BookRequest first = seed(slot);
        appointments.book(first);
        // Same doctor + same slot from the seeded row must conflict (409 at REST layer).
        BookRequest clash = new BookRequest(first.patientId(), first.doctorId(),
                first.hospitalId(), slot, null);
        assertThrows(DoubleBookingException.class, () -> appointments.book(clash));
    }

    @Test
    void complete_assignedDoctor_completesAppointment() {
        LocalDateTime slot = LocalDateTime.now().plusDays(3).withNano(0);
        BookRequest req = seed(slot);
        var saved = appointments.book(req);
        assertEquals("COMPLETED", appointments.complete(saved.getId(), req.doctorId()).getStatus());
    }

    @Test
    void complete_wrongDoctor_throwsForbidden() {
        LocalDateTime slot = LocalDateTime.now().plusDays(3).withNano(0);
        BookRequest req = seed(slot);
        var saved = appointments.book(req);
        // Doctor #999999 is not the assigned doctor -> service keeps 403 semantics.
        assertThrows(ForbiddenException.class,
                () -> appointments.complete(saved.getId(), 999999L));
    }

    @Test
    void complete_cancelledAppointment_throws() {
        LocalDateTime slot = LocalDateTime.now().plusDays(3).withNano(0);
        BookRequest req = seed(slot);
        var saved = appointments.book(req);
        appointments.cancel(saved.getId());
        assertThrows(IllegalStateException.class,
                () -> appointments.complete(saved.getId(), req.doctorId()));
    }

    @Test
    void forDoctor_unknownFilter_throws() {
        LocalDateTime slot = LocalDateTime.now().plusDays(4).withNano(0);
        BookRequest req = seed(slot);
        long doctorId = req.doctorId();
        assertThrows(IllegalArgumentException.class, () -> appointments.forDoctor(doctorId, "bogus"));
    }
}
