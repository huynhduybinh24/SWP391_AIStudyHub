package com.lumiedu.common.config;

import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.List;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity
@RequiredArgsConstructor
public class SecurityConfig {

    private final JwtAuthFilter jwtAuthFilter;
    private final CorsConfigurationSource corsConfigurationSource;

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
            .cors(cors -> cors.configurationSource(corsConfigurationSource))
            // Disable CSRF — stateless REST API, not needed
            .csrf(AbstractHttpConfigurer::disable)

            // Stateless session — JWT handles auth
            .sessionManagement(session -> session
                .sessionCreationPolicy(SessionCreationPolicy.STATELESS))

            // Authorization rules
            .authorizeHttpRequests(auth -> auth
                .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()

                // ===== PUBLIC ENDPOINTS =====
                .requestMatchers("/api/auth/**").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/billing/plans").permitAll()
                .requestMatchers("/api/billing/webhook").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/integrations/google-drive/callback").permitAll()

                // Public document browsing (read-only)
                .requestMatchers(HttpMethod.GET, "/api/documents/**").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/subjects/**").permitAll()

                // WebSocket endpoint
                .requestMatchers("/ws/**", "/api/ws/**").permitAll()

                // Static files & health
                .requestMatchers("/actuator/**", "/error").permitAll()

                // Public system status check (to determine maintenance mode)
                .requestMatchers(HttpMethod.GET, "/api/admin/system/status").permitAll()

                // ===== ADMIN ONLY =====
                .requestMatchers("/api/admin/**").hasRole("ADMIN")

                // ===== EVERYTHING ELSE REQUIRES AUTH =====
                .anyRequest().authenticated()
            )

            // Add JWT filter before Spring's auth filter
            .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }
}
