package gov.hospital.hub.soap;

import jakarta.xml.bind.annotation.XmlAccessType;
import jakarta.xml.bind.annotation.XmlAccessorType;
import jakarta.xml.bind.annotation.XmlRootElement;

/** Empty request: census covers the whole hub. */
@XmlAccessorType(XmlAccessType.FIELD)
@XmlRootElement(name = "getCentralCensusRequest", namespace = CensusEndpoint.NAMESPACE)
public class GetCentralCensusRequest {
}
