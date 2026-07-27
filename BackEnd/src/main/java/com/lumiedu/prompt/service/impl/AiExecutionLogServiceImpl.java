package com.lumiedu.prompt.service.impl;

import com.lumiedu.prompt.dto.response.AiExecutionLogResponse;
import com.lumiedu.prompt.entity.AiExecutionLog;
import com.lumiedu.prompt.entity.PromptVersion;
import com.lumiedu.prompt.enums.ExecutionStatus;
import com.lumiedu.prompt.repository.AiExecutionLogRepository;
import com.lumiedu.prompt.service.AiExecutionLogService;
import com.lumiedu.user.entity.User;
import jakarta.persistence.criteria.Predicate;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.lumiedu.ai.entity.AiChatMessage;
import com.lumiedu.ai.repository.AiChatMessageRepository;
import com.lumiedu.email.service.EmailService;
import com.lumiedu.notification.dto.request.NotificationRequest;
import com.lumiedu.notification.service.NotificationService;
import com.lumiedu.user.enums.UserRole;
import com.lumiedu.user.repository.UserRepository;
import org.springframework.data.domain.PageRequest;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Optional;
import java.util.Set;

@Service
@RequiredArgsConstructor
@Transactional
public class AiExecutionLogServiceImpl implements AiExecutionLogService {

    private final AiExecutionLogRepository aiExecutionLogRepository;
    private final UserRepository userRepository;
    private final NotificationService notificationService;
    private final EmailService emailService;
    private final AiChatMessageRepository aiChatMessageRepository;

    @Value("${app.admin.email:lumieduteam@gmail.com}")
    private String configuredAdminEmail;

    @Override
    public AiExecutionLog createProcessingLog(
            User user,
            String studentCode,
            String featureType,
            PromptVersion promptVersion,
            String knowledgeBaseId,
            String knowledgeVersion,
            String llmProvider,
            String llmModel,
            String requestId,
            String inputMetadata
    ) {
        AiExecutionLog log = AiExecutionLog.builder()
                .user(user)
                .studentCode(studentCode)
                .featureType(featureType)
                .prompt(promptVersion.getPrompt())
                .promptCode(promptVersion.getPrompt().getCode())
                .promptVersionEntity(promptVersion)
                .promptVersion(promptVersion.getVersion())
                .knowledgeBaseId(knowledgeBaseId)
                .knowledgeVersion(knowledgeVersion)
                .llmProvider(llmProvider != null ? llmProvider : "Google")
                .llmModel(llmModel != null ? llmModel : "gemini-3.1-flash-lite")
                .requestId(requestId)
                .status(ExecutionStatus.PROCESSING)
                .startedAt(LocalDateTime.now())
                .inputMetadata(inputMetadata)
                .build();

        return aiExecutionLogRepository.save(log);
    }

