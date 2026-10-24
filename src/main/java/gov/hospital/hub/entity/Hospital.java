package gov.hospital.hub.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.validation.constraints.NotBlank;

/**
 * Central registry of every govt hospital. Single dashboard reads from this one table.
 * WHY central table: ends fragmented per-hospital databases; every other row carries hospital_id FK.
 */
@Entity
@Table(name = "hospitals")
public class Hospital {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank(message = "hospital name is required")
    @Column(nullable = false)
    private String name;

    @NotBlank(message = "city is required")
    @Column(nullable = false)
    private String city;

    /** CENTRAL, DISTRICT, COMMUNITY. */
    private String type = "DISTRICT";

    private int totalBeds;

    public Hospital() {
    }

    public Hospital(String name, String city, String type, int totalBeds) {
        this.name = name;
        this.city = city;
        this.type = type;
        this.totalBeds = totalBeds;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getCity() {
        return city;
    }

    public void setCity(String city) {
        this.city = city;
    }

    public String getType() {
        return type;
    }

    public void setType(String type) {
        this.type = type;
    }

    public int getTotalBeds() {
        return totalBeds;
    }

    public void setTotalBeds(int totalBeds) {
        this.totalBeds = totalBeds;
    }
}
