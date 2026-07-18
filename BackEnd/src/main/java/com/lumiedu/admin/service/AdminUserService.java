package com.lumiedu.admin.service;

import com.lumiedu.admin.dto.request.*;
import com.lumiedu.admin.dto.response.AdminUserResponse;
import com.lumiedu.user.enums.AccountStatus;
import com.lumiedu.user.enums.UserRole;
import java.util.List;

public interface AdminUserService {
    List<AdminUserResponse> getUsers(String keyword, UserRole role, AccountStatus status, int page, int size);
    AdminUserResponse getUserById(Long id);
    AdminUserResponse updateUser(Long id, AdminUpdateUserRequest request);
    AdminUserResponse updateUserRole(Long id, AdminUpdateUserRoleRequest request);
    AdminUserResponse updateUserStatus(Long id, AdminUpdateUserStatusRequest request);
    AdminUserResponse updateUserPlan(Long id, AdminUpdateUserPlanRequest request);
    void deleteUser(Long id, String reason);
}
