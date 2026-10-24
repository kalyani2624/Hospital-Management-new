package gov.hospital.hub.controller;

import java.util.List;
import java.util.Map;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import gov.hospital.hub.service.CentralService;

/**
 * Single-dashboard reads: availability, census, per-hospital load.
 */
@RestController
@RequestMapping("/api/central")
public class CentralController {

    private final CentralService central;

    public CentralController(CentralService central) {
        this.central = central;
    }

    @GetMapping("/availability")
    public List<Map<String, Object>> availability() {
        return central.availability();
    }

    @GetMapping("/census")
    public Map<String, Object> census() {
        return central.census();
    }

    @GetMapping("/hospitals/{id}/load")
    public Map<String, Object> hospitalLoad(@PathVariable Long id) {
        return central.hospitalLoad(id);
    }
}
