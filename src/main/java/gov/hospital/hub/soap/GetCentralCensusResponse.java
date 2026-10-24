package gov.hospital.hub.soap;

import jakarta.xml.bind.annotation.XmlAccessType;
import jakarta.xml.bind.annotation.XmlAccessorType;
import jakarta.xml.bind.annotation.XmlElement;
import jakarta.xml.bind.annotation.XmlRootElement;

@XmlAccessorType(XmlAccessType.FIELD)
@XmlRootElement(name = "getCentralCensusResponse", namespace = CensusEndpoint.NAMESPACE)
public class GetCentralCensusResponse {

    @XmlElement(namespace = CensusEndpoint.NAMESPACE)
    private long hospitals;
    @XmlElement(namespace = CensusEndpoint.NAMESPACE)
    private long doctors;
    @XmlElement(namespace = CensusEndpoint.NAMESPACE)
    private long patients;
    @XmlElement(namespace = CensusEndpoint.NAMESPACE)
    private long appointments;
    @XmlElement(namespace = CensusEndpoint.NAMESPACE)
    private int totalBeds;
    @XmlElement(namespace = CensusEndpoint.NAMESPACE)
    private int occupiedBeds;

    public long getHospitals() {
        return hospitals;
    }

    public void setHospitals(long hospitals) {
        this.hospitals = hospitals;
    }

    public long getDoctors() {
        return doctors;
    }

    public void setDoctors(long doctors) {
        this.doctors = doctors;
    }

    public long getPatients() {
        return patients;
    }

    public void setPatients(long patients) {
        this.patients = patients;
    }

    public long getAppointments() {
        return appointments;
    }

    public void setAppointments(long appointments) {
        this.appointments = appointments;
    }

    public int getTotalBeds() {
        return totalBeds;
    }

    public void setTotalBeds(int totalBeds) {
        this.totalBeds = totalBeds;
    }

    public int getOccupiedBeds() {
        return occupiedBeds;
    }

    public void setOccupiedBeds(int occupiedBeds) {
        this.occupiedBeds = occupiedBeds;
    }
}
