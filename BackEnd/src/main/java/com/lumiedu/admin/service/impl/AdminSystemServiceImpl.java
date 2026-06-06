package com.lumiedu.admin.service.impl;

import com.lumiedu.admin.dto.request.AdminSystemStatusRequest;
import com.lumiedu.admin.dto.response.AdminHealthResponse;
import com.lumiedu.admin.dto.response.AdminSystemStatusResponse;
import com.lumiedu.admin.entity.SystemSetting;
import com.lumiedu.admin.repository.SystemSettingRepository;
import com.lumiedu.admin.service.AdminSystemService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
@Transactional
public class AdminSystemServiceImpl implements AdminSystemService {

    private final SystemSettingRepository systemSettingRepository;

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

        return AdminSystemStatusResponse.builder()
                .systemMode(request.getSystemMode())
                .systemMessage(request.getSystemMessage())
                .build();
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
