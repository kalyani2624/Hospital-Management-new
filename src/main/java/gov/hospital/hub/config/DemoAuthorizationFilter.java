package gov.hospital.hub.config;

import java.io.BufferedReader;
import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.ReadListener;
import jakarta.servlet.ServletInputStream;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletRequestWrapper;
import jakarta.servlet.http.HttpServletResponse;

/**
 * DEMO-scoped authorization for the MediCore staff roles.
 *
 * <p><strong>Honest limitation (do NOT ship as real security):</strong> the
 * project has no Spring Security / sessions. Role + identity travel as plain
 * headers ({@code X-Demo-Role}, {@code X-Demo-Doctor-Id},
 * {@code X-Demo-Hospital-Id}) that a client can forge, so this never replaces
 * OAuth2/JWT + Spring Security in production. What the filter proves is the
 * SHAPE of the role rules:
 * <ul>
 * <li><b>Doctor</b>: no booking/cancellation/registration/referral/bed work;
 * only their own diary, patients and notes.</li>
 * <li><b>Receptionist</b>: may register patients and book/cancel/reschedule
 * appointments; may not run hospitals, doctors, beds, referrals or records.</li>
 * <li><b>Hospital Admin</b>: may manage own-hospital doctors, departments,
 * beds and referrals; may not book, register patients, edit hospitals or read
 * clinical records.</li>
 * <li><b>Super Admin</b>: monitoring + hospital CRUD only; no operational
 * booking, registration, clinical or bed/referral work.</li>
 * </ul>
 * The React app attaches these headers for staff sessions; public and
 * patient-portal calls send none and are untouched.
 */
@Component
public class DemoAuthorizationFilter extends OncePerRequestFilter {

    static final String ROLE_HEADER = "X-Demo-Role";
    static final String DOCTOR_ID_HEADER = "X-Demo-Doctor-Id";
    static final String HOSPITAL_ID_HEADER = "X-Demo-Hospital-Id";

    private static final Logger log = LoggerFactory.getLogger(DemoAuthorizationFilter.class);

    private enum Role {
        DOCTOR, RECEPTIONIST, HOSPITAL_ADMIN, SUPER_ADMIN
    }

    /** Matches {"doctorId": 3} — used without a JSON dependency on the classpath. */
    private static final Pattern DOCTOR_ID_BODY = Pattern.compile("\"doctorId\"\\s*:\\s*(\\d+)");
    private static final Pattern HOSPITAL_ID_BODY = Pattern.compile("\"hospitalId\"\\s*:\\s*(\\d+)");
    private static final Pattern FROM_HOSPITAL_ID_BODY = Pattern.compile("\"fromHospitalId\"\\s*:\\s*(\\d+)");

