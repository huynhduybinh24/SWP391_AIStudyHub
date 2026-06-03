package com.lumiedu.user.service;

import com.lumiedu.user.dto.request.ChangeAccountStatusRequest;
import com.lumiedu.user.dto.request.ChangeUserRoleRequest;
import com.lumiedu.user.dto.request.UpdateUserProfileRequest;
import com.lumiedu.user.dto.response.UserResponse;

import java.util.List;

public interface UserService {
    List<UserResponse> getAllUsers();
    UserResponse getUserById(Long id);
    UserResponse getUserByEmail(String email);
    UserResponse updateUserProfile(Long userId, UpdateUserProfileRequest request);
    UserResponse updateUserRole(Long userId, ChangeUserRoleRequest request);
    UserResponse updateAccountStatus(Long userId, ChangeAccountStatusRequest request);
    void deleteUser(Long userId);
}
