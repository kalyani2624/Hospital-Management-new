package gov.hospital.hub.soap;

import java.util.Map;

import org.springframework.ws.server.endpoint.annotation.Endpoint;
import org.springframework.ws.server.endpoint.annotation.PayloadRoot;
import org.springframework.ws.server.endpoint.annotation.RequestPayload;
import org.springframework.ws.server.endpoint.annotation.ResponsePayload;
import org.springframework.transaction.annotation.Transactional;

import gov.hospital.hub.repository.AppointmentRepository;
import gov.hospital.hub.service.CentralService;

/**
 * SOAP reports for legacy govt integrations that cannot call REST.
 * WSDL served at /ws/central.wsdl, endpoint at /ws.
 */
@Endpoint
public class CensusEndpoint {

    public static final String NAMESPACE = "http://gov.hospital.hub/central";

    private final CentralService central;
    private final AppointmentRepository appointments;

    public CensusEndpoint(CentralService central, AppointmentRepository appointments) {
        this.central = central;
        this.appointments = appointments;
    }

    @PayloadRoot(namespace = NAMESPACE, localPart = "getCentralCensusRequest")
    @ResponsePayload
    public GetCentralCensusResponse getCentralCensus(
            @RequestPayload GetCentralCensusRequest request) {
        Map<String, Object> census = central.census();
        GetCentralCensusResponse response = new GetCentralCensusResponse();
        response.setHospitals(((Number) census.get("hospitals")).longValue());
        response.setDoctors(((Number) census.get("doctors")).longValue());
        response.setPatients(((Number) census.get("patients")).longValue());
        response.setAppointments(((Number) census.get("appointments")).longValue());
        response.setTotalBeds(((Number) census.get("totalBeds")).intValue());
        response.setOccupiedBeds(((Number) census.get("occupiedBeds")).intValue());
        return response;
    }

    @PayloadRoot(namespace = NAMESPACE, localPart = "getHospitalLoadRequest")
    @ResponsePayload
    public GetHospitalLoadResponse getHospitalLoad(
            @RequestPayload GetHospitalLoadRequest request) {
        Map<String, Object> load = central.hospitalLoad(request.getHospitalId());
        GetHospitalLoadResponse response = new GetHospitalLoadResponse();
        response.setHospitalId(((Number) load.get("hospitalId")).longValue());
        response.setHospitalName((String) load.get("hospitalName"));
        response.setDoctors(((Number) load.get("doctors")).intValue());
        response.setAppointments(((Number) load.get("appointments")).intValue());
        response.setTotalBeds(((Number) load.get("totalBeds")).intValue());
        response.setOccupiedBeds(((Number) load.get("occupiedBeds")).intValue());
        return response;
    }

    @PayloadRoot(namespace = NAMESPACE, localPart = "getDoctorScheduleRequest")
    @ResponsePayload
    @Transactional(readOnly = true)
    public GetDoctorScheduleResponse getDoctorSchedule(
            @RequestPayload GetDoctorScheduleRequest request) {
        GetDoctorScheduleResponse response = new GetDoctorScheduleResponse();
        // WHY join-fetch + transaction: Appointment.patient is LAZY and WS threads
        // have no open-in-view session; direct findByDoctorId caused
        // LazyInitializationException (Patient#1 no session).
        appointments.findByDoctorIdWithPatient(request.getDoctorId()).forEach(a -> {
            GetDoctorScheduleResponse.ScheduleEntry entry =
                    new GetDoctorScheduleResponse.ScheduleEntry();
            entry.setAppointmentId(a.getId());
            entry.setPatientCentralId(a.getPatient().getCentralId());
            entry.setAppointmentTime(String.valueOf(a.getAppointmentTime()));
            entry.setStatus(a.getStatus());
            response.getSchedule().add(entry);
        });
        return response;
    }
}
