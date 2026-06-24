package com.lumiedu.integration.service.impl;

import com.lumiedu.integration.service.EncryptionService;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.Cipher;
import javax.crypto.spec.GCMParameterSpec;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.SecureRandom;
import java.util.Base64;

@Service
public class EncryptionServiceImpl implements EncryptionService {

    private final String secret;

    public EncryptionServiceImpl(@Value("${app.encryption.secret:}") String secret) {
        this.secret = secret;
    }

    private SecretKeySpec getSecretKeySpec() {
        if (secret == null || secret.trim().isEmpty()) {
            throw new IllegalStateException("Encryption secret is not configured. Please set APP_ENCRYPTION_SECRET in your environment.");
        }
        try {
            byte[] keyBytes = secret.getBytes(StandardCharsets.UTF_8);
            MessageDigest sha = MessageDigest.getInstance("SHA-256");
            byte[] hashedKey = sha.digest(keyBytes);
            return new SecretKeySpec(hashedKey, "AES");
        } catch (Exception e) {
            throw new RuntimeException("Failed to initialize encryption key spec", e);
        }
    }

    @Override
    public String encrypt(String plainText) {
        if (plainText == null) {
            return null;
        }
        try {
            SecretKeySpec keySpec = getSecretKeySpec();
            Cipher cipher = Cipher.getInstance("AES/GCM/NoPadding");
            byte[] iv = new byte[12]; // 12 bytes IV is standard for GCM
            new SecureRandom().nextBytes(iv);
            GCMParameterSpec spec = new GCMParameterSpec(128, iv);
            cipher.init(Cipher.ENCRYPT_MODE, keySpec, spec);

            byte[] encryptedBytes = cipher.doFinal(plainText.getBytes(StandardCharsets.UTF_8));

            // Format: Base64(IV) + ":" + Base64(Ciphertext)
            String base64Iv = Base64.getEncoder().encodeToString(iv);
            String base64Ciphertext = Base64.getEncoder().encodeToString(encryptedBytes);
            return base64Iv + ":" + base64Ciphertext;
        } catch (Exception e) {
            throw new RuntimeException("Encryption failed: " + e.getMessage(), e);
        }
    }

    @Override
    public String decrypt(String cipherText) {
        if (cipherText == null) {
            return null;
        }
        try {
            SecretKeySpec keySpec = getSecretKeySpec();
            String[] parts = cipherText.split(":");
            if (parts.length != 2) {
                throw new IllegalArgumentException("Invalid encrypted text format");
            }

            byte[] iv = Base64.getDecoder().decode(parts[0]);
            byte[] encryptedBytes = Base64.getDecoder().decode(parts[1]);

            Cipher cipher = Cipher.getInstance("AES/GCM/NoPadding");
            GCMParameterSpec spec = new GCMParameterSpec(128, iv);
            cipher.init(Cipher.DECRYPT_MODE, keySpec, spec);

            byte[] decryptedBytes = cipher.doFinal(encryptedBytes);
            return new String(decryptedBytes, StandardCharsets.UTF_8);
        } catch (Exception e) {
            throw new RuntimeException("Decryption failed: " + e.getMessage(), e);
        }
    }
}
