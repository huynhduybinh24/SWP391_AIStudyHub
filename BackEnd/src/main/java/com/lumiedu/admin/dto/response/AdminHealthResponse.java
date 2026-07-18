package com.lumiedu.admin.dto.response;

import lombok.*;
import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AdminHealthResponse {
    private String databaseStatus;
    private String systemMode;
    private LocalDateTime currentTime;
}
