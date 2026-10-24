package gov.hospital.hub.controller;

import java.util.List;
import java.util.Map;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import gov.hospital.hub.entity.Appointment;
import gov.hospital.hub.entity.Patient;
import gov.hospital.hub.service.PatientService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;

@RestController
@RequestMapping("/api/patients")
public class PatientController {

    private final PatientService patients;

    public PatientController(PatientService patients) {
        this.patients = patients;
    }

    @GetMapping
    public List<Patient> list(
            @org.springframework.web.bind.annotation.RequestParam(required = false) Integer page,
            @org.springframework.web.bind.annotation.RequestParam(required = false) Integer size) {
        // P0 pagination: ?page=&size= (size capped at 20); no params -> full list (demo compat).
        if (page == null && size == null) {
            return patients.list();
        }
        int p = page == null ? 0 : Math.max(0, page);
        int s = size == null ? 20 : Math.min(Math.max(1, size), 20);
        return patients
                .list(org.springframework.data.domain.PageRequest.of(p, s)).getContent();
    }

    @GetMapping("/{id}")
    public Patient get(@PathVariable Long id) {
        return patients.get(id);
    }

    @GetMapping("/central/{centralId}")
    public Patient getByCentralId(@PathVariable String centralId) {
        return patients.getByCentralId(centralId);
    }

    /** Central history across all hospitals for one patient. */
    @GetMapping("/{id}/history")
    public Map<String, Object> history(@PathVariable Long id) {
        return patients.history(id);
    }

    public record PatientBody(String centralId, @NotBlank String name,
            @Min(0) int age, String gender, String phone, Long hospitalId,
            java.time.LocalDate dob, String address, String email) {
    }

    public record UpdatePatientBody(String name, String gender, String phone, Integer age,
            java.time.LocalDate dob, String address, String email) {
    }

    @PostMapping
    public ResponseEntity<Patient> create(@Valid @RequestBody PatientBody body) {
        // centralId is OPTIONAL: when blank, the service auto-generates a central ID
        // (PORTAL self-registration). Existing callers keep supplying one.
        Patient saved = patients.create(new gov.hospital.hub.service.PatientService.CreatePatientRequest(
                body.centralId(), body.name(), body.age(), body.gender(), body.phone(),
                body.hospitalId(), body.dob(), body.address(), body.email()));
        return ResponseEntity.status(HttpStatus.CREATED).body(saved);
    }

    /** Patient portal: update own demographic fields (centralId cannot change). */
    @PutMapping("/{id}")
    public Patient update(@PathVariable Long id,
            @Valid @RequestBody UpdatePatientBody body) {
        return patients.update(id, new gov.hospital.hub.service.PatientService.UpdatePatientRequest(
                body.name(), body.gender(), body.phone(), body.age(), body.dob(), body.address(),
                body.email()));
    }

    /** Patient portal: appointments for this patient, newest first. */
    @GetMapping("/{id}/appointments")
    public List<Appointment> appointments(@PathVariable Long id) {
        return patients.appointments(id);
    }
}
