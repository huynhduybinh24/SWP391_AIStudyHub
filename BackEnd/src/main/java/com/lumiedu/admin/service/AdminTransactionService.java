package com.lumiedu.admin.service;

import com.lumiedu.admin.dto.request.AdminUpdateTransactionStatusRequest;
import com.lumiedu.admin.dto.response.AdminRevenueStatsResponse;
import com.lumiedu.admin.dto.response.AdminTransactionResponse;
import java.util.List;

public interface AdminTransactionService {
    List<AdminTransactionResponse> getTransactions(int page, int size);
    AdminTransactionResponse getTransactionById(Long id);
    AdminTransactionResponse updateTransactionStatus(Long id, AdminUpdateTransactionStatusRequest request);
    AdminRevenueStatsResponse getRevenueStats();
}
