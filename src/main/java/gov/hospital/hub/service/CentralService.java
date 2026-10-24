package gov.hospital.hub.service;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import gov.hospital.hub.entity.BedInventory;
import gov.hospital.hub.entity.Hospital;
import gov.hospital.hub.repository.AppointmentRepository;
import gov.hospital.hub.repository.BedInventoryRepository;
import gov.hospital.hub.repository.DoctorRepository;
import gov.hospital.hub.repository.HospitalRepository;
import gov.hospital.hub.repository.PatientRepository;
import gov.hospital.hub.repository.ReferralRepository;

/**
 * Central read-model: availability + census across every hospital.
 * WHY one service: the dashboard must never fan out to per-hospital DBs.
 */
@Service
public class CentralService {

    private final HospitalRepository hospitals;
    private final DoctorRepository doctors;
    private final PatientRepository patients;
    private final AppointmentRepository appointments;
    private final BedInventoryRepository beds;
    private final ReferralRepository referrals;

    public CentralService(HospitalRepository hospitals, DoctorRepository doctors,
            PatientRepository patients, AppointmentRepository appointments,
            BedInventoryRepository beds, ReferralRepository referrals) {
        this.hospitals = hospitals;
        this.doctors = doctors;
        this.patients = patients;
        this.appointments = appointments;
        this.beds = beds;
        this.referrals = referrals;
    }

    @Transactional(readOnly = true)
    public List<Map<String, Object>> availability() {
        List<Hospital> all = hospitals.findAll();
        return all.stream().map(h -> {
            List<BedInventory> rows = beds.findByHospitalId(h.getId());
            int total = rows.stream().mapToInt(BedInventory::getTotal).sum();
            int occupied = rows.stream().mapToInt(BedInventory::getOccupied).sum();
            Map<String, Object> row = new LinkedHashMap<>();
            row.put("hospitalId", h.getId());
            row.put("hospitalName", h.getName());
            row.put("city", h.getCity());
            row.put("totalBeds", total);
            row.put("occupiedBeds", occupied);
            row.put("availableBeds", Math.max(0, total - occupied));
            row.put("wards", rows.stream().map(b -> Map.of("wardType", b.getWardType(),
                    "total", b.getTotal(), "occupied", b.getOccupied(),
                    "available", b.getAvailable())).toList());
            return row;
        }).toList();
    }

    @Transactional(readOnly = true)
    public Map<String, Object> census() {
        Map<String, Object> out = new LinkedHashMap<>();
        out.put("hospitals", hospitals.count());
        out.put("doctors", doctors.count());
        out.put("patients", patients.count());
        out.put("appointments", appointments.count());
        out.put("referrals", referrals.count());
        List<BedInventory> all = beds.findAll();
        out.put("totalBeds", all.stream().mapToInt(BedInventory::getTotal).sum());
        out.put("occupiedBeds", all.stream().mapToInt(BedInventory::getOccupied).sum());
        return out;
    }

    @Transactional(readOnly = true)
    public Map<String, Object> hospitalLoad(Long hospitalId) {
        Hospital hospital = hospitals.findById(hospitalId).orElseThrow(
                () -> new gov.hospital.hub.exception.ResourceNotFoundException(
                        "hospital " + hospitalId + " not found"));
        List<BedInventory> rows = beds.findByHospitalId(hospitalId);
        Map<String, Object> out = new LinkedHashMap<>();
        out.put("hospitalId", hospital.getId());
        out.put("hospitalName", hospital.getName());
        out.put("doctors", doctors.findByHospitalId(hospitalId).size());
        out.put("appointments", appointments.findByHospitalId(hospitalId).size());
        out.put("totalBeds", rows.stream().mapToInt(BedInventory::getTotal).sum());
        out.put("occupiedBeds", rows.stream().mapToInt(BedInventory::getOccupied).sum());
        return out;
    }
}
