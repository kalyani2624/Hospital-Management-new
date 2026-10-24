package gov.hospital.hub.controller;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import gov.hospital.hub.entity.MedicalRecord;
import gov.hospital.hub.service.MedicalRecordService;
import gov.hospital.hub.service.MedicalRecordService.CreateRecordRequest;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

@RestController
@RequestMapping("/api/records")
public class MedicalRecordController {

    private final MedicalRecordService records;

    public MedicalRecordController(MedicalRecordService records) {
        this.records = records;
    }

    @GetMapping("/patient/{patientId}")
    public List<MedicalRecord> byPatient(@PathVariable Long patientId,
            @org.springframework.web.bind.annotation.RequestParam(required = false) Integer page,
            @org.springframework.web.bind.annotation.RequestParam(required = false) Integer size) {
        // P0 pagination: ?page=&size= (size capped at 20); no params -> full list (demo compat).
        if (page == null && size == null) {
            return records.byPatient(patientId);
        }
        int p = page == null ? 0 : Math.max(0, page);
        int s = size == null ? 20 : Math.min(Math.max(1, size), 20);
        return records.byPatient(patientId,
                org.springframework.data.domain.PageRequest.of(p, s)).getContent();
    }

    /** Doctor module: Consultation History for one doctor (demo-scoped to self). */
    @GetMapping("/doctor/{doctorId}")
    public List<MedicalRecord> byDoctor(@PathVariable Long doctorId) {
        return records.byDoctor(doctorId);
    }

    public record RecordBody(@NotNull Long patientId, @NotNull Long hospitalId, Long doctorId,
            @NotBlank String diagnosis, String treatmentNotes, String prescription) {
    }

    @PostMapping
    public ResponseEntity<MedicalRecord> create(@Valid @RequestBody RecordBody body) {
        MedicalRecord saved = records.create(new CreateRecordRequest(body.patientId(),
                body.hospitalId(), body.doctorId(), body.diagnosis(), body.treatmentNotes(),
                body.prescription()));
        return ResponseEntity.status(HttpStatus.CREATED).body(saved);
    }
}
