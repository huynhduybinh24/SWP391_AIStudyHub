package com.lumiedu.billing.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.util.Map;

@Component
public class MomoConfig {

    @Value("${momo.partner-code}")
    private String partnerCode;

    @Value("${momo.access-key}")
    private String accessKey;

    @Value("${momo.secret-key}")
    private String secretKey;

    @Value("${momo.pay-url}")
    private String payUrl;

    @Value("${momo.redirect-url}")
    private String redirectUrl;

    @Value("${momo.ipn-url}")
    private String ipnUrl;

    public String getPartnerCode() {
        return partnerCode != null ? partnerCode.trim() : null;
    }

    public String getAccessKey() {
        return accessKey != null ? accessKey.trim() : null;
    }

    public String getSecretKey() {
        return secretKey != null ? secretKey.trim() : null;
    }

    public String getPayUrl() {
        return payUrl != null ? payUrl.trim() : null;
    }

    public String getRedirectUrl() {
        return redirectUrl != null ? redirectUrl.trim() : null;
    }

    public String getIpnUrl() {
        return ipnUrl != null ? ipnUrl.trim() : null;
    }

    public static String hmacSha256(String key, String data) {
        try {
            Mac sha256HMAC = Mac.getInstance("HmacSHA256");
            SecretKeySpec secretKeySpec = new SecretKeySpec(key.getBytes(StandardCharsets.UTF_8), "HmacSHA256");
            sha256HMAC.init(secretKeySpec);
            byte[] hash = sha256HMAC.doFinal(data.getBytes(StandardCharsets.UTF_8));
            
            StringBuilder hexString = new StringBuilder();
            for (byte b : hash) {
                String hex = Integer.toHexString(0xff & b);
                if (hex.length() == 1) {
                    hexString.append('0');
                }
                hexString.append(hex);
            }
            return hexString.toString();
        } catch (Exception e) {
            throw new RuntimeException("Failed to calculate HMAC SHA256", e);
        }
    }

    public boolean verifyCallback(Map<String, String> queryParams) {
        String signature = queryParams.get("signature");
        if (signature == null || signature.isEmpty()) {
            return false;
        }

        String extraData = queryParams.getOrDefault("extraData", "");
        String amount = queryParams.get("amount");
        String message = queryParams.get("message");
        String orderId = queryParams.get("orderId");
        String orderInfo = queryParams.get("orderInfo");
        String partnerCodeVal = queryParams.get("partnerCode");
        String requestId = queryParams.get("requestId");
        String responseTime = queryParams.get("responseTime");
        String resultCode = queryParams.get("resultCode");
        String transId = queryParams.get("transId");

        String rawSignature = "accessKey=" + getAccessKey()
                + "&amount=" + amount
                + "&extraData=" + extraData
                + "&message=" + message
                + "&orderId=" + orderId
                + "&orderInfo=" + orderInfo
                + "&partnerCode=" + partnerCodeVal
                + "&requestId=" + requestId
                + "&responseTime=" + responseTime
                + "&resultCode=" + resultCode
                + "&transId=" + transId;

        String computedSignature = hmacSha256(getSecretKey(), rawSignature);
        return computedSignature.equalsIgnoreCase(signature);
    }
}
