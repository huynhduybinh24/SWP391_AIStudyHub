package com.lumiedu.support.service;

import com.lumiedu.email.service.EmailService;
import com.lumiedu.support.dto.*;
import com.lumiedu.support.entity.*;
import com.lumiedu.support.enums.TicketStatus;
import com.lumiedu.support.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
public class SupportTicketService {

    private final SupportTicketRepository ticketRepository;
    private final SupportMessageRepository messageRepository;
    private final EmailService emailService;

    @Value("${app.admin.email}")
    private String adminEmail;

    public SupportTicketResponse createTicket(SupportTicketRequest request, Long userId) {
        SupportTicket ticket = SupportTicket.builder()
                .name(request.getName())
                .email(request.getEmail())
                .subject(request.getSubject())
                .message(request.getMessage())
                .status(TicketStatus.PENDING)
                .userId(userId)
                .build();

        SupportTicket savedTicket = ticketRepository.save(ticket);

        // 1. Send Email Notification to Admin (Async)
        // User/Guest sends to Admin: From = User/Guest's email, To = Admin's email
        String adminHtmlContent = String.format(
                "<p><strong>Mã vé:</strong> #%d</p>" +
                "<p><strong>Người gửi:</strong> %s (%s)</p>" +
                "<p><strong>Tiêu đề:</strong> %s</p>" +
                "<p><strong>Nội dung:</strong></p>" +
                "<div class=\"highlight-card\" style=\"white-space: pre-wrap;\">%s</div>" +
                "<p><a href=\"http://localhost:8386/dashboard/admin?tab=support\" class=\"btn\">Truy cập Trang Quản Trị</a></p>",
                savedTicket.getId(), ticket.getName(), ticket.getEmail(), ticket.getSubject(), ticket.getMessage()
        );
        String adminHtml = emailService.buildHtmlTemplate(
                "Yêu cầu hỗ trợ mới",
                "Có yêu cầu hỗ trợ mới!",
                adminHtmlContent
        );
        emailService.sendEmail(adminEmail, ticket.getEmail(), ticket.getName(), "LumiEdu - Yêu cầu hỗ trợ mới #" + savedTicket.getId(), adminHtml, true);

        // 2. Send Confirmation Email to User/Guest (Async)
        // Admin sends to User/Guest: From = Admin's email, To = User/Guest's email
        String userHtmlContent = String.format(
                "<p>Chào <strong>%s</strong>,</p>" +
                "<p>Cảm ơn bạn đã liên hệ với LumiEdu. Chúng tôi đã nhận được yêu cầu hỗ trợ của bạn (Mã vé: <strong>#%d</strong>).</p>" +
                "<p><strong>Tiêu đề:</strong> %s</p>" +
                "<p><strong>Nội dung yêu cầu:</strong></p>" +
                "<div class=\"highlight-card\" style=\"white-space: pre-wrap;\">%s</div>" +
                "<p>Đội ngũ hỗ trợ của chúng tôi sẽ phản hồi lại bạn sớm nhất qua email này.</p>",
                ticket.getName(), savedTicket.getId(), ticket.getSubject(), ticket.getMessage()
        );
        String userHtml = emailService.buildHtmlTemplate(
                "Xác nhận yêu cầu hỗ trợ",
                "Chúng tôi đã nhận được yêu cầu hỗ trợ!",
                userHtmlContent
        );
        emailService.sendEmail(ticket.getEmail(), adminEmail, "LumiEdu Support", "LumiEdu - Xác nhận yêu cầu hỗ trợ #" + savedTicket.getId(), userHtml, true);

        return mapToTicketResponse(savedTicket);
    }

