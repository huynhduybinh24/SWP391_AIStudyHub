package com.lumiedu.admin.dto.response;

import lombok.*;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AdminStorageOverviewResponse {
    private double totalStorageUsed; // MB
    private double totalStorageLimit; // MB
    private long totalFiles;
    private long totalFileSize; // Bytes
    private List<AdminUserResponse> topUsersByStorage;
}