    private static final Pattern DOCTOR_PATH = Pattern.compile("^/api/appointments/doctor/(\\d+)$");
    private static final Pattern RECORDS_DOCTOR_PATH = Pattern.compile("^/api/records/doctor/(\\d+)$");
    private static final Pattern DOCTOR_PATIENTS_PATH = Pattern.compile("^/api/doctors/(\\d+)/patients$");
    private static final Pattern COMPLETE_PATH = Pattern.compile("^/api/appointments/\\d+/complete$");
    private static final Pattern CANCEL_PATH = Pattern.compile("^/api/appointments/\\d+/cancel$");
    private static final Pattern RESCHEDULE_PATH = Pattern.compile("^/api/appointments/\\d+/reschedule$");
    private static final Pattern PATIENT_UPDATE_PATH = Pattern.compile("^/api/patients/\\d+$");
    private static final Pattern REFERRAL_ACCEPT_PATH = Pattern.compile("^/api/referrals/\\d+/accept$");
    private static final Pattern HISTORY_PATH = Pattern.compile("^/api/patients/\\d+/history$");
    private static final Pattern PATIENT_APTS_PATH = Pattern.compile("^/api/patients/\\d+/appointments$");
    private static final Pattern PATIENT_CENTRAL_PATH = Pattern.compile("^/api/patients/central/.*");
    private static final Pattern HOSPITAL_ITEM_PATH = Pattern.compile("^/api/hospitals/\\d+$");
    private static final Pattern DEPARTMENT_ITEM_PATH = Pattern.compile("^/api/departments/\\d+$");

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response,
            FilterChain chain) throws ServletException, IOException {
        String uri = request.getRequestURI();
        Role role = parseRole(request.getHeader(ROLE_HEADER));
        if (!uri.startsWith("/api/") || role == null) {
            chain.doFilter(request, response);
            return; // Demo claims are optional; public and patient calls are untouched.
        }
        if (role == Role.DOCTOR) {
            handleDoctor(request, response, chain, uri);
            return;
        }
        handleStaff(request, response, chain, uri, role);
    }

    // ------------------------------------------------------------------
    // Doctor module (unchanged rules)
    // ------------------------------------------------------------------
    private void handleDoctor(HttpServletRequest request, HttpServletResponse response,
            FilterChain chain, String uri) throws ServletException, IOException {
        Long doctorId = parseLong(request.getHeader(DOCTOR_ID_HEADER));
        if (doctorId == null) {
            deny(response, request, Role.DOCTOR, "Missing or invalid " + DOCTOR_ID_HEADER
                    + " - choose your doctor identity at sign-in before using the Doctor module.");
            return;
        }

        if (isRestrictedMutation(request.getMethod(), uri)) {
            deny(response, request, Role.DOCTOR,
                    "Doctor role may not perform this action (demo rule) - booking, cancellation, "
                            + "patient registration and referral/bed triage belong to reception/admin.");
            return;
        }

        Long scoped = scopedResource(uri);
        if (scoped != null) {
            if (!scoped.equals(doctorId)) {
                deny(response, request, Role.DOCTOR,
                        "Doctor may only view their own schedule / patients / notes (demo rule).");
                return;
            }
            chain.doFilter(request, response);
            return;
        }

        if (request.getMethod().equals("PUT") && COMPLETE_PATH.matcher(uri).matches()) {
            if (!matchesQueryLong(request, "doctorId", doctorId)) {
                deny(response, request, Role.DOCTOR,
                        "Doctor may only complete their own appointment (demo rule).");
                return;
            }
            chain.doFilter(request, response);
            return;
        }

        if (request.getMethod().equals("POST") && uri.equals("/api/records")) {
            BodyBufferingRequest buffered = new BodyBufferingRequest(request);
            if (!matchesBodyLong(buffered, DOCTOR_ID_BODY, doctorId)) {
                deny(response, request, Role.DOCTOR,
                        "Doctor must save the clinical note under their own id (demo rule).");
                return;
            }
            chain.doFilter(buffered, response);
            return;
        }

        if (isReadAllowedForDoctor(request.getMethod(), uri)) {
            chain.doFilter(request, response);
            return;
        }

        deny(response, request, Role.DOCTOR,
                "Doctor role may not access this resource (demo rule) - the full registry, "
                        + "all-appointments diary and referral triage are outside the Doctor module.");
    }

    // ------------------------------------------------------------------
    // Super Admin / Hospital Admin / Receptionist
    // ------------------------------------------------------------------
    private void handleStaff(HttpServletRequest request, HttpServletResponse response,
            FilterChain chain, String uri, Role role) throws ServletException, IOException {
        String method = request.getMethod();
        boolean mutation = !(method.equals("GET") || method.equals("HEAD") || method.equals("OPTIONS"));

        if (!mutation) {
            if (!isReadAllowedForStaff(role, uri)) {
                deny(response, request, role, readDenial(role));
                return;
            }
            chain.doFilter(request, response);
            return;
        }

        String denial = mutationDenial(role, method, uri);
        if (denial != null) {
            deny(response, request, role, denial);
            return;
        }

        Long hospitalId = parseLong(request.getHeader(HOSPITAL_ID_HEADER));
        if (hospitalId != null && isHospitalScopedChange(method, uri)) {
            BodyBufferingRequest buffered = new BodyBufferingRequest(request);
            if (!bodyMatchesHospital(buffered, uri, hospitalId)) {
                deny(response, request, role,
                        "This action is scoped to your assigned hospital (demo rule) - "
                                + "the request targets a different hospital.");
                return;
            }
            chain.doFilter(buffered, response);
            return;
        }

        chain.doFilter(request, response);
    }

    private String mutationDenial(Role role, String method, String uri) {
        boolean hospitalCrud = uri.startsWith("/api/hospitals");
        boolean staffConfig = uri.startsWith("/api/doctors") || uri.startsWith("/api/departments");
        boolean patientWrite = uri.equals("/api/patients") || PATIENT_UPDATE_PATH.matcher(uri).matches();
        boolean appointmentWrite = uri.equals("/api/appointments/book")
                || CANCEL_PATH.matcher(uri).matches()
                || RESCHEDULE_PATH.matcher(uri).matches()
                || COMPLETE_PATH.matcher(uri).matches();
        boolean referralWrite = uri.equals("/api/referrals")
                || REFERRAL_ACCEPT_PATH.matcher(uri).matches();
        boolean bedWrite = uri.startsWith("/api/beds");
        boolean recordWrite = uri.equals("/api/records");
        boolean centralWrite = uri.startsWith("/api/central");

        if (centralWrite) {
            return "This endpoint is read-only.";
        }

        return switch (role) {
            case SUPER_ADMIN -> hospitalCrud ? null
                    : "Super Admin is a monitoring role (demo rule) - booking, patient "
                            + "registration, clinical notes, beds and referral triage belong to "
                            + "hospital staff. Manage hospitals and read aggregate reports here.";
            case HOSPITAL_ADMIN -> {
                if (staffConfig || bedWrite || referralWrite) {
                    yield null;
                }
                if (hospitalCrud) {
                    yield "Hospital Admin manages their own hospital's services, not the hospital "
                            + "master record (demo rule).";
                }
                if (appointmentWrite || patientWrite) {
                    yield "Hospital Admin may not book appointments or register patients (demo rule) "
                            + "- those are reception/patient-portal tasks.";
                }
                if (recordWrite) {
                    yield "Hospital Admin may not write clinical records (demo rule).";
                }
                yield "Hospital Admin role may not perform this action (demo rule).";
            }
            case RECEPTIONIST -> {
                if (patientWrite || (appointmentWrite && !COMPLETE_PATH.matcher(uri).matches())) {
                    yield null;
                }
                if (COMPLETE_PATH.matcher(uri).matches()) {
                    yield "Only the assigned doctor can complete a consultation (demo rule).";
                }
                if (staffConfig || bedWrite || referralWrite) {
                    yield "Receptionist front-desk role may register patients and manage "
                            + "appointments only (demo rule) - hospital, doctor, bed and referral "
                            + "administration belong to admins.";
                }
                if (hospitalCrud) {
                    yield "Receptionist may not manage hospitals (demo rule).";
                }
                if (recordWrite) {
                    yield "Receptionist may not write clinical records (demo rule).";
                }
                yield "Receptionist role may not perform this action (demo rule).";
            }
            case DOCTOR -> "Doctor role may not perform this action (demo rule).";
        };
    }

    private boolean isReadAllowedForStaff(Role role, String uri) {
        if (role == Role.SUPER_ADMIN) {
            return true;
        }
        // Hospital Admin + Receptionist share a hospital; clinical notes stay with doctors.
        return !uri.startsWith("/api/records");
    }

    private String readDenial(Role role) {
        return role == Role.RECEPTIONIST
                ? "Receptionist may not read medical records (demo rule) - those belong to the "
                        + "treating doctor."
                : "Medical records are clinical data for the treating doctor (demo rule).";
    }

    private boolean isHospitalScopedChange(String method, String uri) {
        return (method.equals("POST") && (uri.equals("/api/appointments/book")
                || uri.equals("/api/doctors")
                || uri.equals("/api/departments")
                || uri.equals("/api/beds")
                || uri.equals("/api/beds/admit")
                || uri.equals("/api/beds/discharge")
                || uri.equals("/api/referrals")
                || uri.equals("/api/patients")))
                || (method.equals("DELETE") && DEPARTMENT_ITEM_PATH.matcher(uri).matches());
    }

    private boolean bodyMatchesHospital(BodyBufferingRequest request, String uri, Long hospitalId) {
        if (DEPARTMENT_ITEM_PATH.matcher(uri).matches()) {
            // No body to inspect; the demo claim check cannot verify ownership here.
            return true;
        }
        if (uri.equals("/api/beds/admit") || uri.equals("/api/beds/discharge")) {
            return matchesQueryLong(request, "hospitalId", hospitalId);
        }
        if (uri.equals("/api/referrals")) {
            return matchesBodyLong(request, FROM_HOSPITAL_ID_BODY, hospitalId);
        }
        if (uri.equals("/api/patients")) {
            String body = new String(request.getBody(), StandardCharsets.UTF_8);
            Matcher m = HOSPITAL_ID_BODY.matcher(body);
            // A patient may be registered without a hospital; only a mismatch is a violation.
            return !m.find() || Long.valueOf(m.group(1)).equals(hospitalId);
        }
        // Book, doctor, department and bed bodies carry hospitalId.
        return matchesBodyLong(request, HOSPITAL_ID_BODY, hospitalId);
    }

    // ------------------------------------------------------------------
    // Doctor helpers
    // ------------------------------------------------------------------
    private boolean isRestrictedMutation(String method, String uri) {
        if (method.equals("POST")) {
            return uri.equals("/api/appointments/book")
                    || uri.equals("/api/patients")
                    || uri.equals("/api/referrals")
                    || uri.equals("/api/doctors")
                    || uri.equals("/api/departments")
                    || uri.equals("/api/hospitals")
                    || uri.equals("/api/beds")
                    || uri.equals("/api/beds/admit")
                    || uri.equals("/api/beds/discharge");
        }
        if (method.equals("PUT")) {
            return CANCEL_PATH.matcher(uri).matches()
                    || RESCHEDULE_PATH.matcher(uri).matches()
                    || PATIENT_UPDATE_PATH.matcher(uri).matches()
                    || REFERRAL_ACCEPT_PATH.matcher(uri).matches()
                    || HOSPITAL_ITEM_PATH.matcher(uri).matches();
        }
        if (method.equals("DELETE")) {
            return uri.startsWith("/api/hospitals") || uri.startsWith("/api/departments");
        }
        return false;
    }

    /** Returns the doctorId embedded in a doctor-scoped path, if uri is one. */
    private Long scopedResource(String uri) {
        Matcher m = DOCTOR_PATH.matcher(uri);
        if (m.matches()) {
            return Long.valueOf(m.group(1));
        }
        m = RECORDS_DOCTOR_PATH.matcher(uri);
        if (m.matches()) {
            return Long.valueOf(m.group(1));
        }
        m = DOCTOR_PATIENTS_PATH.matcher(uri);
        return m.matches() ? Long.valueOf(m.group(1)) : null;
    }

    private boolean matchesQueryLong(HttpServletRequest request, String name, Long expected) {
        String q = request.getQueryString();
        if (q == null || !q.contains(name + "=")) {
            return false;
        }
        try {
            String[] kv = q.substring(q.indexOf(name + "=") + name.length() + 1).split("&");
            return Long.valueOf(kv[0]).equals(expected);
        } catch (NumberFormatException | ArrayIndexOutOfBoundsException e) {
            return false;
        }
    }

    private boolean matchesBodyLong(BodyBufferingRequest request, Pattern pattern, Long expected) {
        String body = new String(request.getBody(), StandardCharsets.UTF_8);
        Matcher m = pattern.matcher(body);
        return m.find() && Long.valueOf(m.group(1)).equals(expected);
    }

    private boolean isReadAllowedForDoctor(String method, String uri) {
        if (!method.equals("GET")) {
            return false;
        }
        return uri.startsWith("/api/hospitals")
                || uri.equals("/api/doctors")
                || uri.startsWith("/api/doctors/")
                || PATIENT_CENTRAL_PATH.matcher(uri).matches()
                || HISTORY_PATH.matcher(uri).matches()
                || PATIENT_APTS_PATH.matcher(uri).matches()
                || uri.startsWith("/api/records/patient/")
                || uri.startsWith("/api/beds")
                || uri.startsWith("/api/central/")
                || uri.startsWith("/api/departments");
    }

    private Role parseRole(String header) {
        if (header == null || header.isBlank()) {
            return null;
        }
        return switch (header.trim().toLowerCase().replace(" ", "").replace("-", "")) {
            case "doctor" -> Role.DOCTOR;
            case "receptionist" -> Role.RECEPTIONIST;
            case "hospitaladmin" -> Role.HOSPITAL_ADMIN;
            case "superadmin" -> Role.SUPER_ADMIN;
            default -> null;
        };
    }

    private Long parseLong(String header) {
        if (header == null || header.isBlank()) {
            return null;
        }
        try {
            return Long.valueOf(header.trim());
        } catch (NumberFormatException e) {
            return null;
        }
    }

    private void deny(HttpServletResponse response, HttpServletRequest request, Role role,
            String message) throws IOException {
        if (response.isCommitted()) {
            return;
        }
        response.reset();
        response.setStatus(HttpServletResponse.SC_FORBIDDEN);
        response.setContentType("application/json;charset=UTF-8");
        log.warn("demo-auth deny [{} {}] role={}: {}", request.getMethod(),
                request.getRequestURI(), role, message);
        // Hand-rolled JSON so the filter has no Jackson dependency (Boot 4 webmvc
        // starter keeps the JSON module optional). Shape matches ApiError.
        response.getWriter().write("{\"timestamp\":\"" + LocalDateTime.now()
                + "\",\"status\":403,\"error\":\"Forbidden\",\"message\":\""
                + escapeJson(message) + "\",\"path\":\"" + escapeJson(request.getRequestURI())
                + "\"}");
    }

    private static String escapeJson(String s) {
        if (s == null) {
            return "";
        }
        StringBuilder out = new StringBuilder(s.length());
        for (int i = 0; i < s.length(); i++) {
            char c = s.charAt(i);
            switch (c) {
                case '"' -> out.append("\\\"");
                case '\\' -> out.append("\\\\");
                case '\n' -> out.append("\\n");
                case '\r' -> out.append("\\r");
                case '\t' -> out.append("\\t");
                default -> out.append(c);
            }
        }
        return out.toString();
    }

    /** Buffers the request body once so the filter and the controller can both read it. */
    private static final class BodyBufferingRequest extends HttpServletRequestWrapper {

        private final byte[] body;

        BodyBufferingRequest(HttpServletRequest request) throws IOException {
            super(request);
            this.body = request.getInputStream().readAllBytes();
        }

        byte[] getBody() {
            return body;
        }

        @Override
        public ServletInputStream getInputStream() {
            ByteArrayInputStream in = new ByteArrayInputStream(body);
            return new ServletInputStream() {
                @Override
                public int read() {
                    return in.read();
                }

                @Override
                public boolean isFinished() {
                    return in.available() == 0;
                }

                @Override
                public boolean isReady() {
                    return true;
                }

                @Override
                public void setReadListener(ReadListener readListener) {
                    throw new UnsupportedOperationException("read listener not supported");
                }
            };
        }

        @Override
        public BufferedReader getReader() {
            // JSON API bodies are UTF-8; the API never uses a different charset.
            return new BufferedReader(new InputStreamReader(
                    new ByteArrayInputStream(body), StandardCharsets.UTF_8));
        }
    }
}
