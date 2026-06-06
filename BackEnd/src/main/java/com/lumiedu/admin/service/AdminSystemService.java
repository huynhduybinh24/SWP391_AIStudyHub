package com.lumiedu.admin.service;

import com.lumiedu.admin.dto.request.AdminSystemStatusRequest;
import com.lumiedu.admin.dto.response.AdminHealthResponse;
import com.lumiedu.admin.dto.response.AdminSystemStatusResponse;

public interface AdminSystemService {
    AdminSystemStatusResponse getSystemStatus();
    AdminSystemStatusResponse updateSystemStatus(AdminSystemStatusRequest request);
    AdminHealthResponse getSystemHealth();
}
