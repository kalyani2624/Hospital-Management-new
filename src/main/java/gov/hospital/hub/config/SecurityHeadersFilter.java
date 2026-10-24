package gov.hospital.hub.config;

import java.io.IOException;

import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

/**
 * Basic security headers (P0 syllabus-compatible, no auth rewrite).
 * WHY: audit F7 — no CSP/frame/nosniff meant stored-XSS payloads executed
 * unimpeded and PHI pages were clickjackable. This filter adds defense-in-depth
 * behind the Hub.esc() frontend fixes; it does not replace output escaping.
 */
@Component
public class SecurityHeadersFilter extends OncePerRequestFilter {

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response,
            FilterChain chain) throws ServletException, IOException {
        response.setHeader("X-Content-Type-Options", "nosniff");
        response.setHeader("X-Frame-Options", "DENY");
        response.setHeader("Referrer-Policy", "no-referrer");
        response.setHeader("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
        // Static UI is same-origin (no CDN/inline-exception needed beyond current inline
        // scripts); connect-src locks API calls to the local demo backend.
        response.setHeader("Content-Security-Policy",
                "default-src 'self'; script-src 'self' 'unsafe-inline'; "
                        + "connect-src 'self' http://localhost:8086 http://127.0.0.1:8086; "
                        + "object-src 'none'; base-uri 'self'; frame-ancestors 'none'");
        chain.doFilter(request, response);
    }
}
