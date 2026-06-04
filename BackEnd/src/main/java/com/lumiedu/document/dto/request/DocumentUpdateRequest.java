package com.lumiedu.document.dto.request;

import lombok.*;

import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DocumentUpdateRequest {

    private String title;
    private String description;
    private String subject;
    private String visibility;
    private List<String> tags;
}
