package com.lumiedu.user.dto.request;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UpdateUserProfileRequest {
    private String fullName;
    private String avatarUrl;
    private String university;
    private String major;
    private String degree;
}
