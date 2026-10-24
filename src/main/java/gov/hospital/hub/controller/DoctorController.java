package gov.hospital.hub.controller;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import gov.hospital.hub.entity.Department;
import gov.hospital.hub.entity.Doctor;
import gov.hospital.hub.entity.Patient;
import gov.hospital.hub.service.DoctorService;
import gov.hospital.hub.service.DoctorService.CreateDoctorRequest;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

@RestController
@RequestMapping("/api/doctors")
public class DoctorController {

    private final DoctorService doctors;

    public DoctorController(DoctorService doctors) {
        this.doctors = doctors;
    }

    @GetMapping
    public List<Doctor> list(@RequestParam(required = false) Long hospitalId,
            @RequestParam(required = false) String specialization,
            @RequestParam(required = false) Integer page,
            @RequestParam(required = false) Integer size) {
        // P0 pagination: ?page=&size= (size capped at 20); no params -> full list (demo compat).
        if (page == null && size == null) {
            return doctors.list(hospitalId, specialization);
        }
        int p = page == null ? 0 : Math.max(0, page);
        int s = size == null ? 20 : Math.min(Math.max(1, size), 20);
        return doctors.list(hospitalId, specialization,
                org.springframework.data.domain.PageRequest.of(p, s)).getContent();
    }

    @GetMapping("/{id}")
    public Doctor get(@PathVariable Long id) {
        return doctors.get(id);
    }

    @GetMapping("/hospital/{hospitalId}/departments")
    public List<Department> departments(@PathVariable Long hospitalId) {
        return doctors.departmentsOf(hospitalId);
    }

    /** Doctor module: My Patients (assigned via appointments + records). */
    @GetMapping("/{id}/patients")
    public List<Patient> patients(@PathVariable Long id) {
        return doctors.patientsOf(id);
    }

    public record DoctorBody(@NotBlank String name, @NotBlank String specialization,
            @NotNull Long hospitalId, Long departmentId) {
    }

    @PostMapping
    public ResponseEntity<Doctor> create(@Valid @RequestBody DoctorBody body) {
        Doctor saved = doctors.create(new CreateDoctorRequest(body.name(),
                body.specialization(), body.hospitalId(), body.departmentId()));
        return ResponseEntity.status(HttpStatus.CREATED).body(saved);
    }
}
