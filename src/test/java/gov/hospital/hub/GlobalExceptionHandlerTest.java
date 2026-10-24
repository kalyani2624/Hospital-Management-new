package gov.hospital.hub;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.context.WebApplicationContext;

/**
 * REST contract: 201 happy path, 400 validation/parse, 404 missing, 409 duplicate.
 * Covers Bug-2 (duplicate centralId -> 409) and Bug-3 (missing int -> 400).
 * Naming: methodName_stateUnderTest_expectedBehavior.
 */
@SpringBootTest
@Transactional
class GlobalExceptionHandlerTest {

    @Autowired
    private WebApplicationContext webApplicationContext;

    @Autowired
    private gov.hospital.hub.repository.HospitalRepository hospitals;

    private MockMvc mockMvc;

    @BeforeEach
    void setupMockMvc() {
        mockMvc = MockMvcBuilders.webAppContextSetup(webApplicationContext).build();
    }

    @Test
    void createPatient_duplicateCentralId_secondReturns409() throws Exception {
        String centralId = "CENT-REST-" + System.nanoTime();
        String body = "{\"centralId\":\"" + centralId
                + "\",\"name\":\"Asha\",\"age\":30,\"gender\":\"F\",\"phone\":\"999\"}";
        mockMvc.perform(post("/api/patients").contentType(MediaType.APPLICATION_JSON)
                .content(body)).andExpect(status().isCreated());
        mockMvc.perform(post("/api/patients").contentType(MediaType.APPLICATION_JSON)
                .content(body)).andExpect(status().isConflict())
                .andExpect(jsonPath("$.status").value(409));
    }

    @Test
    void createPatient_missingAge_returns400Not500() throws Exception {
        String body = "{\"centralId\":\"CENT-NOAGE-" + System.nanoTime()
                + "\",\"name\":\"No Age\"}";
        mockMvc.perform(post("/api/patients").contentType(MediaType.APPLICATION_JSON)
                .content(body)).andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status").value(400));
    }

    @Test
    void createBed_missingTotal_returns400Not500() throws Exception {
        String body = "{\"hospitalId\":1,\"wardType\":\"GENERAL\"}";
        mockMvc.perform(post("/api/beds").contentType(MediaType.APPLICATION_JSON)
                .content(body)).andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status").value(400));
    }

    @Test
    void createHospital_blankName_returns400() throws Exception {
        String body = "{\"name\":\"\",\"city\":\"Delhi\",\"totalBeds\":10}";
        mockMvc.perform(post("/api/hospitals").contentType(MediaType.APPLICATION_JSON)
                .content(body)).andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status").value(400));
    }

    @Test
    void getHospital_unknownId_returns404() throws Exception {
        mockMvc.perform(get("/api/hospitals/999999"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.status").value(404));
    }

    @Test
    void centralCensus_returns200WithCounts() throws Exception {
        mockMvc.perform(get("/api/central/census")).andExpect(status().isOk())
                .andExpect(jsonPath("$.hospitals").exists())
                .andExpect(jsonPath("$.doctors").exists())
                .andExpect(jsonPath("$.patients").exists());
    }

    @Test
    void bedsUpsert_validBody_returns201() throws Exception {
        gov.hospital.hub.entity.Hospital hospital = hospitals.save(
                new gov.hospital.hub.entity.Hospital("Bed REST Hospital", "Pune", "DISTRICT",
                        20));
        String bedBody = "{\"hospitalId\":" + hospital.getId()
                + ",\"wardType\":\"GENERAL\",\"total\":6}";
        mockMvc.perform(post("/api/beds").contentType(MediaType.APPLICATION_JSON)
                .content(bedBody)).andExpect(status().isCreated())
                .andExpect(jsonPath("$.total").value(6));
    }
}
