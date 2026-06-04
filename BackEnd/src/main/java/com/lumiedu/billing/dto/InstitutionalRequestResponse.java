package com.lumiedu.billing.dto;

import com.lumiedu.billing.enums.InstitutionalRequestStatus;
import lombok.*;
import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class InstitutionalRequestResponse {
    private Long id;
    private String requesterName;
    private String requesterEmail;
    private String organizationName;
    private String phoneNumber;
    private Integer expectedUsers;
    private String message;
    private InstitutionalRequestStatus status;
    private String adminNote;
    private LocalDateTime createdAt;
}
