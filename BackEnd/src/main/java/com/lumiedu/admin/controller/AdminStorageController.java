package com.lumiedu.admin.controller;

import com.lumiedu.admin.dto.response.AdminStorageOverviewResponse;
import com.lumiedu.admin.service.AdminStorageService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/admin/storage")
@RequiredArgsConstructor
public class AdminStorageController {

    private final AdminStorageService adminStorageService;

    // TODO: Protect this endpoint with ADMIN role after security is configured.
    @GetMapping("/overview")
    public ResponseEntity<AdminStorageOverviewResponse> getStorageOverview() {
        return ResponseEntity.ok(adminStorageService.getStorageOverview());
    }
}
