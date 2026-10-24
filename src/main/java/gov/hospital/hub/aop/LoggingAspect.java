package gov.hospital.hub.aop;

import org.aspectj.lang.ProceedingJoinPoint;
import org.aspectj.lang.annotation.Around;
import org.aspectj.lang.annotation.Aspect;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

/**
 * Cross-cutting request logging for the whole service layer.
 * WHY @Around: single point to add timing + entry/exit without touching services.
 */
@Aspect
@Component
public class LoggingAspect {

    private static final Logger log = LoggerFactory.getLogger(LoggingAspect.class);

    @Around("execution(* gov.hospital.hub.service..*(..))")
    public Object logService(ProceedingJoinPoint joinPoint) throws Throwable {
        String method = joinPoint.getSignature().toShortString();
        long start = System.currentTimeMillis();
        log.info("ENTER {}", method);
        try {
            Object result = joinPoint.proceed();
            log.info("EXIT {} in {} ms", method, System.currentTimeMillis() - start);
            return result;
        } catch (Exception ex) {
            log.warn("FAIL {} in {} ms: {}", method, System.currentTimeMillis() - start,
                    ex.getMessage());
            throw ex;
        }
    }
}
