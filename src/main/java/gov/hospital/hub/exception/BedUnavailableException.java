package gov.hospital.hub.exception;

public class BedUnavailableException extends RuntimeException {

    public BedUnavailableException(String message) {
        super(message);
    }
}
