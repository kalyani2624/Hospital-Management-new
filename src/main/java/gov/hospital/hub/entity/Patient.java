package gov.hospital.hub.entity;

import java.time.LocalDate;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;

/**
 * Patient has ONE centralId across all govt hospitals.
 * WHY: centralId ends duplicate/fragmented patient records; history is looked up by centralId.
 */
@Entity
@Table(name = "patients")
public class Patient {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank(message = "centralId is required")
    @Column(name = "central_id", nullable = false, unique = true)
    private String centralId;

    @NotBlank(message = "patient name is required")
    @Column(nullable = false)
    private String name;

    @Min(value = 0, message = "age must be >= 0")
    private int age;

    private String gender;

    private String phone;

    /** Date of birth (patient portal registration). Optional for walk-in desk records. */
    private LocalDate dob;

    private String address;

    private String email;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "hospital_id")
    private Hospital registeredHospital;

    public Patient() {
    }

    public Patient(String centralId, String name, int age, String gender, String phone,
            Hospital registeredHospital) {
        this.centralId = centralId;
        this.name = name;
        this.age = age;
        this.gender = gender;
        this.phone = phone;
        this.registeredHospital = registeredHospital;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getCentralId() {
        return centralId;
    }

    public void setCentralId(String centralId) {
        this.centralId = centralId;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public int getAge() {
        return age;
    }

    public void setAge(int age) {
        this.age = age;
    }

    public String getGender() {
        return gender;
    }

    public void setGender(String gender) {
        this.gender = gender;
    }

    public String getPhone() {
        return phone;
    }

    public void setPhone(String phone) {
        this.phone = phone;
    }

    public LocalDate getDob() {
        return dob;
    }

    public void setDob(LocalDate dob) {
        this.dob = dob;
    }

    public String getAddress() {
        return address;
    }

    public void setAddress(String address) {
        this.address = address;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public Hospital getRegisteredHospital() {
        return registeredHospital;
    }

    public void setRegisteredHospital(Hospital registeredHospital) {
        this.registeredHospital = registeredHospital;
    }
}
