package com.lumiedu.storage.dto.response;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class StorageUsageResponse {
    private Long userId;
    private Double storageUsedMb;
    private Double storageLimitMb;
    private Double storagePercentage;
}
