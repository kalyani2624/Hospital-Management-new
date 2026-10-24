package gov.hospital.hub.controller;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import gov.hospital.hub.entity.Hospital;
import gov.hospital.hub.service.HospitalService;
import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/hospitals")
public class HospitalController {

    private final HospitalService hospitals;

    public HospitalController(HospitalService hospitals) {
        this.hospitals = hospitals;
    }

    @GetMapping
    public List<Hospital> list(
            @org.springframework.web.bind.annotation.RequestParam(required = false) Integer page,
            @org.springframework.web.bind.annotation.RequestParam(required = false) Integer size) {
        // P0 pagination: ?page=&size= (size capped at 20); no params -> full list (demo compat).
        if (page == null && size == null) {
            return hospitals.list();
        }
        int p = page == null ? 0 : Math.max(0, page);
        int s = size == null ? 20 : Math.min(Math.max(1, size), 20);
        return hospitals
                .list(org.springframework.data.domain.PageRequest.of(p, s)).getContent();
    }

    @GetMapping("/{id}")
    public Hospital get(@PathVariable Long id) {
        return hospitals.get(id);
    }

    @PostMapping
    public ResponseEntity<Hospital> create(@Valid @RequestBody Hospital hospital) {
        return ResponseEntity.status(HttpStatus.CREATED).body(hospitals.create(hospital));
    }

    @PutMapping("/{id}")
    public Hospital update(@PathVariable Long id, @Valid @RequestBody Hospital patch) {
        return hospitals.update(id, patch);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        hospitals.delete(id);
        return ResponseEntity.noContent().build();
    }
}
