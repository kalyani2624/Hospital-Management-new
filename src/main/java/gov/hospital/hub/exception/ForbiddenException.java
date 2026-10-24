package gov.hospital.hub.exception;

/**
 * 403 for demo-scoped access rules (e.g. a Doctor trying to book, cancel,
 * reschedule or read another doctor's schedule).
 * WHY a dedicated type: 403 (not 400) tells the client the request was
 * understood but the demo role may not perform it.
 */
public class ForbiddenException extends RuntimeException {

    public ForbiddenException(String message) {
        super(message);
    }

    public ForbiddenException(String message, Throwable cause) {
        super(message, cause);
    }
}