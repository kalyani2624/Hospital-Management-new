package gov.hospital.hub.controller;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import gov.hospital.hub.entity.Referral;
import gov.hospital.hub.service.ReferralService;
import gov.hospital.hub.service.ReferralService.CreateReferralRequest;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

@RestController
@RequestMapping("/api/referrals")
public class ReferralController {

    private final ReferralService referrals;

    public ReferralController(ReferralService referrals) {
        this.referrals = referrals;
    }

    @GetMapping
    public List<Referral> list(
            @org.springframework.web.bind.annotation.RequestParam(required = false) Integer page,
            @org.springframework.web.bind.annotation.RequestParam(required = false) Integer size) {
        // P0 pagination: ?page=&size= (size capped at 20); no params -> full list (demo compat).
        if (page == null && size == null) {
            return referrals.list();
        }
        int p = page == null ? 0 : Math.max(0, page);
        int s = size == null ? 20 : Math.min(Math.max(1, size), 20);
        return referrals
                .list(org.springframework.data.domain.PageRequest.of(p, s)).getContent();
    }

    public record ReferralBody(@NotNull Long patientId, @NotNull Long fromHospitalId,
            @NotNull Long toHospitalId, @NotBlank String reason) {
    }

    @PostMapping
    public ResponseEntity<Referral> refer(@Valid @RequestBody ReferralBody body) {
        Referral saved = referrals.refer(new CreateReferralRequest(body.patientId(),
                body.fromHospitalId(), body.toHospitalId(), body.reason()));
        return ResponseEntity.status(HttpStatus.CREATED).body(saved);
    }

    @PutMapping("/{id}/accept")
    public Referral accept(@PathVariable Long id) {
        return referrals.accept(id);
    }
}
