package com.lumiedu.notification.service;

import com.lumiedu.billing.entity.UserSubscription;
import com.lumiedu.billing.enums.SubscriptionStatus;
import com.lumiedu.billing.repository.UserSubscriptionRepository;
import com.lumiedu.notification.dto.request.BroadcastNotificationRequest;
import com.lumiedu.notification.dto.request.NotificationRequest;
import com.lumiedu.notification.dto.response.BroadcastNotificationResponse;
import com.lumiedu.notification.dto.response.NotificationResponse;
import com.lumiedu.notification.entity.BroadcastNotification;
import com.lumiedu.notification.entity.Notification;
import com.lumiedu.notification.enums.NotificationType;
import com.lumiedu.notification.repository.BroadcastNotificationRepository;
import com.lumiedu.notification.repository.NotificationRepository;
import com.lumiedu.user.entity.User;
import com.lumiedu.user.enums.AccountStatus;
import com.lumiedu.user.enums.UserRole;
import com.lumiedu.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Arrays;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
@SuppressWarnings("null")
public class NotificationService {

    private final NotificationRepository notificationRepository;
    private final BroadcastNotificationRepository broadcastNotificationRepository;
    private final UserRepository userRepository;
    private final UserSubscriptionRepository userSubscriptionRepository;

    @Transactional(readOnly = true)
    public List<NotificationResponse> getNotifications(Long userId, String email, String filter) {
        User user = findUser(userId, email);
        List<Notification> notifications;

        String lowerFilter = filter != null ? filter.toLowerCase() : "all";
        switch (lowerFilter) {
            case "unread":
                notifications = notificationRepository.findByUserIdAndIsReadFalseAndDeletedFalseOrderByCreatedAtDesc(user.getId());
                break;
            case "mentions":
                notifications = notificationRepository.findByUserIdAndTypeInAndDeletedFalseOrderByCreatedAtDesc(
                        user.getId(), Arrays.asList(NotificationType.MENTION));
                break;
            case "shared-files":
            case "sharedfiles":
                notifications = notificationRepository.findByUserIdAndTypeInAndDeletedFalseOrderByCreatedAtDesc(
                        user.getId(), Arrays.asList(NotificationType.SHARED_FILE, NotificationType.FOLDER, NotificationType.DOCUMENT));
                break;
            case "ai-updates":
            case "aiupdates":
                notifications = notificationRepository.findByUserIdAndTypeInAndDeletedFalseOrderByCreatedAtDesc(
                        user.getId(), Arrays.asList(NotificationType.AI, NotificationType.AI_UPDATE, NotificationType.FLASHCARD, NotificationType.CALENDAR));
                break;
            case "all":
            default:
                notifications = notificationRepository.findByUserIdAndDeletedFalseOrderByCreatedAtDesc(user.getId());
                break;
        }

        return notifications.stream()
                .map(n -> NotificationResponse.fromEntity(n, user.getEmail()))
                .collect(Collectors.toList());
    }

    public void markAsRead(Long id) {
        Notification notification = notificationRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Notification not found with id: " + id));
        notification.setIsRead(true);
        notificationRepository.save(notification);
    }

    public void markAllAsRead(Long userId, String email) {
        User user = findUser(userId, email);
        List<Notification> unread = notificationRepository.findByUserIdAndIsReadFalseAndDeletedFalseOrderByCreatedAtDesc(user.getId());
        for (Notification n : unread) {
            n.setIsRead(true);
        }
        notificationRepository.saveAll(unread);
    }

    public void deleteNotification(Long id) {
        Notification notification = notificationRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Notification not found with id: " + id));
        notification.setDeleted(true);
        notificationRepository.save(notification);
    }

