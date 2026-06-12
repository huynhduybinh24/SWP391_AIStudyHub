package com.lumiedu.admin.service.impl;

import com.lumiedu.admin.dto.request.*;
import com.lumiedu.admin.dto.response.AdminUserResponse;
import com.lumiedu.admin.mapper.AdminUserMapper;
import com.lumiedu.admin.service.AdminUserService;
import com.lumiedu.billing.entity.SubscriptionPlan;
import com.lumiedu.billing.entity.UserSubscription;
import com.lumiedu.billing.enums.PlanType;
import com.lumiedu.billing.enums.SubscriptionStatus;
import com.lumiedu.billing.repository.SubscriptionPlanRepository;
import com.lumiedu.billing.repository.UserSubscriptionRepository;
import com.lumiedu.email.service.EmailService;
import com.lumiedu.user.entity.User;
import com.lumiedu.user.enums.AccountStatus;
import com.lumiedu.user.enums.UserRole;
import com.lumiedu.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Collections;
import java.util.Comparator;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
public class AdminUserServiceImpl implements AdminUserService {

    private final UserRepository userRepository;
    private final UserSubscriptionRepository userSubscriptionRepository;
    private final SubscriptionPlanRepository subscriptionPlanRepository;
    private final EmailService emailService;

    @Value("${app.admin.email}")
    private String adminEmail;

    @Override
    @Transactional(readOnly = true)
    public List<AdminUserResponse> getUsers(String keyword, UserRole role, AccountStatus status, int page, int size) {
        List<User> users = userRepository.findAll();

        // Lọc theo keyword
        if (keyword != null && !keyword.trim().isEmpty()) {
            String lowerKeyword = keyword.toLowerCase();
            users = users.stream()
                    .filter(u -> (u.getFullName() != null && u.getFullName().toLowerCase().contains(lowerKeyword))
                            || (u.getEmail() != null && u.getEmail().toLowerCase().contains(lowerKeyword)))
                    .collect(Collectors.toList());
        }

        // Lọc theo role
        if (role != null) {
            users = users.stream()
                    .filter(u -> u.getRole() == role)
                    .collect(Collectors.toList());
        }

        // Lọc theo status
        if (status != null) {
            users = users.stream()
                    .filter(u -> u.getAccountStatus() == status)
                    .collect(Collectors.toList());
        }

        // Sắp xếp theo ID giảm dần
        users.sort(Comparator.comparing(User::getId).reversed());

        // Phân trang thủ công
        int total = users.size();
        int start = page * size;
        if (start >= total) {
            users = Collections.emptyList();
        } else {
            int end = Math.min(start + size, total);
            users = users.subList(start, end);
        }

        return users.stream()
                .map(this::mapUserToResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public AdminUserResponse getUserById(Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found with id: " + id));
        return mapUserToResponse(user);
    }

    @Override
    public AdminUserResponse updateUser(Long id, AdminUpdateUserRequest request) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found with id: " + id));

        user.setFullName(request.getFullName());
        user.setEmail(request.getEmail());
        if (request.getAvatarUrl() != null) {
            user.setAvatarUrl(request.getAvatarUrl());
        }

        User saved = userRepository.save(user);
        return mapUserToResponse(saved);
    }

    private void checkNotSelf(User targetUser, String action) {
        org.springframework.security.core.Authentication auth = org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.getName() != null) {
            if (auth.getName().equalsIgnoreCase(targetUser.getEmail())) {
                throw new IllegalStateException("You cannot " + action + " your own account.");
            }
        }
    }

    @Override
    public AdminUserResponse updateUserRole(Long id, AdminUpdateUserRoleRequest request) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found with id: " + id));

        checkNotSelf(user, "change the role of");

