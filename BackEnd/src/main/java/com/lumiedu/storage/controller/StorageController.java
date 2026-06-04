package com.lumiedu.storage.controller;

import com.lumiedu.storage.dto.response.StorageAnalyticsResponse;
import com.lumiedu.storage.dto.response.StorageCleanupScanResponse;
import com.lumiedu.storage.dto.response.StorageUsageResponse;
import com.lumiedu.storage.service.StorageService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/storage")
@RequiredArgsConstructor
public class StorageController {

    private final StorageService storageService;

    @GetMapping("/usage")
    public ResponseEntity<StorageUsageResponse> getStorageUsage(@RequestParam Long userId) {
        return ResponseEntity.ok(storageService.getStorageUsage(userId));
    }

    @GetMapping("/analytics")
    public ResponseEntity<StorageAnalyticsResponse> getStorageAnalytics(@RequestParam Long userId) {
        return ResponseEntity.ok(storageService.getStorageAnalytics(userId));
    }

    @PostMapping("/cleanup/duplicate")
    public ResponseEntity<StorageCleanupScanResponse> runDuplicateCleanup(@RequestParam Long userId) {
        return ResponseEntity.ok(storageService.runDuplicateCleanup(userId));
    }

    @PostMapping("/cleanup/large")
    public ResponseEntity<StorageCleanupScanResponse> runLargeCleanup(
            @RequestParam Long userId,
            @RequestParam(defaultValue = "10") Long minSizeMb) {
        return ResponseEntity.ok(storageService.runLargeCleanup(userId, minSizeMb));
    }

    @GetMapping("/health")
    public ResponseEntity<String> healthCheck() {
        return ResponseEntity.ok("Storage module is running");
    }
}
