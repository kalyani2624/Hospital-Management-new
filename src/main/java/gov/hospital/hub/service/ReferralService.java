package gov.hospital.hub.service;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import gov.hospital.hub.entity.Hospital;
import gov.hospital.hub.entity.Patient;
import gov.hospital.hub.entity.Referral;
import gov.hospital.hub.exception.ResourceNotFoundException;
import gov.hospital.hub.repository.HospitalRepository;
import gov.hospital.hub.repository.PatientRepository;
import gov.hospital.hub.repository.ReferralRepository;

/**
 * Demonstrates the ONE allowed setter injection in the codebase.
 * Everything else uses constructor DI; this setter is intentional so reviewers
 * can compare both styles in one project.
 */
@Service
public class ReferralService {

    private final ReferralRepository referrals;
    private final PatientRepository patients;
    private final HospitalRepository hospitals;

    private NotificationService notifications;

    public ReferralService(ReferralRepository referrals, PatientRepository patients,
            HospitalRepository hospitals) {
        this.referrals = referrals;
        this.patients = patients;
        this.hospitals = hospitals;
    }

    /** Setter DI demo - the only setter injection in the hub. */
    @Autowired
    public void setNotificationService(NotificationService notifications) {
        this.notifications = notifications;
    }

    public List<Referral> list() {
        return referrals.findAll();
    }

    /** P0 pagination: bound bulk dump, default size 20 (controller caps size). */
    public org.springframework.data.domain.Page<Referral> list(
            org.springframework.data.domain.Pageable pageable) {
        return referrals.findAll(pageable);
    }

    public record CreateReferralRequest(Long patientId, Long fromHospitalId, Long toHospitalId,
            String reason) {
    }

    @Transactional
    public Referral refer(CreateReferralRequest req) {
        // WHY backend guard: frontend Referrals.jsx blocks from==to for UX, but direct
        // POSTs bypass it — self-transfers pollute throughput metrics. Fail fast 400
        // via GlobalExceptionHandler.handleBadRequest (IllegalArgumentException -> 400).
        if (req.fromHospitalId() != null
                && req.fromHospitalId().equals(req.toHospitalId())) {
            throw new IllegalArgumentException("from and to hospitals must differ");
        }
        Patient patient = patients.findById(req.patientId()).orElseThrow(
                () -> new ResourceNotFoundException("patient " + req.patientId() + " not found"));
        Hospital from = hospitals.findById(req.fromHospitalId()).orElseThrow(
                () -> new ResourceNotFoundException(
                        "hospital " + req.fromHospitalId() + " not found"));
        Hospital to = hospitals.findById(req.toHospitalId()).orElseThrow(
                () -> new ResourceNotFoundException(
                        "hospital " + req.toHospitalId() + " not found"));
        Referral referral = new Referral();
        referral.setPatient(patient);
        referral.setFromHospital(from);
        referral.setToHospital(to);
        referral.setReason(req.reason());
        referral.setStatus("PENDING");
        Referral saved = referrals.save(referral);
        if (notifications != null) {
            notifications.send("Referral " + saved.getId() + " " + from.getName()
                    + " -> " + to.getName());
        }
        return saved;
    }

    @Transactional
    public Referral accept(Long id) {
        Referral referral = referrals.findById(id).orElseThrow(
                () -> new ResourceNotFoundException("referral " + id + " not found"));
        referral.setStatus("ACCEPTED");
        return referrals.save(referral);
    }
}
