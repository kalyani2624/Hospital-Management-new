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
import jakarta.persistence.Transient;
import jakarta.persistence.UniqueConstraint;
import jakarta.persistence.Version;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;

/**
 * Bed stock per hospital per ward. One row per (hospital_id, ward_type).
 * Admit/discharge mutate occupied atomically inside a transaction.
 * P0 TOCTOU backstop: @Version optimistic lock — concurrent admits on the
 * last bed throw OptimisticLockException -> 409 (see GlobalExceptionHandler).
 */
@Entity
@Table(name = "bed_inventory", uniqueConstraints = {
        @UniqueConstraint(columnNames = {"hospital_id", "ward_type"})})
public class BedInventory {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "hospital_id", nullable = false)
    private Hospital hospital;

    @NotBlank(message = "wardType is required")
    @Column(name = "ward_type", nullable = false)
    private String wardType = "GENERAL";

    @Min(value = 0, message = "total must be >= 0")
    private int total;

    @Min(value = 0, message = "occupied must be >= 0")
    private int occupied;

    @Version
    private Long version;

    public BedInventory() {
    }

    public BedInventory(Hospital hospital, String wardType, int total, int occupied) {
        this.hospital = hospital;
        this.wardType = wardType;
        this.total = total;
        this.occupied = occupied;
    }

    @Transient
    public int getAvailable() {
        return Math.max(0, total - occupied);
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Hospital getHospital() {
        return hospital;
    }

    public void setHospital(Hospital hospital) {
        this.hospital = hospital;
    }

    public String getWardType() {
        return wardType;
    }

    public void setWardType(String wardType) {
        this.wardType = wardType;
    }

    public int getTotal() {
        return total;
    }

    public void setTotal(int total) {
        this.total = total;
    }

    public int getOccupied() {
        return occupied;
    }

    public void setOccupied(int occupied) {
        this.occupied = occupied;
    }

    public Long getVersion() {
        return version;
    }

    public void setVersion(Long version) {
        this.version = version;
    }
}
