package com.lumiedu.admin.service.impl;

import com.lumiedu.admin.dto.request.AdminCreateNotificationRequest;
import com.lumiedu.admin.dto.response.AdminNotificationResponse;
import com.lumiedu.admin.mapper.AdminNotificationMapper;
import com.lumiedu.admin.service.AdminNotificationService;
import com.lumiedu.notification.dto.request.BroadcastNotificationRequest;
import com.lumiedu.notification.dto.request.NotificationRequest;
import com.lumiedu.notification.dto.response.NotificationResponse;
import com.lumiedu.notification.entity.Notification;
import com.lumiedu.notification.repository.NotificationRepository;
import com.lumiedu.notification.service.NotificationService;
import com.lumiedu.user.entity.User;
import com.lumiedu.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
public class AdminNotificationServiceImpl implements AdminNotificationService {

    private final NotificationService notificationService;
    private final NotificationRepository notificationRepository;
    private final UserRepository userRepository;

    @Override
    @Transactional(readOnly = true)
    public List<AdminNotificationResponse> getAllNotifications() {
        List<Notification> notifications = notificationRepository.findAll();

        // Lọc bỏ notifications đã xoá và sắp xếp mới nhất lên đầu
        List<Notification> activeNotifications = notifications.stream()
                .filter(n -> n.getDeleted() == null || !n.getDeleted())
                .sorted(Comparator.comparing(Notification::getId).reversed())
                .collect(Collectors.toList());

        // Lấy danh sách user để map email
        List<Long> userIds = activeNotifications.stream()
                .map(Notification::getUserId)
                .filter(java.util.Objects::nonNull)
                .distinct()
                .collect(Collectors.toList());

        Map<Long, User> userMap = userRepository.findAllById(userIds).stream()
                .collect(Collectors.toMap(User::getId, Function.identity()));

        return activeNotifications.stream()
                .map(n -> {
                    User user = userMap.get(n.getUserId());
                    return AdminNotificationMapper.toResponse(n, user);
                })
                .collect(Collectors.toList());
    }

    @Override
    public AdminNotificationResponse createNotification(AdminCreateNotificationRequest request) {
        User user = userRepository.findById(request.getUserId())
                .orElseThrow(() -> new RuntimeException("User not found with id: " + request.getUserId()));

        String typeStr = request.getType() != null ? request.getType() : request.getVariant();
        if (typeStr == null) {
            typeStr = "SYSTEM";
        }

        String msgStr = request.getMessage() != null ? request.getMessage() : request.getContent();
        if (msgStr == null) {
            msgStr = "";
        }

        NotificationRequest coreRequest = NotificationRequest.builder()
                .targetUserEmail(user.getEmail())
                .title(request.getTitle())
                .message(msgStr)
                .type(typeStr.toUpperCase())
                .actionType("system")
                .build();

        NotificationResponse coreResponse = notificationService.createNotification(coreRequest);
        
        Notification notification = notificationRepository.findById(Long.valueOf(coreResponse.getId()))
                .orElseThrow(() -> new RuntimeException("Failed to retrieve saved notification."));

        return AdminNotificationMapper.toResponse(notification, user);
    }

    @Override
    public void broadcastNotification(AdminCreateNotificationRequest request) {
        String typeStr = request.getType() != null ? request.getType() : request.getVariant();
        if (typeStr == null) {
            typeStr = "system";
        }

        String msgStr = request.getMessage() != null ? request.getMessage() : request.getContent();
        if (msgStr == null) {
            msgStr = "";
        }

        BroadcastNotificationRequest coreRequest = BroadcastNotificationRequest.builder()
                .title(request.getTitle())
                .message(msgStr)
                .type(typeStr.toLowerCase())
                .target("all")
                .build();

        notificationService.sendBroadcast(coreRequest);
    }

    @Override
    public void deleteNotification(Long id) {
        // Sử dụng phương thức có sẵn của NotificationService (sẽ set deleted = true)
        notificationService.deleteNotification(id);
    }
}
