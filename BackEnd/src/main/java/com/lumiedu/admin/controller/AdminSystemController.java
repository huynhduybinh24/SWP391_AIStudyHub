package com.lumiedu.admin.controller;

import com.lumiedu.admin.dto.request.AdminSystemStatusRequest;
import com.lumiedu.admin.dto.response.AdminHealthResponse;
import com.lumiedu.admin.dto.response.AdminSystemStatusResponse;
import com.lumiedu.admin.service.AdminSystemService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/admin/system")
@RequiredArgsConstructor
public class AdminSystemController {

    private final AdminSystemService adminSystemService;

    // TODO: Protect this endpoint with ADMIN role after security is configured.
    @GetMapping("/status")
    public ResponseEntity<AdminSystemStatusResponse> getSystemStatus() {
        return ResponseEntity.ok(adminSystemService.getSystemStatus());
    }

    // TODO: Protect this endpoint with ADMIN role after security is configured.
    @PutMapping("/status")
    public ResponseEntity<AdminSystemStatusResponse> updateSystemStatus(
            @RequestBody @Valid AdminSystemStatusRequest request) {
        return ResponseEntity.ok(adminSystemService.updateSystemStatus(request));
    }

    // TODO: Protect this endpoint with ADMIN role after security is configured.
    @GetMapping("/health")
    public ResponseEntity<AdminHealthResponse> getSystemHealth() {
        return ResponseEntity.ok(adminSystemService.getSystemHealth());
    }
}
