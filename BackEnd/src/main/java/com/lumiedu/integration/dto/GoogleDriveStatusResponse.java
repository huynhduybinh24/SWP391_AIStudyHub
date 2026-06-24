package com.lumiedu.integration.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class GoogleDriveStatusResponse {
    private boolean connected;
    private String googleEmail;
    private LocalDateTime connectedAt;
    private String storageMode;
}
