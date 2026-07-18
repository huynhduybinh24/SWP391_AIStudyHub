package com.lumiedu.admin.service.impl;

import com.lumiedu.admin.dto.request.AdminDocumentModerationRequest;
import com.lumiedu.admin.dto.request.BulkDocumentRequest;
import com.lumiedu.admin.dto.response.AdminDocumentResponse;
import com.lumiedu.admin.mapper.AdminDocumentMapper;
import com.lumiedu.admin.service.AdminDocumentService;
import com.lumiedu.document.entity.Document;
import com.lumiedu.document.enums.DocumentStatus;
import com.lumiedu.document.repository.DocumentRepository;
import com.lumiedu.user.entity.User;
import com.lumiedu.user.repository.UserRepository;
import com.lumiedu.ai.service.DocumentChunkingService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Collections;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
public class AdminDocumentServiceImpl implements AdminDocumentService {

    private final DocumentRepository documentRepository;
    private final UserRepository userRepository;
    private final com.lumiedu.notification.service.NotificationService notificationService;
    private final com.lumiedu.email.service.EmailService emailService;
    private final com.lumiedu.document.service.GoogleDriveService googleDriveService;
    private final DocumentChunkingService documentChunkingService;

    @Override
    @Transactional(readOnly = true)
    public List<AdminDocumentResponse> getDocuments(String keyword, String course, String type, String status, Long userId, int page, int size) {
        // Lấy tất cả documents chưa xoá
        List<Document> docs = documentRepository.findAllByDeletedFalse();

        // Lọc theo keyword (tiêu đề hoặc mô tả)
        if (keyword != null && !keyword.trim().isEmpty()) {
            String lowerKeyword = keyword.toLowerCase();
            docs = docs.stream()
                    .filter(d -> (d.getTitle() != null && d.getTitle().toLowerCase().contains(lowerKeyword))
                            || (d.getDescription() != null && d.getDescription().toLowerCase().contains(lowerKeyword)))
                    .collect(Collectors.toList());
        }

        // Lọc theo userId
        if (userId != null) {
            docs = docs.stream()
                    .filter(d -> d.getUserId() != null && d.getUserId().equals(userId))
                    .collect(Collectors.toList());
        }

        // Lọc theo type (fileType)
        if (type != null && !type.trim().isEmpty()) {
            docs = docs.stream()
                    .filter(d -> d.getFileType() != null && d.getFileType().equalsIgnoreCase(type))
                    .collect(Collectors.toList());
        }

        // Lọc theo course (subject)
        if (course != null && !course.trim().isEmpty()) {
            docs = docs.stream()
                    .filter(d -> d.getSubject() != null && d.getSubject().equalsIgnoreCase(course))
                    .collect(Collectors.toList());
        }

        // Sắp xếp theo ID giảm dần (tài liệu mới nhất lên đầu)
        docs.sort(Comparator.comparing(Document::getId).reversed());

        // Phân trang thủ công
        int total = docs.size();
        int start = page * size;
        if (start >= total) {
            docs = Collections.emptyList();
        } else {
            int end = Math.min(start + size, total);
            docs = docs.subList(start, end);
        }

        // Tìm tất cả users để tránh n+1 queries
        List<Long> userIds = docs.stream()
                .map(Document::getUserId)
                .filter(java.util.Objects::nonNull)
                .distinct()
                .collect(Collectors.toList());
        
        Map<Long, User> userMap = userRepository.findAllById(userIds).stream()
                .collect(Collectors.toMap(User::getId, Function.identity()));

        return docs.stream()
                .map(d -> {
                    User owner = d.getUserId() != null ? userMap.get(d.getUserId()) : null;
                    return AdminDocumentMapper.toResponse(d, owner);
                })
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public AdminDocumentResponse getDocumentById(Long id) {
        Document doc = documentRepository.findByIdAndDeletedFalse(id)
                .orElseThrow(() -> new RuntimeException("Document not found or has been deleted. ID: " + id));
        User owner = doc.getUserId() != null ? userRepository.findById(doc.getUserId()).orElse(null) : null;
        return AdminDocumentMapper.toResponse(doc, owner);
    }

    @Override
    public void deleteDocument(Long id) {
        Document doc = documentRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Document not found with id: " + id));
        doc.setDeleted(true);
        documentRepository.save(doc);
    }

    @Override
    public AdminDocumentResponse moderateDocument(Long id, AdminDocumentModerationRequest request) {
        Document doc = documentRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Document not found with id: " + id));

        // Parse and apply the moderation status
        DocumentStatus status = null;
        if (request.getStatus() != null) {
            try {
                status = DocumentStatus.valueOf(request.getStatus().toUpperCase());
            } catch (IllegalArgumentException e) {
                throw new RuntimeException("Invalid moderation status: " + request.getStatus());
            }
        }

        if (status != null) {
            doc.setModerationStatus(status);
            // Rejected documents are hidden from public listing
            doc.setDeleted(status == DocumentStatus.REJECTED);
        }

        if (request.getReason() != null) {
            doc.setModerationNote(request.getReason());
        }

        documentRepository.save(doc);

        if (status == DocumentStatus.APPROVED && "DOCUMENT".equalsIgnoreCase(doc.getFileType())) {
            triggerChunkingAfterCommit(doc.getId());
        }

        User owner = doc.getUserId() != null ? userRepository.findById(doc.getUserId()).orElse(null) : null;
        return AdminDocumentMapper.toResponse(doc, owner);
    }

    @Override
    public int bulkApprove(BulkDocumentRequest request) {
        if (request.getIds() == null || request.getIds().isEmpty()) return 0;
        List<Document> docs = documentRepository.findAllById(request.getIds());
        docs.forEach(d -> {
            d.setModerationStatus(DocumentStatus.APPROVED);
            d.setDeleted(false);
            if ("DOCUMENT".equalsIgnoreCase(d.getFileType())) {
                triggerChunkingAfterCommit(d.getId());
            }
        });
        documentRepository.saveAll(docs);
        return docs.size();
    }

    @Override
    public int bulkReject(BulkDocumentRequest request) {
        if (request.getIds() == null || request.getIds().isEmpty()) return 0;
        List<Document> docs = documentRepository.findAllById(request.getIds());
        docs.forEach(d -> {
            d.setModerationStatus(DocumentStatus.REJECTED);
            d.setDeleted(true);
            if (request.getReason() != null) d.setModerationNote(request.getReason());
        });
        documentRepository.saveAll(docs);
        return docs.size();
    }

    @Override
    public int bulkDelete(BulkDocumentRequest request) {
        if (request.getIds() == null || request.getIds().isEmpty()) return 0;
        List<Document> docs = documentRepository.findAllById(request.getIds());
        docs.forEach(d -> d.setDeleted(true));
        documentRepository.saveAll(docs);
        return docs.size();
    }

    @Override
    @Transactional(readOnly = true)
    public String exportModerationReport(List<Long> ids) {
        List<Document> docs;
        if (ids == null || ids.isEmpty()) {
            docs = documentRepository.findAllByDeletedFalse();
        } else {
            docs = documentRepository.findAllById(ids);
        }

        List<Long> userIds = docs.stream()
                .map(Document::getUserId)
                .filter(java.util.Objects::nonNull)
                .distinct()
                .collect(Collectors.toList());
        Map<Long, User> userMap = userRepository.findAllById(userIds).stream()
                .collect(Collectors.toMap(User::getId, Function.identity()));

        StringBuilder csv = new StringBuilder();
        csv.append("\uFEFF");
        csv.append("Document ID,Title,Uploader Email,Uploader Name,File Type,File Size (MB),Moderation Status,Created At\n");

        for (Document d : docs) {
            User owner = d.getUserId() != null ? userMap.get(d.getUserId()) : null;
            String ownerEmail = owner != null ? owner.getEmail() : "N/A";
            String ownerName = owner != null ? owner.getFullName() : "N/A";
            double sizeMb = d.getFileSize() != null ? (double) d.getFileSize() / (1024 * 1024) : 0.0;
            String sizeStr = String.format(java.util.Locale.US, "%.2f", sizeMb);
            String statusStr = d.getModerationStatus() != null ? d.getModerationStatus().name() : "PENDING";
            String createdAtStr = d.getCreatedAt() != null ? d.getCreatedAt().toString() : "N/A";

            csv.append(d.getId()).append(",")
                    .append(escapeCsv(d.getTitle())).append(",")
                    .append(escapeCsv(ownerEmail)).append(",")
                    .append(escapeCsv(ownerName)).append(",")
                    .append(escapeCsv(d.getFileType())).append(",")
                    .append(sizeStr).append(",")
                    .append(statusStr).append(",")
                    .append(escapeCsv(createdAtStr)).append("\n");
        }

        return csv.toString();
    }

    private String escapeCsv(String value) {
        if (value == null) return "";
        String escaped = value.replace("\"", "\"\"");
        if (escaped.contains(",") || escaped.contains("\"") || escaped.contains("\n") || escaped.contains("\r")) {
            return "\"" + escaped + "\"";
        }
        return escaped;
    }

    @Override
    @Transactional(readOnly = true)
    public List<AdminDocumentResponse> getPendingDocuments() {
        List<Document> docs = documentRepository.findAllByDeletedFalse().stream()
                .filter(d -> d.getModerationStatus() == DocumentStatus.PENDING_REVIEW)
                .collect(Collectors.toList());

        docs.sort(Comparator.comparing(Document::getId).reversed());

        List<Long> userIds = docs.stream()
                .map(Document::getUserId)
                .filter(java.util.Objects::nonNull)
                .distinct()
                .collect(Collectors.toList());

        Map<Long, User> userMap = userRepository.findAllById(userIds).stream()
                .collect(Collectors.toMap(User::getId, Function.identity()));

        return docs.stream()
                .map(d -> {
                    User owner = d.getUserId() != null ? userMap.get(d.getUserId()) : null;
                    return AdminDocumentMapper.toResponse(d, owner);
                })
                .collect(Collectors.toList());
    }

    @Override
    public AdminDocumentResponse approveDocument(Long id, Long adminId) {
        Document doc = documentRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Document not found with id: " + id));

        doc.setModerationStatus(DocumentStatus.APPROVED);
        doc.setRejectionReason(null);
        doc.setReviewedBy(adminId);
        doc.setReviewedAt(java.time.LocalDateTime.now());
        documentRepository.save(doc);

        if ("DOCUMENT".equalsIgnoreCase(doc.getFileType())) {
            triggerChunkingAfterCommit(doc.getId());
        }

        User owner = doc.getUserId() != null ? userRepository.findById(doc.getUserId()).orElse(null) : null;

        if (owner != null && notificationService != null) {
            try {
                com.lumiedu.notification.dto.request.NotificationRequest notifReq = com.lumiedu.notification.dto.request.NotificationRequest.builder()
                        .type("DOCUMENT")
                        .title("Document Approved")
                        .message("Your document '" + doc.getTitle() + "' has been approved by admin.")
                        .targetUserEmail(owner.getEmail())
                        .documentId(doc.getId())
                        .documentName(doc.getTitle())
                        .actionType("view_document")
                        .actionUrl("/dashboard/documents/document/" + doc.getId())
                        .build();
                notificationService.createNotification(notifReq);
            } catch (Exception e) {
                System.err.println("Failed to send approval notification: " + e.getMessage());
            }
        }

        if (owner != null && emailService != null) {
            try {
                String subject = "[LumiEdu] Your document has been approved";
                String heading = "Document approved";
                String body = "<p>Hello " + owner.getFullName() + ",</p>" +
                        "<p>Your document <strong>" + doc.getTitle() + "</strong> has been approved by an administrator.</p>" +
                        "<p>You can now view and use this document in the system.</p>";
                String html = emailService.buildHtmlTemplate(subject, heading, body);
                emailService.sendEmail(owner.getEmail(), subject, html, true);
            } catch (Exception e) {
                System.err.println("Failed to send approval email: " + e.getMessage());
            }
        }

        return AdminDocumentMapper.toResponse(doc, owner);
    }

    @Override
    public AdminDocumentResponse rejectDocument(Long id, String reason, Long adminId) {
        if (reason == null || reason.trim().isBlank()) {
            throw new IllegalArgumentException("Rejection reason is required.");
        }
        String cleanReason = reason.trim();

        Document doc = documentRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Document not found with id: " + id));

        doc.setModerationStatus(DocumentStatus.REJECTED);
        doc.setRejectionReason(cleanReason);
        doc.setReviewedBy(adminId);
        doc.setReviewedAt(java.time.LocalDateTime.now());

        if (doc.getGoogleDriveFileId() != null && !doc.getGoogleDriveFileId().isBlank()) {
            try {
                googleDriveService.deleteFile(doc.getGoogleDriveFileId(), doc.getUserId());
            } catch (Exception e) {
                System.err.println("Failed to delete file from Google Drive for rejected doc: " + e.getMessage());
            }
        }

        documentRepository.save(doc);

        User owner = doc.getUserId() != null ? userRepository.findById(doc.getUserId()).orElse(null) : null;

        if (owner != null && notificationService != null) {
            try {
                com.lumiedu.notification.dto.request.NotificationRequest notifReq = com.lumiedu.notification.dto.request.NotificationRequest.builder()
                        .type("DOCUMENT")
                        .title("Document Rejected")
                        .message("Your document '" + doc.getTitle() + "' has been rejected. Reason: " + cleanReason)
                        .targetUserEmail(owner.getEmail())
                        .documentId(doc.getId())
                        .documentName(doc.getTitle())
                        .actionType("view_history")
                        .actionUrl("/dashboard/documents")
                        .reason(cleanReason)
                        .build();
                notificationService.createNotification(notifReq);
            } catch (Exception e) {
                System.err.println("Failed to send rejection notification: " + e.getMessage());
            }
        }

        if (owner != null && emailService != null) {
            try {
                String subject = "[LumiEdu] Your document has been rejected";
                String heading = "Document rejected";
                String body = "<p>Hello " + owner.getFullName() + ",</p>" +
                        "<p>Your document <strong>" + doc.getTitle() + "</strong> was rejected by an administrator.</p>" +
                        "<div class=\"highlight-card\">" +
                        "  <strong>Reason:</strong><br/>" +
                        "  " + cleanReason + "" +
                        "</div>" +
                        "<p>The uploaded file has been removed from Google Drive, but you can still see this rejection status in your upload history.</p>";
                String html = emailService.buildHtmlTemplate(subject, heading, body);
                emailService.sendEmail(owner.getEmail(), subject, html, true);
            } catch (Exception e) {
                System.err.println("Failed to send rejection email: " + e.getMessage());
            }
        }

        return AdminDocumentMapper.toResponse(doc, owner);
    }

    private void triggerChunkingAfterCommit(Long docId) {
        if (org.springframework.transaction.support.TransactionSynchronizationManager.isActualTransactionActive()) {
            org.springframework.transaction.support.TransactionSynchronizationManager.registerSynchronization(
                new org.springframework.transaction.support.TransactionSynchronization() {
                    @Override
                    public void afterCommit() {
                        documentChunkingService.chunkAndIndexDocument(docId);
                    }
                }
            );
        } else {
            documentChunkingService.chunkAndIndexDocument(docId);
        }
    }
}
// Force JDT LS revalidation
