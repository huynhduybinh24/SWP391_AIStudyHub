package com.lumiedu.workspace.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SharedDocumentResponse {
    private String id;
    private String name;
    private String owner;
    private String permission; // Viewer, Editor, Owner
    private String dateShared;
    private String type;
    private String size;
    private Integer totalPages;
    private String description;
    private List<String> tags;
    private String previewContent;
    private String url;
    private String ownerName;
    private String ownerEmail;
    private String role;
    private String sharedAt;
    private Boolean sharedWithMe;
}
