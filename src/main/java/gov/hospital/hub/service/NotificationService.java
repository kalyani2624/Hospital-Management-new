package gov.hospital.hub.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

/**
 * Tiny notification stub. Injected via SETTER in ReferralService to demonstrate
 * setter DI alongside the constructor DI used everywhere else.
 */
@Service
public class NotificationService {

    private static final Logger log = LoggerFactory.getLogger(NotificationService.class);

    public void send(String message) {
        log.info("NOTIFY: {}", message);
    }
}
