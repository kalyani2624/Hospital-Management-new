package gov.hospital.hub.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.validation.constraints.NotBlank;

/**
 * Inter-hospital referral: patient moves from one govt hospital to another
 * without losing history because both rows live in the same DB.
 */
@Entity
@Table(name = "referrals")
public class Referral {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "patient_id", nullable = false)
    private Patient patient;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "from_hospital_id", nullable = false)
    private Hospital fromHospital;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "to_hospital_id", nullable = false)
    private Hospital toHospital;

    @NotBlank(message = "reason is required")
    @Column(nullable = false)
    private String reason;

    /** PENDING, ACCEPTED, COMPLETED. */
    @Column(nullable = false)
    private String status = "PENDING";

    public Referral() {
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Patient getPatient() {
        return patient;
    }

    public void setPatient(Patient patient) {
        this.patient = patient;
    }

    public Hospital getFromHospital() {
        return fromHospital;
    }

    public void setFromHospital(Hospital fromHospital) {
        this.fromHospital = fromHospital;
    }

    public Hospital getToHospital() {
        return toHospital;
    }

    public void setToHospital(Hospital toHospital) {
        this.toHospital = toHospital;
    }

    public String getReason() {
        return reason;
    }

    public void setReason(String reason) {
        this.reason = reason;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }
}
