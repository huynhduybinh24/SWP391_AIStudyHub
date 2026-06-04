package com.lumiedu.storage.dto.response;

import lombok.*;

import java.time.LocalDate;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class StorageAnalyticsSnapshotResponse {
    private Long id;
    private Double totalUsedMb;
    private Double limitMb;
    private Integer fileCount;
    private Integer documentCount;
    private Integer mediaCount;
    private Integer otherCount;
    private LocalDate snapshotDate;
}