        user.setRole(request.getRole());
        User saved = userRepository.save(user);
        return mapUserToResponse(saved);
    }

    @Override
    public AdminUserResponse updateUserStatus(Long id, AdminUpdateUserStatusRequest request) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found with id: " + id));

        checkNotSelf(user, "change the status of");

        AccountStatus oldStatus = user.getAccountStatus();
        user.setAccountStatus(request.getStatus());
        User saved = userRepository.save(user);

        if (oldStatus != request.getStatus()) {
            String subject = "[LumiEdu] Thông báo thay đổi trạng thái tài khoản / Account Status Update";
            String emailHtml;
            String userEmail = user.getEmail();
            String fullName = user.getFullName() != null ? user.getFullName() : "User";
            
            if (request.getStatus() == AccountStatus.LOCKED) {
                String reasonStr = (request.getReason() != null && !request.getReason().trim().isEmpty())
                        ? request.getReason()
                        : "Không có lý do chi tiết được cung cấp từ quản trị viên.";
                String bodyContent = String.format(
                        "<p>Xin chào <strong>%s</strong>,</p>" +
                        "<p>Chúng tôi xin thông báo tài khoản của bạn trên hệ thống <strong>LumiEdu AI Study Hub</strong> đã bị tạm khóa bởi Quản trị viên.</p>" +
                        "<div class=\"highlight-card\"><strong>Lý do khóa:</strong> %s</div>" +
                        "<p style=\"font-size: 13px; color: #4a5568;\">English Translation:<br>" +
                        "Your account has been suspended by the administrator.<br>" +
                        "<strong>Reason:</strong> %s</p>" +
                        "<p style=\"font-size: 13px; margin-top: 20px;\">Nếu bạn tin rằng đây là một sự nhầm lẫn, vui lòng liên hệ với bộ phận hỗ trợ của chúng tôi tại <a href=\"mailto:lumieduteam@gmail.com\">lumieduteam@gmail.com</a>.</p>",
                        fullName, reasonStr, reasonStr
                );
                emailHtml = emailService.buildHtmlTemplate("Tài khoản bị khóa / Account Suspended", "Tài khoản của bạn đã bị khóa / Account Suspended", bodyContent);
            } else if (request.getStatus() == AccountStatus.ACTIVE) {
                String bodyContent = String.format(
                        "<p>Xin chào <strong>%s</strong>,</p>" +
                        "<p>Chúng tôi vui mừng thông báo tài khoản của bạn trên hệ thống <strong>LumiEdu AI Study Hub</strong> đã được mở khóa/kích hoạt lại.</p>" +
                        "<p>Giờ đây bạn có thể đăng nhập vào hệ thống bình thường bằng tài khoản này.</p>" +
                        "<div class=\"highlight-card\" style=\"font-size: 13px; color: #4a5568;\">" +
                        "English Translation:<br>Your account has been successfully re-activated. You can now log in and use our services normally.</div>",
                        fullName
                );
                emailHtml = emailService.buildHtmlTemplate("Tài khoản hoạt động / Account Active", "Tài khoản của bạn đã được kích hoạt lại / Account Re-activated", bodyContent);
            } else {
                String bodyContent = String.format(
                        "<p>Trạng thái tài khoản của bạn trên hệ thống LumiEdu đã được cập nhật thành: <strong>%s</strong></p>",
                        request.getStatus()
                );
                emailHtml = emailService.buildHtmlTemplate("Cập nhật trạng thái / Status Update", "Thông báo từ LumiEdu AI Study Hub", bodyContent);
            }
            emailService.sendEmail(userEmail, adminEmail, "LumiEdu Support", subject, emailHtml, true);
        }

        return mapUserToResponse(saved);
    }

    @Override
    public AdminUserResponse updateUserPlan(Long id, AdminUpdateUserPlanRequest request) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found with id: " + id));

        // 1. Huỷ gói đăng ký cũ nếu có
        Optional<UserSubscription> activeSub = userSubscriptionRepository
                .findFirstByUserIdAndStatusOrderByEndDateDesc(id, SubscriptionStatus.ACTIVE);
        
        activeSub.ifPresent(sub -> {
            sub.setStatus(SubscriptionStatus.CANCELLED);
            userSubscriptionRepository.save(sub);
        });

        // 2. Tìm gói cước mới
        SubscriptionPlan plan = subscriptionPlanRepository.findByPlanType(request.getPlanType())
                .orElseThrow(() -> new RuntimeException("Subscription plan not found: " + request.getPlanType()));

        // 3. Tạo gói đăng ký mới cho user
        UserSubscription newSub = UserSubscription.builder()
                .user(user)
                .subscriptionPlan(plan)
                .status(SubscriptionStatus.ACTIVE)
                .startDate(LocalDateTime.now())
                .endDate(LocalDateTime.now().plusDays(plan.getDurationDays() != null ? plan.getDurationDays() : 30))
                .autoRenew(false)
                .build();
        userSubscriptionRepository.save(newSub);

        // 4. Cập nhật giới hạn lưu trữ của User
        if (plan.getStorageLimitMb() != null) {
            user.setStorageLimitMb(plan.getStorageLimitMb());
        }
        User saved = userRepository.save(user);

        // Gửi email thông báo đổi gói cước
        String subject = "[LumiEdu] Thông báo thay đổi gói dịch vụ / Subscription Plan Updated";
        String fullName = user.getFullName() != null ? user.getFullName() : "User";
        String planName = request.getPlanType().name();
        String limitGb = String.format("%.1f GB", (double)(plan.getStorageLimitMb() != null ? plan.getStorageLimitMb() : 10240) / 1024);
        
        String bodyContent = String.format(
                "<p>Xin chào <strong>%s</strong>,</p>" +
                "<p>Gói dịch vụ của bạn trên hệ thống <strong>LumiEdu AI Study Hub</strong> đã được quản trị viên cập nhật.</p>" +
                "<table style=\"width: 100%%; border-collapse: collapse; margin: 15px 0;\">" +
                "<tr style=\"background-color: #f7fafc;\">" +
                "<td style=\"padding: 10px; border: 1px solid #edf2f7; font-weight: bold;\">Gói cước mới:</td>" +
                "<td style=\"padding: 10px; border: 1px solid #edf2f7; color: #0071e3; font-weight: bold;\">%s</td>" +
                "</tr>" +
                "<tr>" +
                "<td style=\"padding: 10px; border: 1px solid #edf2f7; font-weight: bold;\">Giới hạn lưu trữ:</td>" +
                "<td style=\"padding: 10px; border: 1px solid #edf2f7;\">%s</td>" +
                "</tr>" +
                "</table>" +
                "<div class=\"highlight-card\" style=\"font-size: 13px; color: #4a5568;\">" +
                "English Translation:<br>Your subscription plan has been updated to <strong>%s</strong> with a storage limit of <strong>%s</strong>.</div>",
                fullName, planName, limitGb, planName, limitGb
        );
        String emailHtml = emailService.buildHtmlTemplate("Thay đổi gói dịch vụ / Plan Updated", "Thay đổi gói dịch vụ thành công / Plan Updated", bodyContent);
                
        emailService.sendEmail(user.getEmail(), adminEmail, "LumiEdu Support", subject, emailHtml, true);

        return mapUserToResponse(saved);
    }

    @Override
    public void deleteUser(Long id, String reason) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found with id: " + id));

        checkNotSelf(user, "delete");

        // Gửi email thông báo xóa tài khoản trước khi cập nhật status
        String subject = "[LumiEdu] Thông báo xóa tài khoản / Account Deletion Notice";
        String fullName = user.getFullName() != null ? user.getFullName() : "User";
        String reasonStr = (reason != null && !reason.trim().isEmpty())
                ? reason
                : "Không có lý do chi tiết được cung cấp từ quản trị viên.";
                
        String bodyContent = String.format(
                "<p>Xin chào <strong>%s</strong>,</p>" +
                "<p>Chúng tôi vô cùng tiếc khi phải thông báo rằng tài khoản của bạn trên hệ thống <strong>LumiEdu AI Study Hub</strong> đã bị xóa vĩnh viễn bởi Quản trị viên.</p>" +
                "<div class=\"highlight-card\"><strong>Lý do xóa:</strong> %s</div>" +
                "<p style=\"font-size: 13px; color: #4a5568;\">English Translation:<br>" +
                "Your account has been deleted by the administrator.<br>" +
                "<strong>Reason:</strong> %s</p>" +
                "<p>Cảm ơn bạn đã đồng hành cùng LumiEdu trong thời gian qua.</p>",
                fullName, reasonStr, reasonStr
        );
        String emailHtml = emailService.buildHtmlTemplate("Tài khoản bị xóa / Account Deleted", "Tài khoản của bạn đã bị xóa / Account Deleted", bodyContent);
                
        emailService.sendEmail(user.getEmail(), adminEmail, "LumiEdu Support", subject, emailHtml, true);

        user.setAccountStatus(AccountStatus.DELETED);
        userRepository.save(user);
    }

    private AdminUserResponse mapUserToResponse(User user) {
        PlanType planType = PlanType.FREE;
        Optional<UserSubscription> activeSub = userSubscriptionRepository
                .findFirstByUserIdAndStatusOrderByEndDateDesc(user.getId(), SubscriptionStatus.ACTIVE);
        if (activeSub.isPresent() && activeSub.get().getSubscriptionPlan() != null) {
            planType = activeSub.get().getSubscriptionPlan().getPlanType();
        }
        return AdminUserMapper.toResponse(user, planType);
    }
}
