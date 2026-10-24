package gov.hospital.hub.exception;

/**
 * Thrown when the same doctor is booked twice for the same slot.
 * Mapped to HTTP 409 by GlobalExceptionHandler.
 */
public class DoubleBookingException extends RuntimeException {

    public DoubleBookingException(String message) {
        super(message);
    }
}
