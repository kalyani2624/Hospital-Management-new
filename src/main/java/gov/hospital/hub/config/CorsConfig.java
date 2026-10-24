package gov.hospital.hub.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

/**
 * CORS restricted to local demo origins (P0 security fix).
 * WHY: wildcard "*" let any malicious site fetch the open API and read PHI.
 * Demo allows VS Code Live Server (:5500), CRA/Next (:3000), loopback, and
 * file:// ("null" Origin) for double-click UI. Prod must replace with exact
 * ministry origins (e.g. https://hub.health.gov.in) and drop "null".
 */
@Configuration
public class CorsConfig {

    @Bean
    public WebMvcConfigurer corsConfigurer() {
        return new WebMvcConfigurer() {
            @Override
            public void addCorsMappings(CorsRegistry registry) {
                registry.addMapping("/api/**")
                        .allowedOrigins(
                                "http://localhost:3000",
                                "http://localhost:5173",
                                "http://localhost:5500",
                                "http://127.0.0.1:3000",
                                "http://127.0.0.1:5173",
                                "http://127.0.0.1:5500",
                                "null")
                        .allowedMethods("GET", "POST", "PUT", "DELETE", "OPTIONS")
                        .allowedHeaders("Content-Type", "Accept", "Authorization", "X-Demo-Role", "X-Demo-Doctor-Id", "X-Demo-Hospital-Id")
                        .allowCredentials(false)
                        .maxAge(3600);
            }
        };
    }
}
