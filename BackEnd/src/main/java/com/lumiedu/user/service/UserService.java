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
    java.util.List<com.lumiedu.auth.dto.ThirdPartyAccountResponse> getLinkedAccounts(Long userId);
    void linkThirdPartyAccount(Long userId, String code, String redirectUri, String provider);
    void unlinkThirdPartyAccount(Long userId, String provider);
}
