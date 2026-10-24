package gov.hospital.hub.soap;

import java.util.ArrayList;
import java.util.List;

import jakarta.xml.bind.annotation.XmlAccessType;
import jakarta.xml.bind.annotation.XmlAccessorType;
import jakarta.xml.bind.annotation.XmlElement;
import jakarta.xml.bind.annotation.XmlRootElement;

@XmlAccessorType(XmlAccessType.FIELD)
@XmlRootElement(name = "getDoctorScheduleResponse", namespace = CensusEndpoint.NAMESPACE)
public class GetDoctorScheduleResponse {

    @XmlElement(name = "schedule", namespace = CensusEndpoint.NAMESPACE)
    private List<ScheduleEntry> schedule = new ArrayList<>();

    public List<ScheduleEntry> getSchedule() {
        return schedule;
    }

    public void setSchedule(List<ScheduleEntry> schedule) {
        this.schedule = schedule;
    }

    @XmlAccessorType(XmlAccessType.FIELD)
    public static class ScheduleEntry {

        @XmlElement(namespace = CensusEndpoint.NAMESPACE)
        private long appointmentId;
        @XmlElement(namespace = CensusEndpoint.NAMESPACE)
        private String patientCentralId;
        @XmlElement(namespace = CensusEndpoint.NAMESPACE)
        private String appointmentTime;
        @XmlElement(namespace = CensusEndpoint.NAMESPACE)
        private String status;

        public long getAppointmentId() {
            return appointmentId;
        }

        public void setAppointmentId(long appointmentId) {
            this.appointmentId = appointmentId;
        }

        public String getPatientCentralId() {
            return patientCentralId;
        }

        public void setPatientCentralId(String patientCentralId) {
            this.patientCentralId = patientCentralId;
        }

        public String getAppointmentTime() {
            return appointmentTime;
        }

        public void setAppointmentTime(String appointmentTime) {
            this.appointmentTime = appointmentTime;
        }

        public String getStatus() {
            return status;
        }

        public void setStatus(String status) {
            this.status = status;
        }
    }
}
