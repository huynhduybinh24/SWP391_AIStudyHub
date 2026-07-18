package com.lumiedu.notification.service;

public interface EmailService {
    void sendEmail(String toEmail, String subject, String body);
}
