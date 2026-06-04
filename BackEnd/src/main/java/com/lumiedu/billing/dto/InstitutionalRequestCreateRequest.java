package com.lumiedu.billing.dto;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class InstitutionalRequestCreateRequest {
    private String requesterName;
    private String requesterEmail;
    private String organizationName;
    private String phoneNumber;
    private Integer expectedUsers;
    private String message;
}
