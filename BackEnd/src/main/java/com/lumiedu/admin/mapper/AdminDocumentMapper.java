package com.lumiedu.admin.mapper;

import com.lumiedu.admin.dto.response.AdminDocumentResponse;
import com.lumiedu.document.entity.Document;
import com.lumiedu.user.entity.User;

public class AdminDocumentMapper {

    public static AdminDocumentResponse toResponse(Document doc, User owner) {
        if (doc == null) {
            return null;
        }

        String desc = doc.getDescription();
        String summaryPreview = null;
        if (desc != null) {
            summaryPreview = desc.length() > 200 ? desc.substring(0, 200) + "..." : desc;
        }

        return AdminDocumentResponse.builder()
                .id(doc.getId())
                .userId(doc.getUserId())
                .ownerName(owner != null ? owner.getFullName() : null)
                .ownerEmail(owner != null ? owner.getEmail() : null)
                .title(doc.getTitle())
                .description(doc.getDescription())
                .fileType(doc.getFileType())
                .fileSize(doc.getFileSize())
                .fileUrl(doc.getFileUrl())
                .createdAt(doc.getCreatedAt())
                .updatedAt(doc.getUpdatedAt())
                .summaryPreview(summaryPreview)
                .status("ACTIVE") // Mặc định do Document entity chưa có status
                .moderationReason(null)
                .build();
    }
}
