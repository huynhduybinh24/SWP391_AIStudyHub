package com.lumiedu.common.config;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;

@Slf4j
@Component
public class StartupConfigValidator {

    @Value("${spring.datasource.url:}")
    private String datasourceUrl;

    @Value("${spring.datasource.driver-class-name:}")
    private String driverClassName;

    @Value("${spring.profiles.active:default}")
    private String activeProfiles;

    @EventListener(ApplicationReadyEvent.class)
    public void validateOnStartup() {
        log.info("Active profile: {}", activeProfiles);
        log.info("Database driver configured: {}", driverClassName);

        if (datasourceUrl == null || datasourceUrl.isBlank()) {
            log.error("SPRING_DATASOURCE_URL is empty! Database connection will fail.");
        } else if (datasourceUrl.contains("${")) {
            log.error("SPRING_DATASOURCE_URL contains unexpanded placeholder: {}", datasourceUrl);
        } else if (datasourceUrl.startsWith("jdbc:mysql:")) {
            log.info("Database type: MySQL | Host configured: YES");
        } else if (datasourceUrl.startsWith("jdbc:h2:")) {
            log.info("Database type: H2 In-Memory");
        } else {
            log.info("Database type: Configured");
        }
    }
}
