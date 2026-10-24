package gov.hospital.hub.exception;

import java.util.stream.Collectors;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.dao.OptimisticLockingFailureException;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.orm.ObjectOptimisticLockingFailureException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.context.request.WebRequest;

/**
 * Single place that converts domain failures to HTTP codes.
 * 400 validation, 404 missing row, 409 double-book / no bed, 500 fallback.
 */
@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(ResourceNotFoundException.class)
    public ResponseEntity<ApiError> handleNotFound(ResourceNotFoundException ex, WebRequest request) {
        return build(HttpStatus.NOT_FOUND, ex.getMessage(), request);
    }

    @ExceptionHandler(ForbiddenException.class)
    public ResponseEntity<ApiError> handleForbidden(ForbiddenException ex, WebRequest request) {
        return build(HttpStatus.FORBIDDEN, ex.getMessage(), request);
    }

    @ExceptionHandler({DoubleBookingException.class, BedUnavailableException.class})
    public ResponseEntity<ApiError> handleConflict(RuntimeException ex, WebRequest request) {
        return build(HttpStatus.CONFLICT, ex.getMessage(), request);
    }

/**
 * Duplicate centralId must be 409, not 500.
 * WHY: PatientService throws IllegalStateException on duplicate centralId and
 * the DB unique constraint raises DataIntegrityViolationException on races;
 * both are client conflicts (same as double-book), not server errors.
 * P0: never echo raw SQL/constraint names — return a generic conflict message.
 */
    @ExceptionHandler({IllegalStateException.class, DataIntegrityViolationException.class})
    public ResponseEntity<ApiError> handleDuplicate(RuntimeException ex, WebRequest request) {
        String message = ex.getMessage();
        if (ex instanceof DataIntegrityViolationException) {
            // WHY generic: ex.getMessage() embeds SQL + constraint names (500-leak class).
            org.slf4j.LoggerFactory.getLogger(GlobalExceptionHandler.class)
                    .warn("data integrity conflict at {}: {}", request.getDescription(false), message);
            message = "duplicate or conflicting data (constraint violation)";
        }
        return build(HttpStatus.CONFLICT, message, request);
    }

    /**
     * Concurrent admit on the last bed raises optimistic-lock failure.
     * WHY 409: a lost-update race is a conflict (retry/pick another ward),
     * not a server error. Keeps BedService @Version races syllabus-compatible.
     */
    @ExceptionHandler({ObjectOptimisticLockingFailureException.class,
            OptimisticLockingFailureException.class,
            jakarta.persistence.OptimisticLockException.class})
    public ResponseEntity<ApiError> handleOptimisticLock(RuntimeException ex,
            WebRequest request) {
        return build(HttpStatus.CONFLICT,
                "concurrent update conflict — retry (bed or slot changed)", request);
    }

    /**
     * Missing primitive int fields (e.g. age, total) fail Jackson deserialization.
     * WHY: record constructors take primitive int so absent JSON becomes null ->
     * MismatchedInputException wrapped in HttpMessageNotReadableException; that is
     * a bad request (400), not a server error (500).
     * P0: never echo Jackson internals (class/record names) — generic message only.
     */
    @ExceptionHandler(HttpMessageNotReadableException.class)
    public ResponseEntity<ApiError> handleNotReadable(HttpMessageNotReadableException ex,
            WebRequest request) {
        return build(HttpStatus.BAD_REQUEST,
                "malformed or incomplete request body", request);
    }

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<ApiError> handleBadRequest(IllegalArgumentException ex,
            WebRequest request) {
        return build(HttpStatus.BAD_REQUEST, ex.getMessage(), request);
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ApiError> handleValidation(MethodArgumentNotValidException ex,
            WebRequest request) {
        String message = ex.getBindingResult().getFieldErrors().stream()
                .map(e -> e.getField() + ": " + e.getDefaultMessage())
                .collect(Collectors.joining("; "));
        return build(HttpStatus.BAD_REQUEST, message, request);
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ApiError> handleGeneric(Exception ex, WebRequest request) {
        // P0: never echo ex.getMessage() (NPE/SQL/LazyInit internals leak).
        // Return a generic message with a correlation ID; log the full stack server-side.
        String ref = java.util.UUID.randomUUID().toString().substring(0, 8);
        org.slf4j.LoggerFactory.getLogger(GlobalExceptionHandler.class)
                .error("unexpected error ref={} at {}", ref, request.getDescription(false), ex);
        return build(HttpStatus.INTERNAL_SERVER_ERROR,
                "unexpected error, reference " + ref, request);
    }

    private ResponseEntity<ApiError> build(HttpStatus status, String message, WebRequest request) {
        String path = request.getDescription(false).replace("uri=", "");
        ApiError body = new ApiError(status.value(), status.getReasonPhrase(),
                message == null ? "unexpected error" : message, path);
        return ResponseEntity.status(status).body(body);
    }
}
