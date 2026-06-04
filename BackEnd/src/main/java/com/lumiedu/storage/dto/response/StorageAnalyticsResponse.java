package com.lumiedu.storage.dto.response;

import lombok.*;

import java.util.List;
import java.util.Map;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class StorageAnalyticsResponse {
    private Double totalUsedMb;
    private Double limitMb;
    private Integer totalFiles;
    private Map<String, Double> categoryBreakdown;
    private List<StorageAnalyticsSnapshotResponse> snapshots;
}
