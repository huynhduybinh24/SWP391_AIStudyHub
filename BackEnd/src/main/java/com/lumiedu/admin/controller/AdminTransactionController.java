package com.lumiedu.admin.controller;

import com.lumiedu.admin.dto.request.AdminUpdateTransactionStatusRequest;
import com.lumiedu.admin.dto.response.AdminRevenueStatsResponse;
import com.lumiedu.admin.dto.response.AdminTransactionResponse;
import com.lumiedu.admin.service.AdminTransactionService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin/transactions")
@RequiredArgsConstructor
public class AdminTransactionController {

    private final AdminTransactionService adminTransactionService;

    // TODO: Protect this endpoint with ADMIN role after security is configured.
    @GetMapping
    public ResponseEntity<List<AdminTransactionResponse>> getTransactions(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        return ResponseEntity.ok(adminTransactionService.getTransactions(page, size));
    }

    // TODO: Protect this endpoint with ADMIN role after security is configured.
    @GetMapping("/{id}")
    public ResponseEntity<AdminTransactionResponse> getTransactionById(@PathVariable Long id) {
        return ResponseEntity.ok(adminTransactionService.getTransactionById(id));
    }

    // TODO: Protect this endpoint with ADMIN role after security is configured.
    @PatchMapping("/{id}/status")
    public ResponseEntity<AdminTransactionResponse> updateTransactionStatus(
            @PathVariable Long id,
            @RequestBody @Valid AdminUpdateTransactionStatusRequest request) {
        return ResponseEntity.ok(adminTransactionService.updateTransactionStatus(id, request));
    }

    // TODO: Protect this endpoint with ADMIN role after security is configured.
    @GetMapping("/revenue")
    public ResponseEntity<AdminRevenueStatsResponse> getRevenueStats() {
        return ResponseEntity.ok(adminTransactionService.getRevenueStats());
    }
}
