package com.lumiedu.notification.service.impl;

import com.lumiedu.notification.service.EmailService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

@Slf4j
@Service
public class EmailServiceImpl implements EmailService {
    @Override
    public void sendEmail(String toEmail, String subject, String body) {
        log.info("[Email Alert] Sent to: {} | Subject: {} | Body: {}", toEmail, subject, body);
    }
}
