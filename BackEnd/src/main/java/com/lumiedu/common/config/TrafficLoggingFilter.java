package com.lumiedu.common.config;

import com.lumiedu.admin.entity.SystemTraffic;
import com.lumiedu.admin.repository.SystemTrafficRepository;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.time.LocalDate;

@Slf4j
@Component
@RequiredArgsConstructor
public class TrafficLoggingFilter extends OncePerRequestFilter {

    private final SystemTrafficRepository systemTrafficRepository;

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {

        String path = request.getRequestURI();

        // Increment page views for any API requests, excluding admin dashboard stats endpoint
        if (path.startsWith("/api/") && !path.contains("/admin/dashboard/stats")) {
            try {
                LocalDate today = LocalDate.now();
                int updated = systemTrafficRepository.incrementPageViews(today);
                if (updated == 0) {
                    try {
                        systemTrafficRepository.save(SystemTraffic.builder()
                                .trafficDate(today)
                                .pageViews(1L)
                                .build());
                    } catch (Exception ex) {
                        // In case of concurrent inserts, retry the update
                        systemTrafficRepository.incrementPageViews(today);
                    }
                }
            } catch (Exception e) {
                // Fail silently to not impact user request processing if database is locked or not fully initialized
                log.warn("[TrafficFilter] Failed to log request traffic: {}", e.getMessage());
            }
        }

        filterChain.doFilter(request, response);
    }
}
