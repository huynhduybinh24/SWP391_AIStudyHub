package com.lumiedu.admin.controller;

import com.lumiedu.admin.dto.response.AdminDashboardStatsResponse;
import com.lumiedu.admin.service.AdminDashboardService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/admin/dashboard")
@RequiredArgsConstructor
public class AdminDashboardController {

    private final AdminDashboardService adminDashboardService;

    // TODO: Protect this endpoint with ADMIN role after security is configured.
    @GetMapping("/stats")
    public ResponseEntity<AdminDashboardStatsResponse> getStats() {
        return ResponseEntity.ok(adminDashboardService.getStats());
    }
}