    @Override
    public void updateLogStatus(
            Long logId,
            ExecutionStatus status,
            String errorMessage,
            Integer tokenUsage,
            String outputReference,
            String providerRequestId
    ) {
        AiExecutionLog log = aiExecutionLogRepository.findById(logId).orElse(null);
        if (log == null) return;

        LocalDateTime now = LocalDateTime.now();
        log.setStatus(status);
        log.setCompletedAt(now);
        if (log.getStartedAt() != null) {
            log.setLatencyMs(Duration.between(log.getStartedAt(), now).toMillis());
        }
        if (errorMessage != null) {
            log.setErrorMessage(errorMessage);
        }
        if (tokenUsage != null) {
            log.setTokenUsage(tokenUsage);
        }
        if (outputReference != null) {
            log.setOutputReference(outputReference);
        }
        if (providerRequestId != null) {
            log.setProviderRequestId(providerRequestId);
        }

        aiExecutionLogRepository.save(log);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<AiExecutionLogResponse> getLogs(
            String studentCode,
            String featureType,
            String promptCode,
            String promptVersion,
            String knowledgeVersion,
            String llmModel,
            ExecutionStatus status,
            LocalDateTime fromDate,
            LocalDateTime toDate,
            Boolean flaggedOnly,
            Pageable pageable
    ) {
        Specification<AiExecutionLog> spec = (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();

            if (studentCode != null && !studentCode.trim().isEmpty()) {
                predicates.add(cb.like(cb.lower(root.get("studentCode")), "%" + studentCode.trim().toLowerCase() + "%"));
            }
            if (featureType != null && !featureType.trim().isEmpty()) {
                predicates.add(cb.equal(root.get("featureType"), featureType.trim()));
            }
            if (promptCode != null && !promptCode.trim().isEmpty()) {
                predicates.add(cb.equal(root.get("promptCode"), promptCode.trim().toUpperCase()));
            }
            if (promptVersion != null && !promptVersion.trim().isEmpty()) {
                predicates.add(cb.equal(root.get("promptVersion"), promptVersion.trim()));
            }
            if (knowledgeVersion != null && !knowledgeVersion.trim().isEmpty()) {
                predicates.add(cb.equal(root.get("knowledgeVersion"), knowledgeVersion.trim()));
            }
            if (llmModel != null && !llmModel.trim().isEmpty()) {
                predicates.add(cb.equal(root.get("llmModel"), llmModel.trim()));
            }
            if (status != null) {
                predicates.add(cb.equal(root.get("status"), status));
            }
            if (fromDate != null) {
                predicates.add(cb.greaterThanOrEqualTo(root.get("createdAt"), fromDate));
            }
            if (toDate != null) {
                predicates.add(cb.lessThanOrEqualTo(root.get("createdAt"), toDate));
            }
            if (Boolean.TRUE.equals(flaggedOnly)) {
                predicates.add(cb.equal(root.get("flagged"), true));
            }

            return cb.and(predicates.toArray(new Predicate[0]));
        };

        return aiExecutionLogRepository.findAll(spec, pageable).map(this::mapToResponse);
    }

    @Override
    @Transactional(readOnly = true)
    public AiExecutionLogResponse getLogById(Long logId) {
        AiExecutionLog log = aiExecutionLogRepository.findById(logId)
                .orElseThrow(() -> new IllegalArgumentException("AI Execution log not found with id: " + logId));
        return mapToResponse(log);
    }

    @Override
    public AiExecutionLogResponse reportLog(Long logId, String reason, User user) {
        AiExecutionLog log = null;
        if (logId != null) {
            log = aiExecutionLogRepository.findById(logId).orElse(null);

            // Fallback 1: If logId is an AiChatMessage ID, check its linked executionLogId
            if (log == null) {
                Optional<AiChatMessage> chatMsgOpt = aiChatMessageRepository.findById(logId);
                if (chatMsgOpt.isPresent() && chatMsgOpt.get().getExecutionLogId() != null) {
                    log = aiExecutionLogRepository.findById(chatMsgOpt.get().getExecutionLogId()).orElse(null);
                }
            }
        }

        // Fallback 2: Get latest execution log for user if log is still null
        if (log == null && user != null) {
            Page<AiExecutionLog> userLogs = aiExecutionLogRepository.findByUserIdOrderByCreatedAtDesc(user.getId(), PageRequest.of(0, 1));
            if (!userLogs.isEmpty()) {
                log = userLogs.getContent().get(0);
            }
        }

        if (log == null) {
            throw new IllegalArgumentException("Không tìm thấy nhật ký thực thi AI tương ứng để báo cáo.");
        }

        if (reason == null || reason.trim().isEmpty()) {
            throw new IllegalArgumentException("Vui lòng chọn hoặc nhập lý do báo cáo!");
        }

        log.setFlagged(true);
        log.setReportReason(reason.trim());
        log.setReportedAt(LocalDateTime.now());

        AiExecutionLog savedLog = aiExecutionLogRepository.save(log);

        // Notify all admins in real-time (WebSocket + In-app + Email)
        try {
            List<User> admins = userRepository.findByRole(UserRole.ADMIN);
            String reporterInfo = user != null ? (user.getFullName() != null ? user.getFullName() : user.getEmail()) : "Sinh viên";

            // 1. WebSocket & System Notifications
            for (User admin : admins) {
                NotificationRequest notif = NotificationRequest.builder()
                        .targetUserEmail(admin.getEmail())
                        .type("SECURITY")
                        .title("🚩 Báo cáo phản hồi AI: [" + savedLog.getPromptCode() + "]")
                        .message(String.format("%s vừa báo cáo câu trả lời AI (%s - %s). Lý do: %s",
                                reporterInfo,
                                savedLog.getPromptCode(),
                                savedLog.getPromptVersion(),
                                reason.trim()))
                        .actionType("ai_report")
                        .actionText("Kiểm tra Log AI Execution")
                        .actionUrl("/dashboard/admin?tab=ai-logs")
                        .reason(reason.trim())
                        .build();
                notificationService.createNotification(notif);
            }

            // 2. Instant Email Notification
            String emailSubject = "🚩 [LumiEdu AI Audit] Cảnh báo Báo cáo AI Response: " + savedLog.getPromptCode();
            String emailHeading = "Cảnh báo Báo cáo Phản hồi AI từ Sinh viên";
            String emailBodyContent = String.format(
                    "<p>Kính gửi Ban Quản trị LumiEdu,</p>" +
                    "<p>Hệ thống vừa ghi nhận <strong>01 lượt báo cáo mới</strong> từ sinh viên về câu trả lời của AI:</p>" +
                    "<div style=\"background-color:#fff5f5; border:1px solid #feb2b2; padding:16px; border-radius:12px; margin:16px 0;\">" +
                    "  <p style=\"margin:0 0 8px 0;\"><strong>Sinh viên báo cáo:</strong> %s</p>" +
                    "  <p style=\"margin:0 0 8px 0;\"><strong>Prompt Code:</strong> <code>%s</code> (Phiên bản: <strong>%s</strong>)</p>" +
                    "  <p style=\"margin:0 0 8px 0;\"><strong>Feature Type:</strong> %s</p>" +
                    "  <p style=\"margin:0 0 8px 0; color:#c53030;\"><strong>Lý do báo cáo:</strong> %s</p>" +
                    "  <p style=\"margin:0;\"><strong>Thời gian:</strong> %s</p>" +
                    "</div>" +
                    "<p>Vui lòng kiểm tra lại bộ chỉ thị Prompt gốc và tạo phiên bản mới nếu cần thiết.</p>" +
                    "<a href=\"http://localhost:5173/dashboard/admin?tab=ai-logs\" style=\"display:inline-block; background-color:#e53e3e; color:#ffffff !important; padding:12px 24px; font-size:14px; font-weight:700; text-decoration:none; border-radius:8px; margin-top:12px;\">Kiểm tra AI Execution Logs</a>",
                    reporterInfo,
                    savedLog.getPromptCode(),
                    savedLog.getPromptVersion(),
                    savedLog.getFeatureType(),
                    reason.trim(),
                    savedLog.getReportedAt() != null ? savedLog.getReportedAt().toString() : LocalDateTime.now().toString()
            );
            String htmlTemplate = emailService.buildHtmlTemplate(emailSubject, emailHeading, emailBodyContent);

            Set<String> recipientEmails = new HashSet<>();
            for (User admin : admins) {
                if (admin.getEmail() != null && !admin.getEmail().trim().isEmpty()) {
                    recipientEmails.add(admin.getEmail().trim());
                }
            }
            if (configuredAdminEmail != null && !configuredAdminEmail.trim().isEmpty()) {
                recipientEmails.add(configuredAdminEmail.trim());
            }

            for (String recipientEmail : recipientEmails) {
                emailService.sendEmail(recipientEmail, emailSubject, htmlTemplate, true);
            }
        } catch (Exception e) {
            System.err.println("Failed to send admin notifications/emails for AI report: " + e.getMessage());
        }

        return mapToResponse(savedLog);
    }

    @Override
    public AiExecutionLogResponse resolveReport(Long logId) {
        AiExecutionLog log = aiExecutionLogRepository.findById(logId)
                .orElseThrow(() -> new IllegalArgumentException("AI Execution log not found with id: " + logId));

        log.setFlagged(false);
        AiExecutionLog savedLog = aiExecutionLogRepository.save(log);

        // Notify student reporter via WebSocket + In-app Notification + Email
        User reporter = savedLog.getUser();
        if (reporter != null && reporter.getEmail() != null && !reporter.getEmail().trim().isEmpty()) {
            try {
                String reporterName = reporter.getFullName() != null ? reporter.getFullName() : reporter.getEmail();

                    // 1. In-App & WebSocket Notification to student
                    NotificationRequest notif = NotificationRequest.builder()
                            .targetUserEmail(reporter.getEmail())
                            .type("SYSTEM")
                            .title("Phản hồi Báo cáo AI Response 🚩")
                            .message(String.format("Báo cáo của bạn về lượt phản hồi AI (Prompt: %s) đã được Admin xem xét và xử lý hoàn tất. Cảm ơn sự đóng góp của bạn!", savedLog.getPromptCode()))
                            .actionType("ai_report_resolved")
                            .actionText("Trải nghiệm trợ lý AI")
                            .actionUrl("/chat")
                            .build();
                    notificationService.createNotification(notif);

                    // 2. HTML Email Notification to student
                    String emailSubject = "[LumiEdu] Cập nhật kết quả Báo cáo câu trả lời AI từ Ban Quản trị";
                    String emailHeading = "Báo cáo phản hồi AI đã được xem xét & xử lý";
                    String emailBodyContent = String.format(
                            "<p>Chào <strong>%s</strong>,</p>" +
                            "<p>Cảm ơn bạn đã gửi báo cáo phản hồi về câu trả lời của AI trên nền tảng LumiEdu. Ban Quản trị đã tiến hành kiểm tra, đánh giá và cập nhật quy định chỉ thị (Prompt) tương ứng.</p>" +
                            "<div style=\"background-color:#f0fdf4; border:1px solid #bbf7d0; padding:16px; border-radius:12px; margin:16px 0;\">" +
                            "  <p style=\"margin:0 0 8px 0;\"><strong>Mã Prompt:</strong> <code>%s</code> (Phiên bản: <strong>%s</strong>)</p>" +
                            "  <p style=\"margin:0 0 8px 0;\"><strong>Nội dung báo cáo ban đầu:</strong> %s</p>" +
                            "  <p style=\"margin:0; color:#15803d;\"><strong>Trạng thái xử lý:</strong> Đã kiểm tra & hoàn tất ✔️</p>" +
                            "</div>" +
                            "<p>Ý kiến đóng góp của bạn giúp LumiEdu ngày càng hoàn thiện chất lượng hỗ trợ học tập!</p>" +
                            "<a href=\"http://localhost:5173/chat\" style=\"display:inline-block; background-color:#16a34a; color:#ffffff !important; padding:12px 24px; font-size:14px; font-weight:700; text-decoration:none; border-radius:8px; margin-top:12px;\">Tiếp tục trò chuyện với AI</a>",
                            reporterName,
                            savedLog.getPromptCode(),
                            savedLog.getPromptVersion(),
                            savedLog.getReportReason() != null ? savedLog.getReportReason() : "Báo cáo chất lượng câu trả lời"
                    );
                    String htmlTemplate = emailService.buildHtmlTemplate(emailSubject, emailHeading, emailBodyContent);
                    emailService.sendEmail(reporter.getEmail(), emailSubject, htmlTemplate, true);
            } catch (Exception e) {
                System.err.println("Failed to send reporter notification/email: " + e.getMessage());
            }
        }

        return mapToResponse(savedLog);
    }

    private AiExecutionLogResponse mapToResponse(AiExecutionLog log) {
        PromptVersion pv = log.getPromptVersionEntity();

        return AiExecutionLogResponse.builder()
                .id(log.getId())
                .userId(log.getUser() != null ? log.getUser().getId() : null)
                .userName(log.getUser() != null ? log.getUser().getFullName() : null)
                .studentCode(log.getStudentCode())
                .featureType(log.getFeatureType())
                .promptId(log.getPrompt() != null ? log.getPrompt().getId() : null)
                .promptCode(log.getPromptCode())
                .promptVersionId(pv != null ? pv.getId() : null)
                .promptVersion(log.getPromptVersion())
                .knowledgeBaseId(log.getKnowledgeBaseId())
                .knowledgeVersion(log.getKnowledgeVersion())
                .llmProvider(log.getLlmProvider())
                .llmModel(log.getLlmModel())
                .requestId(log.getRequestId())
                .providerRequestId(log.getProviderRequestId())
                .status(log.getStatus())
                .errorMessage(log.getErrorMessage())
                .startedAt(log.getStartedAt())
                .completedAt(log.getCompletedAt())
                .latencyMs(log.getLatencyMs())
                .tokenUsage(log.getTokenUsage())
                .inputMetadata(log.getInputMetadata())
                .outputReference(log.getOutputReference())
                .createdAt(log.getCreatedAt())
                .publishedByName(pv != null && pv.getPublishedBy() != null ? pv.getPublishedBy().getFullName() : null)
                .publishedAt(pv != null ? pv.getPublishedAt() : null)
                .flagged(log.getFlagged())
                .reportReason(log.getReportReason())
                .reportedAt(log.getReportedAt())
                .build();
    }
}