    public SupportMessageResponse replyFromAdmin(Long ticketId, String messageContent, String adminName, String adminEmailAddress) {
        SupportTicket ticket = ticketRepository.findById(ticketId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy Ticket với ID: " + ticketId));

        SupportMessage message = SupportMessage.builder()
                .ticketId(ticketId)
                .senderName(adminName)
                .senderEmail(adminEmailAddress)
                .message(messageContent)
                .isFromAdmin(true)
                .build();

        SupportMessage savedMessage = messageRepository.save(message);

        // Update Ticket Status
        ticket.setStatus(TicketStatus.IN_PROGRESS);
        ticketRepository.save(ticket);

        // Send Reply Email to User/Guest (Async)
        // Admin sends to User/Guest: From = Admin's email, To = User's email
        String replyHtmlContent = String.format(
                "<p>Chào <strong>%s</strong>,</p>" +
                "<p>Đội ngũ hỗ trợ LumiEdu đã phản hồi về yêu cầu <strong>#%d: %s</strong> của bạn:</p>" +
                "<div class=\"highlight-card\" style=\"white-space: pre-wrap;\">%s</div>" +
                "<p>Trân trọng,<br/><strong>%s</strong> (Ban quản trị LumiEdu)</p>",
                ticket.getName(), ticket.getId(), ticket.getSubject(), messageContent, adminName
        );
        String replyHtml = emailService.buildHtmlTemplate(
                "Phản hồi từ hỗ trợ",
                "Phản hồi hỗ trợ mới",
                replyHtmlContent
        );
        emailService.sendEmail(ticket.getEmail(), adminEmail, adminName + " (LumiEdu Support)", "Re: LumiEdu - Phản hồi hỗ trợ #" + ticket.getId(), replyHtml, true);

        return mapToMessageResponse(savedMessage);
    }

    public SupportMessageResponse replyFromUser(Long ticketId, String messageContent, String userName, String userEmail) {
        SupportTicket ticket = ticketRepository.findById(ticketId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy Ticket với ID: " + ticketId));

        SupportMessage message = SupportMessage.builder()
                .ticketId(ticketId)
                .senderName(userName)
                .senderEmail(userEmail)
                .message(messageContent)
                .isFromAdmin(false)
                .build();

        SupportMessage savedMessage = messageRepository.save(message);

        // Update Ticket Status back to PENDING as User has replied
        ticket.setStatus(TicketStatus.PENDING);
        ticketRepository.save(ticket);

        // Send email notification to Admin (Async)
        // User sends to Admin: From = User's email, To = Admin's email
        String adminHtmlContent = String.format(
                "<p><strong>Mã vé:</strong> #%d</p>" +
                "<p><strong>Người gửi:</strong> %s (%s)</p>" +
                "<p><strong>Tiêu đề vé:</strong> %s</p>" +
                "<p><strong>Nội dung phản hồi mới:</strong></p>" +
                "<div class=\"highlight-card\" style=\"white-space: pre-wrap;\">%s</div>" +
                "<p><a href=\"http://localhost:8386/dashboard/admin?tab=support\" class=\"btn\">Trả lời trên trang Quản Trị</a></p>",
                ticket.getId(), userName, userEmail, ticket.getSubject(), messageContent
        );
        String adminHtml = emailService.buildHtmlTemplate(
                "Phản hồi mới từ người dùng",
                "Người dùng đã phản hồi yêu cầu hỗ trợ!",
                adminHtmlContent
        );
        emailService.sendEmail(adminEmail, userEmail, userName, "LumiEdu - Phản hồi mới từ Người dùng cho vé #" + ticket.getId(), adminHtml, true);

        return mapToMessageResponse(savedMessage);
    }

    @Transactional(readOnly = true)
    public List<SupportTicketResponse> getAllTickets() {
        return ticketRepository.findAllByOrderByCreatedAtDesc()
                .stream()
                .map(this::mapToTicketResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public TicketDetailResponse getTicketDetail(Long ticketId) {
        SupportTicket ticket = ticketRepository.findById(ticketId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy Ticket với ID: " + ticketId));

        List<SupportMessageResponse> messages = messageRepository.findByTicketIdOrderByCreatedAtAsc(ticketId)
                .stream()
                .map(this::mapToMessageResponse)
                .collect(Collectors.toList());

        return TicketDetailResponse.builder()
                .ticket(mapToTicketResponse(ticket))
                .messages(messages)
                .build();
    }

    @Transactional(readOnly = true)
    public List<SupportTicketResponse> getTicketsByUserId(Long userId) {
        return ticketRepository.findByUserIdOrderByCreatedAtDesc(userId)
                .stream()
                .map(this::mapToTicketResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<SupportTicketResponse> getTicketsByStatus(TicketStatus status) {
        return ticketRepository.findByStatusOrderByCreatedAtDesc(status)
                .stream()
                .map(this::mapToTicketResponse)
                .collect(Collectors.toList());
    }

    public SupportTicketResponse updateTicketStatus(Long ticketId, TicketStatus status) {
        SupportTicket ticket = ticketRepository.findById(ticketId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy Ticket với ID: " + ticketId));

        ticket.setStatus(status);
        SupportTicket updatedTicket = ticketRepository.save(ticket);

        // Optionally notify user about status change if it is closed or resolved
        // Admin sends to User: From = Admin's email, To = User's email
        if (status == TicketStatus.RESOLVED || status == TicketStatus.CLOSED) {
            String statusWord = status == TicketStatus.RESOLVED ? "Đã giải quyết" : "Đã đóng";
            String emailHtmlContent = String.format(
                    "<p>Chào <strong>%s</strong>,</p>" +
                    "<p>Yêu cầu hỗ trợ của bạn (Mã vé: <strong>#%d</strong>) đã được chuyển sang trạng thái: <strong>%s</strong>.</p>" +
                    "<p>Nếu bạn vẫn cần trợ giúp thêm, vui lòng phản hồi trực tiếp bằng cách trả lời email này hoặc mở một yêu cầu hỗ trợ mới.</p>",
                    ticket.getName(), ticket.getId(), statusWord
            );
            String emailHtml = emailService.buildHtmlTemplate(
                    "Cập nhật trạng thái yêu cầu",
                    "Yêu cầu hỗ trợ đã được xử lý",
                    emailHtmlContent
            );
            emailService.sendEmail(ticket.getEmail(), adminEmail, "LumiEdu Support", "LumiEdu - Yêu cầu hỗ trợ #" + ticket.getId() + " - " + statusWord, emailHtml, true);
        }

        return mapToTicketResponse(updatedTicket);
    }

    private SupportTicketResponse mapToTicketResponse(SupportTicket ticket) {
        return SupportTicketResponse.builder()
                .id(ticket.getId())
                .name(ticket.getName())
                .email(ticket.getEmail())
                .subject(ticket.getSubject())
                .message(ticket.getMessage())
                .status(ticket.getStatus())
                .userId(ticket.getUserId())
                .createdAt(ticket.getCreatedAt())
                .updatedAt(ticket.getUpdatedAt())
                .build();
    }

    private SupportMessageResponse mapToMessageResponse(SupportMessage message) {
        return SupportMessageResponse.builder()
                .id(message.getId())
                .ticketId(message.getTicketId())
                .senderEmail(message.getSenderEmail())
                .senderName(message.getSenderName())
                .message(message.getMessage())
                .isFromAdmin(message.getIsFromAdmin())
                .createdAt(message.getCreatedAt())
                .build();
    }
}
