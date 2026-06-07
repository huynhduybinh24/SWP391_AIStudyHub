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
        String adminHtml = String.format(
                "<h2>Có yêu cầu hỗ trợ mới!</h2>" +
                "<p><strong>Mã vé:</strong> #%d</p>" +
                "<p><strong>Người gửi:</strong> %s (%s)</p>" +
                "<p><strong>Tiêu đề:</strong> %s</p>" +
                "<p><strong>Nội dung:</strong></p>" +
                "<blockquote style='background:#f9f9f9;border-left:5px solid #ccc;padding:10px;margin:10px 0;'>%s</blockquote>" +
                "<p><a href='http://localhost:8386/dashboard/admin?tab=support' style='background:#3155F6;color:white;padding:10px 20px;text-decoration:none;border-radius:5px;display:inline-block;font-weight:bold;'>Truy cập Trang Quản Trị</a></p>",
                savedTicket.getId(), ticket.getName(), ticket.getEmail(), ticket.getSubject(), ticket.getMessage()
        );
        emailService.sendEmail(adminEmail, "LumiEdu - Yêu cầu hỗ trợ mới #" + savedTicket.getId(), adminHtml, true);

        // 2. Send Confirmation Email to User/Guest (Async)
        String userHtml = String.format(
                "<h3>Chào %s,</h3>" +
                "<p>Cảm ơn bạn đã liên hệ với LumiEdu. Chúng tôi đã nhận được yêu cầu hỗ trợ của bạn (Mã vé: <strong>#%d</strong>).</p>" +
                "<p><strong>Tiêu đề:</strong> %s</p>" +
                "<p><strong>Nội dung yêu cầu:</strong></p>" +
                "<div style='background:#f4f6f8;border:1px solid #e1e4e6;border-radius:6px;padding:15px;margin:15px 0;'>%s</div>" +
                "<p>Đội ngũ hỗ trợ của chúng tôi sẽ phản hồi lại bạn sớm nhất qua email này.</p>" +
                "<p>Trân trọng,<br/><strong>Ban quản trị LumiEdu</strong></p>",
                ticket.getName(), savedTicket.getId(), ticket.getSubject(), ticket.getMessage()
        );
        emailService.sendEmail(ticket.getEmail(), "LumiEdu - Xác nhận yêu cầu hỗ trợ #" + savedTicket.getId(), userHtml, true);

        return mapToTicketResponse(savedTicket);
    }

    public SupportMessageResponse replyFromAdmin(Long ticketId, String messageContent, String adminName, String adminEmail) {
        SupportTicket ticket = ticketRepository.findById(ticketId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy Ticket với ID: " + ticketId));

        SupportMessage message = SupportMessage.builder()
                .ticketId(ticketId)
                .senderName(adminName)
                .senderEmail(adminEmail)
                .message(messageContent)
                .isFromAdmin(true)
                .build();

        SupportMessage savedMessage = messageRepository.save(message);

        // Update Ticket Status
        ticket.setStatus(TicketStatus.IN_PROGRESS);
        ticketRepository.save(ticket);

        // Send Reply Email to User/Guest (Async)
        String replyHtml = String.format(
                "<h3>Chào %s,</h3>" +
                "<p>Đội ngũ hỗ trợ LumiEdu đã phản hồi về yêu cầu <strong>#%d: %s</strong> của bạn:</p>" +
                "<div style='background:#f4f6f8;border:1px solid #e1e4e6;border-radius:6px;padding:15px;margin:15px 0;white-space:pre-wrap;font-family:sans-serif;'>%s</div>" +
                "<p>Trân trọng,<br/><strong>%s</strong> (Ban quản trị LumiEdu)</p>",
                ticket.getName(), ticket.getId(), ticket.getSubject(), messageContent, adminName
        );
        emailService.sendEmail(ticket.getEmail(), "Re: LumiEdu - Phản hồi hỗ trợ #" + ticket.getId(), replyHtml, true);

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
        String adminHtml = String.format(
                "<h3>Người dùng đã phản hồi yêu cầu hỗ trợ!</h3>" +
                "<p><strong>Mã vé:</strong> #%d</p>" +
                "<p><strong>Người gửi:</strong> %s (%s)</p>" +
                "<p><strong>Tiêu đề vé:</strong> %s</p>" +
                "<p><strong>Nội dung phản hồi mới:</strong></p>" +
                "<blockquote style='background:#f9f9f9;border-left:5px solid #ccc;padding:10px;margin:10px 0;white-space:pre-wrap;'>%s</blockquote>" +
                "<p><a href='http://localhost:8386/dashboard/admin?tab=support' style='background:#3155F6;color:white;padding:10px 20px;text-decoration:none;border-radius:5px;display:inline-block;font-weight:bold;'>Trả lời trên trang Quản Trị</a></p>",
                ticket.getId(), userName, userEmail, ticket.getSubject(), messageContent
        );
        emailService.sendEmail(adminEmail, "LumiEdu - Phản hồi mới từ Người dùng cho vé #" + ticket.getId(), adminHtml, true);

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
        if (status == TicketStatus.RESOLVED || status == TicketStatus.CLOSED) {
            String statusWord = status == TicketStatus.RESOLVED ? "Đã giải quyết" : "Đã đóng";
            String emailHtml = String.format(
                    "<h3>Kính chào %s,</h3>" +
                    "<p>Yêu cầu hỗ trợ của bạn (Mã vé: <strong>#%d</strong>) đã được chuyển sang trạng thái: <strong>%s</strong>.</p>" +
                    "<p>Nếu bạn vẫn cần trợ giúp thêm, vui lòng gửi phản hồi trực tiếp hoặc mở vé mới.</p>" +
                    "<p>Cảm ơn bạn đã đồng hành cùng LumiEdu.</p>",
                    ticket.getName(), ticket.getId(), statusWord
            );
            emailService.sendEmail(ticket.getEmail(), "LumiEdu - Yêu cầu hỗ trợ #" + ticket.getId() + " - " + statusWord, emailHtml, true);
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
