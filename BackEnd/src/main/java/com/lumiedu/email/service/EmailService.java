package com.lumiedu.email.service;

import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class EmailService {

    private final JavaMailSender mailSender;

    @Value("${spring.mail.username}")
    private String fromEmail;

    @Async // Run in background without blocking the main thread
    public void sendEmail(String to, String subject, String content, boolean isHtml) {
        sendEmail(to, fromEmail, "LumiEdu Support", subject, content, isHtml);
    }

    @Async
    public void sendEmail(String to, String from, String fromName, String subject, String content, boolean isHtml) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            
            helper.setTo(to);
            helper.setSubject(subject);
            
            if (from != null && !from.trim().isEmpty()) {
                if (!from.equalsIgnoreCase(fromEmail)) {
                    String personalName = (fromName != null && !fromName.trim().isEmpty())
                            ? fromName + " (" + from + ")"
                            : from;
                    helper.setFrom(fromEmail, personalName);
                } else {
                    if (fromName != null && !fromName.trim().isEmpty()) {
                        helper.setFrom(fromEmail, fromName);
                    } else {
                        helper.setFrom(fromEmail);
                    }
                }
                // Set reply-to to help Admin/User reply directly
                helper.setReplyTo(from);
            } else {
                helper.setFrom(fromEmail, "LumiEdu Support");
            }

            if (isHtml && content != null) {
                String updatedContent = content.replace("https://raw.githubusercontent.com/huynhduybinh24/SWP391_AIStudyHub/main/FrontEnd/public/logo.png", "cid:logo");
                helper.setText(updatedContent, true);
                org.springframework.core.io.ClassPathResource logoResource = new org.springframework.core.io.ClassPathResource("logo.png");
                if (logoResource.exists()) {
                    helper.addInline("logo", logoResource);
                }
            } else {
                helper.setText(content, isHtml);
            }

            mailSender.send(message);
            System.out.println("Email sent successfully to " + to + " (From: " + from + ")");
        } catch (Exception e) {
            System.err.println("Failed to send email to " + to + ": " + e.getMessage());
        }
    }

    public String buildHtmlTemplate(String title, String heading, String bodyContent) {
        return "<!DOCTYPE html>" +
                "<html>" +
                "<head>" +
                "  <meta charset=\"utf-8\">" +
                "  <title>" + title + "</title>" +
                "  <style>" +
                "    body { margin: 0; padding: 0; background-color: #f5f5f7; font-family: -apple-system, BlinkMacSystemFont, \"Segoe UI\", Roboto, \"Helvetica Neue\", Arial, sans-serif; -webkit-font-smoothing: antialiased; }" +
                "    .wrapper { width: 100%; background-color: #f5f5f7; padding: 40px 0; }" +
                "    .container { max-width: 560px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08); border: 1px solid #e3e3e8; }" +
                "    .header { padding: 24px 40px; border-bottom: 1px solid #e2e8f0; text-align: center; background-color: #ffffff; }" +
                "    .logo-img { max-width: 120px; height: auto; display: block; margin: 0 auto; }" +
                "    .content { padding: 32px 40px; color: #1d1d1f; font-size: 15px; line-height: 1.6; }" +
                "    .footer { padding: 24px 40px 32px 40px; background-color: #f9f9fb; border-top: 1px solid #f5f5f7; text-align: left; font-size: 12px; color: #86868b; }" +
                "    .footer a { color: #0071e3; text-decoration: none; }" +
                "    .footer a:hover { text-decoration: underline; }" +
                "    .btn { display: inline-block; background-color: #0071e3; color: #ffffff !important; padding: 12px 24px; font-size: 14px; font-weight: 600; text-decoration: none; border-radius: 8px; margin-top: 16px; text-align: center; }" +
                "    .btn:hover { background-color: #0077ed; }" +
                "    .highlight-card { background-color: #f5f5f7; border-radius: 12px; padding: 20px; margin: 20px 0; border: 1px solid #e3e3e8; }" +
                "  </style>" +
                "</head>" +
                "<body>" +
                "  <div class=\"wrapper\">" +
                "    <div class=\"container\">" +
                "      <div class=\"header\">" +
                "        <img class=\"logo-img\" src=\"https://raw.githubusercontent.com/huynhduybinh24/SWP391_AIStudyHub/main/FrontEnd/public/logo.png\" alt=\"LumiEdu Logo\" />" +
                "      </div>" +
                "      <div class=\"content\">" +
                "        <h2 style=\"font-size: 20px; font-weight: 700; color: #1d1d1f; margin-top: 0; margin-bottom: 16px;\">" + heading + "</h2>" +
                "        " + bodyContent + "" +
                "      </div>" +
                "      <div class=\"footer\">" +
                "        <p>Đây là email tự động từ hệ thống LumiEdu AI Study Hub.</p>" +
                "        <p>Nếu bạn cần hỗ trợ thêm, vui lòng liên hệ <a href=\"mailto:lumieduteam@gmail.com\">lumieduteam@gmail.com</a>.</p>" +
                "        <p style=\"margin-top: 16px; font-size: 11px; color: #b7b7bd;\">&copy; 2026 LumiEdu Team. All rights reserved.</p>" +
                "      </div>" +
                "    </div>" +
                "  </div>" +
                "</body>" +
                "</html>";
    }
}
