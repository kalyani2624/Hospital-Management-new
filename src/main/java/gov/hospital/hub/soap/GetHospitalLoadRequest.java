package gov.hospital.hub.soap;

import jakarta.xml.bind.annotation.XmlAccessType;
import jakarta.xml.bind.annotation.XmlAccessorType;
import jakarta.xml.bind.annotation.XmlElement;
import jakarta.xml.bind.annotation.XmlRootElement;

@XmlAccessorType(XmlAccessType.FIELD)
@XmlRootElement(name = "getHospitalLoadRequest", namespace = CensusEndpoint.NAMESPACE)
public class GetHospitalLoadRequest {

    @XmlElement(namespace = CensusEndpoint.NAMESPACE)
    private long hospitalId;

    public long getHospitalId() {
        return hospitalId;
    }

    public void setHospitalId(long hospitalId) {
        this.hospitalId = hospitalId;
    }
}
