package com.lumiedu.user.service.impl;

import com.lumiedu.user.dto.request.ChangeAccountStatusRequest;
import com.lumiedu.user.dto.request.ChangeUserRoleRequest;
import com.lumiedu.user.dto.request.UpdateUserProfileRequest;
import com.lumiedu.user.dto.response.UserResponse;
import com.lumiedu.user.entity.User;
import com.lumiedu.user.enums.AccountStatus;
import com.lumiedu.user.repository.UserRepository;
import com.lumiedu.user.service.UserService;
import com.lumiedu.auth.repository.ThirdPartyAccountRepository;
import com.lumiedu.auth.entity.ThirdPartyAccount;
import com.lumiedu.auth.enums.ProviderType;
import com.lumiedu.auth.dto.ThirdPartyAccountResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.web.client.RestTemplate;
import org.springframework.http.*;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import com.google.gson.JsonObject;
import com.google.gson.JsonParser;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
public class UserServiceImpl implements UserService {

    private final UserRepository userRepository;
    private final ThirdPartyAccountRepository thirdPartyAccountRepository;

    @Override
    @Transactional(readOnly = true)
    public List<UserResponse> getAllUsers() {
        return userRepository.findAll().stream()
                .map(this::mapToUserResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public UserResponse getUserById(Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found with id: " + id));
        return mapToUserResponse(user);
    }

    @Override
    @Transactional(readOnly = true)
    public UserResponse getUserByEmail(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found with email: " + email));
        return mapToUserResponse(user);
    }

    @Override
    public UserResponse updateUserProfile(Long userId, UpdateUserProfileRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found with id: " + userId));
        
        user.setFullName(request.getFullName());
        user.setAvatarUrl(request.getAvatarUrl());
        
        User updatedUser = userRepository.save(user);
        return mapToUserResponse(updatedUser);
    }

    @Override
    public UserResponse updateUserRole(Long userId, ChangeUserRoleRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found with id: " + userId));
        
        user.setRole(request.getRole());
        
        User updatedUser = userRepository.save(user);
        return mapToUserResponse(updatedUser);
    }

    @Override
    public UserResponse updateAccountStatus(Long userId, ChangeAccountStatusRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found with id: " + userId));
        
        user.setAccountStatus(request.getAccountStatus());
        
        User updatedUser = userRepository.save(user);
        return mapToUserResponse(updatedUser);
    }

    @Override
    public void deleteUser(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found with id: " + userId));
        
        user.setAccountStatus(AccountStatus.DELETED);
        userRepository.save(user);
    }

    @Value("${google.client-id:123456789-dummy.apps.googleusercontent.com}")
    private String googleClientId;

    @Value("${google.client-secret:mock-client-secret}")
    private String googleClientSecret;

    @Override
    @Transactional(readOnly = true)
    public List<ThirdPartyAccountResponse> getLinkedAccounts(Long userId) {
        return thirdPartyAccountRepository.findByUserId(userId).stream()
                .map(tp -> ThirdPartyAccountResponse.builder()
                        .id(tp.getId())
                        .providerType(tp.getProviderType())
                        .providerEmail(tp.getProviderEmail())
                        .linkedAt(tp.getCreatedAt())
                        .build())
                .collect(Collectors.toList());
    }

    @Override
    public void linkThirdPartyAccount(Long userId, String code, String redirectUri, String provider) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found with id: " + userId));

        ProviderType providerType = ProviderType.valueOf(provider.toUpperCase());
        String providerUserId = null;
        String providerEmail = null;

        if (providerType == ProviderType.GOOGLE) {
            boolean isMock = googleClientId.contains("dummy") 
                          || "mock-client-secret".equals(googleClientSecret) 
                          || (code != null && code.startsWith("mock-"));

            if (isMock) {
                providerUserId = "mock-google-id-" + userId + "-linked";
                providerEmail = "mock.linked.google@example.com";
            } else {
                try {
                    RestTemplate restTemplate = new RestTemplate();
                    HttpHeaders headers = new HttpHeaders();
                    headers.setContentType(MediaType.APPLICATION_FORM_URLENCODED);

                    MultiValueMap<String, String> map = new LinkedMultiValueMap<>();
                    map.add("code", code);
                    map.add("client_id", googleClientId);
                    map.add("client_secret", googleClientSecret);
                    map.add("redirect_uri", redirectUri);
                    map.add("grant_type", "authorization_code");

                    HttpEntity<MultiValueMap<String, String>> entityRequest = new HttpEntity<>(map, headers);
                    String tokenUrl = "https://oauth2.googleapis.com/token";
                    ResponseEntity<String> tokenResponse = restTemplate.postForEntity(tokenUrl, entityRequest, String.class);

                    if (!tokenResponse.getStatusCode().is2xxSuccessful() || tokenResponse.getBody() == null) {
                        throw new RuntimeException("Failed to exchange code with Google");
                    }

                    JsonObject tokenJson = JsonParser.parseString(tokenResponse.getBody()).getAsJsonObject();
                    String accessToken = tokenJson.get("access_token").getAsString();

                    HttpHeaders userInfoHeaders = new HttpHeaders();
                    userInfoHeaders.setBearerAuth(accessToken);
                    HttpEntity<Void> userInfoEntity = new HttpEntity<>(userInfoHeaders);

                    String userInfoUrl = "https://www.googleapis.com/oauth2/v3/userinfo";
                    ResponseEntity<String> userInfoResponse = restTemplate.exchange(userInfoUrl, HttpMethod.GET, userInfoEntity, String.class);

                    if (!userInfoResponse.getStatusCode().is2xxSuccessful() || userInfoResponse.getBody() == null) {
                        throw new RuntimeException("Failed to retrieve Google profile");
                    }

                    JsonObject userJson = JsonParser.parseString(userInfoResponse.getBody()).getAsJsonObject();
                    providerUserId = userJson.get("sub").getAsString();
                    providerEmail = userJson.get("email").getAsString();
                } catch (Exception e) {
                    throw new RuntimeException("Google link failed: " + e.getMessage(), e);
                }
            }
        } else {
            // Mock connection for Microsoft
            providerUserId = "mock-microsoft-id-" + userId;
            providerEmail = "mock.microsoft@outlook.com";
        }

        // Check if this provider account is already linked to ANOTHER user
        Optional<ThirdPartyAccount> existing = thirdPartyAccountRepository
                .findByProviderTypeAndProviderUserId(providerType, providerUserId);
        
        if (existing.isPresent()) {
            if (existing.get().getUser().getId().equals(userId)) {
                existing.get().setProviderEmail(providerEmail);
                thirdPartyAccountRepository.save(existing.get());
                return;
            } else {
                throw new RuntimeException("This third-party account is already connected to another user.");
            }
        }

        ThirdPartyAccount tpAccount = ThirdPartyAccount.builder()
                .user(user)
                .providerType(providerType)
                .providerUserId(providerUserId)
                .providerEmail(providerEmail)
                .build();
        thirdPartyAccountRepository.save(tpAccount);
    }

    @Override
    public void unlinkThirdPartyAccount(Long userId, String provider) {
        ProviderType providerType = ProviderType.valueOf(provider.toUpperCase());
        List<ThirdPartyAccount> linked = thirdPartyAccountRepository.findByUserId(userId);
        
        ThirdPartyAccount toRemove = linked.stream()
                .filter(tp -> tp.getProviderType() == providerType)
                .findFirst()
                .orElseThrow(() -> new RuntimeException("Account link not found for provider: " + provider));

        thirdPartyAccountRepository.delete(toRemove);
    }

    private UserResponse mapToUserResponse(User user) {
        if (user == null) {
            return null;
        }
        return UserResponse.builder()
                .id(user.getId())
                .fullName(user.getFullName())
                .email(user.getEmail())
                .avatarUrl(user.getAvatarUrl())
                .role(user.getRole())
                .accountStatus(user.getAccountStatus())
                .twoFactorEnabled(user.getTwoFactorEnabled())
                .storageUsedMb(user.getStorageUsedMb())
                .storageLimitMb(user.getStorageLimitMb())
                .createdAt(user.getCreatedAt())
                .updatedAt(user.getUpdatedAt())
                .build();
    }
}
