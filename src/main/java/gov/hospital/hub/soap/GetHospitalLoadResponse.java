package gov.hospital.hub.soap;

import jakarta.xml.bind.annotation.XmlAccessType;
import jakarta.xml.bind.annotation.XmlAccessorType;
import jakarta.xml.bind.annotation.XmlElement;
import jakarta.xml.bind.annotation.XmlRootElement;

@XmlAccessorType(XmlAccessType.FIELD)
@XmlRootElement(name = "getHospitalLoadResponse", namespace = CensusEndpoint.NAMESPACE)
public class GetHospitalLoadResponse {

    @XmlElement(namespace = CensusEndpoint.NAMESPACE)
    private long hospitalId;
    @XmlElement(namespace = CensusEndpoint.NAMESPACE)
    private String hospitalName;
    @XmlElement(namespace = CensusEndpoint.NAMESPACE)
    private int doctors;
    @XmlElement(namespace = CensusEndpoint.NAMESPACE)
    private int appointments;
    @XmlElement(namespace = CensusEndpoint.NAMESPACE)
    private int totalBeds;
    @XmlElement(namespace = CensusEndpoint.NAMESPACE)
    private int occupiedBeds;

    public long getHospitalId() {
        return hospitalId;
    }

    public void setHospitalId(long hospitalId) {
        this.hospitalId = hospitalId;
    }

    public String getHospitalName() {
        return hospitalName;
    }

    public void setHospitalName(String hospitalName) {
        this.hospitalName = hospitalName;
    }

    public int getDoctors() {
        return doctors;
    }

    public void setDoctors(int doctors) {
        this.doctors = doctors;
    }

    public int getAppointments() {
        return appointments;
    }

    public void setAppointments(int appointments) {
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
