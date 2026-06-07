package com.lumiedu.support.controller;

import com.lumiedu.notification.dto.response.ApiResponse;
import com.lumiedu.support.dto.*;
import com.lumiedu.support.enums.TicketStatus;
import com.lumiedu.support.service.SupportTicketService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/support/tickets")
@RequiredArgsConstructor
public class SupportTicketController {

    private final SupportTicketService ticketService;

    @PostMapping
    public ResponseEntity<ApiResponse<SupportTicketResponse>> createTicket(
            @Valid @RequestBody SupportTicketRequest request,
            @RequestParam(required = false) Long userId) {
        SupportTicketResponse data = ticketService.createTicket(request, userId);
        return ResponseEntity.ok(ApiResponse.ok("Tạo yêu cầu hỗ trợ thành công", data));
    }

    @GetMapping("/my")
    public ResponseEntity<ApiResponse<List<SupportTicketResponse>>> getMyTickets(@RequestParam Long userId) {
        List<SupportTicketResponse> data = ticketService.getTicketsByUserId(userId);
        return ResponseEntity.ok(ApiResponse.ok("Tải danh sách yêu cầu thành công", data));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<SupportTicketResponse>>> getAllTickets(
            @RequestParam(required = false) TicketStatus status) {
        List<SupportTicketResponse> data;
        if (status != null) {
            data = ticketService.getTicketsByStatus(status);
        } else {
            data = ticketService.getAllTickets();
        }
        return ResponseEntity.ok(ApiResponse.ok("Tải toàn bộ yêu cầu hỗ trợ thành công", data));
    }

    @GetMapping("/{ticketId}")
    public ResponseEntity<ApiResponse<TicketDetailResponse>> getTicketDetail(@PathVariable Long ticketId) {
        TicketDetailResponse data = ticketService.getTicketDetail(ticketId);
        return ResponseEntity.ok(ApiResponse.ok("Tải chi tiết yêu cầu hỗ trợ thành công", data));
    }

    @PostMapping("/{ticketId}/reply")
    public ResponseEntity<ApiResponse<SupportMessageResponse>> replyToTicket(
            @PathVariable Long ticketId,
            @Valid @RequestBody SupportMessageRequest request) {
        SupportMessageResponse data;
        if (Boolean.TRUE.equals(request.getIsFromAdmin())) {
            data = ticketService.replyFromAdmin(ticketId, request.getMessageContent(), request.getSenderName(), request.getSenderEmail());
        } else {
            data = ticketService.replyFromUser(ticketId, request.getMessageContent(), request.getSenderName(), request.getSenderEmail());
        }
        return ResponseEntity.ok(ApiResponse.ok("Gửi phản hồi thành công", data));
    }

    @PutMapping("/{ticketId}/status")
    public ResponseEntity<ApiResponse<SupportTicketResponse>> updateStatus(
            @PathVariable Long ticketId,
            @RequestParam TicketStatus status) {
        SupportTicketResponse data = ticketService.updateTicketStatus(ticketId, status);
        return ResponseEntity.ok(ApiResponse.ok("Cập nhật trạng thái thành công", data));
    }
}
