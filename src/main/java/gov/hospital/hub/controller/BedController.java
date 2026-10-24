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

import gov.hospital.hub.entity.BedInventory;
import gov.hospital.hub.service.BedService;
import gov.hospital.hub.service.BedService.BedRequest;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

@RestController
@RequestMapping("/api/beds")
public class BedController {

    private final BedService beds;

    public BedController(BedService beds) {
        this.beds = beds;
    }

    @GetMapping
    public List<BedInventory> all(
            @RequestParam(required = false) Integer page,
            @RequestParam(required = false) Integer size) {
        // P0 pagination: ?page=&size= (size capped at 20); no params -> full list (demo compat).
        if (page == null && size == null) {
            return beds.all();
        }
        int p = page == null ? 0 : Math.max(0, page);
        int s = size == null ? 20 : Math.min(Math.max(1, size), 20);
        return beds.all(org.springframework.data.domain.PageRequest.of(p, s)).getContent();
    }

    @GetMapping("/hospital/{hospitalId}")
    public List<BedInventory> byHospital(@PathVariable Long hospitalId) {
        return beds.byHospital(hospitalId);
    }

    public record BedBody(@NotNull Long hospitalId, @NotBlank String wardType,
            @Min(0) int total) {
    }

    @PostMapping
    public ResponseEntity<BedInventory> upsert(@Valid @RequestBody BedBody body) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(beds.upsert(
                        new BedRequest(body.hospitalId(), body.wardType(), body.total())));
    }

    /** Admit decrements availability; 409 when full. */
    @PostMapping("/admit")
    public BedInventory admit(@RequestParam Long hospitalId, @RequestParam String wardType) {
        return beds.admit(hospitalId, wardType);
    }

    /** Discharge frees one bed. */
    @PostMapping("/discharge")
    public BedInventory discharge(@RequestParam Long hospitalId,
            @RequestParam String wardType) {
        return beds.discharge(hospitalId, wardType);
    }
}
