package com.lumiedu.admin.controller;

import com.lumiedu.admin.dto.request.AdminSystemStatusRequest;
import com.lumiedu.admin.dto.response.AdminHealthResponse;
import com.lumiedu.admin.dto.response.AdminSystemStatusResponse;
import com.lumiedu.admin.service.AdminSystemService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/admin/system")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AdminSystemController {

    private final AdminSystemService adminSystemService;

    @GetMapping("/status")
    public ResponseEntity<AdminSystemStatusResponse> getSystemStatus() {
        return ResponseEntity.ok(adminSystemService.getSystemStatus());
    }

    @PutMapping("/status")
    public ResponseEntity<AdminSystemStatusResponse> updateSystemStatus(
            @RequestBody @Valid AdminSystemStatusRequest request) {
        return ResponseEntity.ok(adminSystemService.updateSystemStatus(request));
    }

    @GetMapping("/health")
    public ResponseEntity<AdminHealthResponse> getSystemHealth() {
        return ResponseEntity.ok(adminSystemService.getSystemHealth());
    }
}
