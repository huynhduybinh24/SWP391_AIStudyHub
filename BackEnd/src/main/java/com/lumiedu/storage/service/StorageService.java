package com.lumiedu.storage.service;

import com.lumiedu.storage.dto.response.StorageAnalyticsResponse;
import com.lumiedu.storage.dto.response.StorageCleanupScanResponse;
import com.lumiedu.storage.dto.response.StorageUsageResponse;

public interface StorageService {
    StorageUsageResponse getStorageUsage(Long userId);
    StorageAnalyticsResponse getStorageAnalytics(Long userId);
    StorageCleanupScanResponse runDuplicateCleanup(Long userId);
    StorageCleanupScanResponse runLargeCleanup(Long userId, Long minSizeMb);
}