    public NotificationResponse createNotification(NotificationRequest request) {
        User user = userRepository.findByEmail(request.getTargetUserEmail())
                .orElseThrow(() -> new IllegalArgumentException("User not found with email: " + request.getTargetUserEmail()));

        NotificationType type = NotificationType.SYSTEM;
        if (request.getType() != null) {
            try {
                type = NotificationType.valueOf(request.getType().toUpperCase());
            } catch (IllegalArgumentException e) {
                // Keep default type = SYSTEM if mismatch
            }
        }

        Notification notification = Notification.builder()
                .userId(user.getId())
                .type(type)
                .title(request.getTitle())
                .message(request.getMessage())
                .documentId(request.getDocumentId())
                .documentName(request.getDocumentName())
                .reason(request.getReason())
                .actionType(request.getActionType())
                .adminNote(request.getAdminNote())
                .actionText(request.getActionText())
                .actionUrl(request.getActionUrl())
                .avatar(request.getAvatar())
                .quote(request.getQuote())
                .isRead(false)
                .deleted(false)
                .build();

        Notification saved = notificationRepository.save(notification);
        return NotificationResponse.fromEntity(saved, user.getEmail());
    }

    public BroadcastNotificationResponse sendBroadcast(BroadcastNotificationRequest request) {
        List<User> targets = getTargetUsers(request.getTarget());

        BroadcastNotification broadcast = BroadcastNotification.builder()
                .title(request.getTitle())
                .message(request.getMessage())
                .type(request.getType())
                .target(request.getTarget())
                .recipientsCount(targets.size())
                .build();

        BroadcastNotification savedBroadcast = broadcastNotificationRepository.save(broadcast);

        // Determine notification type to map
        NotificationType mappedType = NotificationType.SYSTEM;
        if ("warning".equalsIgnoreCase(request.getType())) {
            mappedType = NotificationType.SECURITY;
        } else if ("promotion".equalsIgnoreCase(request.getType())) {
            mappedType = NotificationType.AI_UPDATE;
        }

        // Deliver notification records to database
        for (User user : targets) {
            Notification notification = Notification.builder()
                    .userId(user.getId())
                    .type(mappedType)
                    .title(request.getTitle())
                    .message(request.getMessage())
                    .actionType("system")
                    .isRead(false)
                    .deleted(false)
                    .build();
            notificationRepository.save(notification);
        }

        return BroadcastNotificationResponse.fromEntity(savedBroadcast);
    }

    @Transactional(readOnly = true)
    public List<BroadcastNotificationResponse> getBroadcastHistory() {
        return broadcastNotificationRepository.findAllByOrderByCreatedAtDesc().stream()
                .map(BroadcastNotificationResponse::fromEntity)
                .collect(Collectors.toList());
    }

    public void deleteBroadcastHistory(Long id) {
        if (!broadcastNotificationRepository.existsById(id)) {
            throw new IllegalArgumentException("Broadcast notification not found with id: " + id);
        }
        broadcastNotificationRepository.deleteById(id);
    }

    private User findUser(Long userId, String email) {
        if (userId != null) {
            return userRepository.findById(userId)
                    .orElseThrow(() -> new IllegalArgumentException("User not found with id: " + userId));
        } else if (email != null && !email.trim().isEmpty()) {
            return userRepository.findByEmail(email)
                    .orElseThrow(() -> new IllegalArgumentException("User not found with email: " + email));
        } else {
            throw new IllegalArgumentException("Either userId or email must be provided");
        }
    }

    private List<User> getTargetUsers(String target) {
        List<User> activeUsers = userRepository.findByAccountStatus(AccountStatus.ACTIVE);
        if ("all".equalsIgnoreCase(target) || target == null || target.trim().isEmpty()) {
            return activeUsers;
        }

        List<User> result = new java.util.ArrayList<>();
        for (User user : activeUsers) {
            String plan = "free";
            if (user.getRole() == UserRole.ADMIN) {
                plan = "enterprise";
            } else {
                Optional<UserSubscription> activeSub = userSubscriptionRepository
                        .findFirstByUserIdAndStatusOrderByEndDateDesc(user.getId(), SubscriptionStatus.ACTIVE);
                if (activeSub.isPresent()) {
                    plan = activeSub.get().getSubscriptionPlan().getPlanType().name().toLowerCase();
                }
            }

            if ("pro".equalsIgnoreCase(target)) {
                if ("pro".equalsIgnoreCase(plan) || "enterprise".equalsIgnoreCase(plan)) {
                    result.add(user);
                }
            } else if ("free".equalsIgnoreCase(target)) {
                if ("free".equalsIgnoreCase(plan)) {
                    result.add(user);
                }
            }
        }
        return result;
    }
}
