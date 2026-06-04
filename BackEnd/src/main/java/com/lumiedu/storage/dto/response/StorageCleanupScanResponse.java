package com.lumiedu.storage.dto.response;

import com.lumiedu.storage.enums.CleanupScanType;
import lombok.*;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class StorageCleanupScanResponse {
    private Long id;
    private CleanupScanType scanType;
    private String status;
    private Integer filesFound;
    private Double spaceReclaimedMb;
    private LocalDateTime createdAt;
}
