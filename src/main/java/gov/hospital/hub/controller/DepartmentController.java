package gov.hospital.hub.controller;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import gov.hospital.hub.entity.Department;
import gov.hospital.hub.entity.Hospital;
import gov.hospital.hub.exception.ResourceNotFoundException;
import gov.hospital.hub.repository.DepartmentRepository;
import gov.hospital.hub.repository.HospitalRepository;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

/**
 * Department directory for the Hospital Admin workspace.
 * Departments belong to exactly one hospital; Super Admin reads it through the
 * hospital overview.
 */
@RestController
@RequestMapping("/api/departments")
public class DepartmentController {

    private final DepartmentRepository departments;
    private final HospitalRepository hospitals;

    public DepartmentController(DepartmentRepository departments, HospitalRepository hospitals) {
        this.departments = departments;
        this.hospitals = hospitals;
    }

    public record DepartmentBody(@NotBlank(message = "department name is required") String name,
            @NotNull(message = "hospitalId is required") Long hospitalId) {
    }

    public record DepartmentView(Long id, String name, Long hospitalId, String hospitalName) {
        static DepartmentView of(Department d) {
            return new DepartmentView(d.getId(), d.getName(), d.getHospital().getId(),
                    d.getHospital().getName());
        }
    }

    @GetMapping
    public List<DepartmentView> list(@RequestParam(required = false) Long hospitalId) {
        List<Department> rows = hospitalId == null
                ? departments.findAll()
                : departments.findByHospitalId(hospitalId);
        return rows.stream().map(DepartmentView::of).toList();
    }

    @PostMapping
    public ResponseEntity<DepartmentView> create(@Valid @RequestBody DepartmentBody body) {
        Hospital hospital = hospitals.findById(body.hospitalId()).orElseThrow(
                () -> new ResourceNotFoundException("hospital " + body.hospitalId() + " not found"));
        Department saved = departments.save(new Department(body.name().trim(), hospital));
        return ResponseEntity.status(HttpStatus.CREATED).body(DepartmentView.of(saved));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        Department department = departments.findById(id).orElseThrow(
                () -> new ResourceNotFoundException("department " + id + " not found"));
        departments.delete(department);
        return ResponseEntity.noContent().build();
    }
}
