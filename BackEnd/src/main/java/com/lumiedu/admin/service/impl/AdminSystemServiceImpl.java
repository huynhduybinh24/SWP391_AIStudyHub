package com.lumiedu.admin.service.impl;

import com.lumiedu.admin.dto.request.AdminSystemStatusRequest;
import com.lumiedu.admin.dto.response.AdminHealthResponse;
import com.lumiedu.admin.dto.response.AdminSystemStatusResponse;
import com.lumiedu.admin.entity.SystemSetting;
import com.lumiedu.admin.repository.SystemSettingRepository;
import com.lumiedu.admin.service.AdminSystemService;
import com.lumiedu.user.repository.UserRepository;
import com.lumiedu.email.service.EmailService;
import com.lumiedu.user.entity.User;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional
public class AdminSystemServiceImpl implements AdminSystemService {

    private final SystemSettingRepository systemSettingRepository;
    private final UserRepository userRepository;
    private final EmailService emailService;

    private static final String KEY_MODE = "SYSTEM_MODE";
    private static final String KEY_MESSAGE = "SYSTEM_MESSAGE";

    private void initDefaultsIfNeeded() {
        try {
            if (!systemSettingRepository.existsById(KEY_MODE)) {
                systemSettingRepository.save(SystemSetting.builder()
                        .settingKey(KEY_MODE)
                        .settingValue("NORMAL")
                        .build());
            }
            if (!systemSettingRepository.existsById(KEY_MESSAGE)) {
                systemSettingRepository.save(SystemSetting.builder()
                        .settingKey(KEY_MESSAGE)
                        .settingValue("System is running normally.")
                        .build());
            }
        } catch (Exception e) {
            // Log or ignore if db is not fully initialised
        }
    }

    @Override
    @Transactional(readOnly = true)
    public AdminSystemStatusResponse getSystemStatus() {
        initDefaultsIfNeeded();
        String mode = systemSettingRepository.findById(KEY_MODE)
                .map(SystemSetting::getSettingValue)
                .orElse("NORMAL");
        String message = systemSettingRepository.findById(KEY_MESSAGE)
                .map(SystemSetting::getSettingValue)
                .orElse("System is running normally.");
        
        return AdminSystemStatusResponse.builder()
                .systemMode(mode)
                .systemMessage(message)
                .build();
    }

    @Override
    public AdminSystemStatusResponse updateSystemStatus(AdminSystemStatusRequest request) {
        String oldMode = systemSettingRepository.findById(KEY_MODE)
                .map(SystemSetting::getSettingValue)
                .orElse("NORMAL");

        SystemSetting modeSetting = SystemSetting.builder()
                .settingKey(KEY_MODE)
                .settingValue(request.getSystemMode())
                .build();
        SystemSetting messageSetting = SystemSetting.builder()
                .settingKey(KEY_MESSAGE)
                .settingValue(request.getSystemMessage())
                .build();

        systemSettingRepository.save(modeSetting);
        systemSettingRepository.save(messageSetting);

        // Gửi email thông báo cho toàn bộ người dùng nếu trạng thái thay đổi
        if (!oldMode.equalsIgnoreCase(request.getSystemMode())) {
            sendSystemStatusNotificationEmails(request.getSystemMode(), request.getSystemMessage());
        }

        return AdminSystemStatusResponse.builder()
                .systemMode(request.getSystemMode())
                .systemMessage(request.getSystemMessage())
                .build();
    }

    private void sendSystemStatusNotificationEmails(String newMode, String message) {
        try {
            List<User> allUsers = userRepository.findAll();
            if (allUsers.isEmpty()) {
                return;
            }

            String subject = "LumiEdu - Thông báo trạng thái hệ thống / System Status Notification";
            String title = "Thông báo hệ thống / System Status Notice";
            String heading;
            String statusLabel;
            String statusColor;

            if (newMode.equalsIgnoreCase("MAINTENANCE")) {
                heading = "Hệ thống đang bảo trì định kỳ";
                statusLabel = "BẢO TRÌ ĐỊNH KỲ (MAINTENANCE)";
                statusColor = "#fbbc05"; // Màu vàng cam
            } else if (newMode.equalsIgnoreCase("INCIDENT")) {
                heading = "Hệ thống gặp sự cố kỹ thuật";
                statusLabel = "SỰ CỐ KỸ THUẬT (INCIDENT)";
                statusColor = "#ea4335"; // Màu đỏ
            } else {
                heading = "Hệ thống đã hoạt động bình thường";
                statusLabel = "HOẠT ĐỘNG BÌNH THƯỜNG (NORMAL)";
                statusColor = "#34a853"; // Màu xanh lá
            }

            String bodyContent = "<p>Xin chào bạn,</p>"
                    + "<p>Chúng tôi xin thông báo về trạng thái hoạt động hiện tại của hệ thống LumiEdu:</p>"
                    + "<div class=\"highlight-card\">"
                    + "  <strong>Trạng thái:</strong> <span style=\"color: " + statusColor + "; font-weight: bold;\">" + statusLabel + "</span><br/>"
                    + "  <strong>Thông báo:</strong> " + message
                    + "</div>"
                    + "<p>Cảm ơn sự cảm thông và đồng hành của bạn cùng LumiEdu!</p>";

            String htmlContent = emailService.buildHtmlTemplate(title, heading, bodyContent);

            for (User user : allUsers) {
                if (user.getEmail() != null && !user.getEmail().trim().isEmpty()) {
                    emailService.sendEmail(user.getEmail(), subject, htmlContent, true);
                }
            }
        } catch (Exception e) {
            System.err.println("Failed to send system status notification emails: " + e.getMessage());
        }
    }

    @Override
    @Transactional(readOnly = true)
    public AdminHealthResponse getSystemHealth() {
        String dbStatus;
        try {
            systemSettingRepository.count();
            dbStatus = "UP";
        } catch (Exception e) {
            dbStatus = "DOWN";
        }

        String mode = systemSettingRepository.findById(KEY_MODE)
                .map(SystemSetting::getSettingValue)
                .orElse("NORMAL");

        return AdminHealthResponse.builder()
                .databaseStatus(dbStatus)
                .systemMode(mode)
                .currentTime(LocalDateTime.now())
                .build();
    }
}
