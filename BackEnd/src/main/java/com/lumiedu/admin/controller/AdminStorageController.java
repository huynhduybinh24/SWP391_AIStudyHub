package com.lumiedu.admin.controller;

import com.lumiedu.admin.dto.response.AdminStorageOverviewResponse;
import com.lumiedu.admin.service.AdminStorageService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/admin/storage")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AdminStorageController {

    private final AdminStorageService adminStorageService;

    @GetMapping("/overview")
    public ResponseEntity<AdminStorageOverviewResponse> getStorageOverview() {
        return ResponseEntity.ok(adminStorageService.getStorageOverview());
    }
}
