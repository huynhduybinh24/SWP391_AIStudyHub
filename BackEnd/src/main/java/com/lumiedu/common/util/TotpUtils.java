package com.lumiedu.common.util;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.security.GeneralSecurityException;
import java.security.SecureRandom;
import java.util.Arrays;

public class TotpUtils {

    private static final String BASE32_CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
    private static final int[] BASE32_LOOKUP = new int[256];

    static {
        Arrays.fill(BASE32_LOOKUP, -1);
        for (int i = 0; i < BASE32_CHARS.length(); i++) {
            BASE32_LOOKUP[BASE32_CHARS.charAt(i)] = i;
        }
    }

    /**
     * Generate a cryptographically secure 20-byte random key encoded in Base32.
     */
    public static String generateSecretKey() {
        SecureRandom random = new SecureRandom();
        byte[] bytes = new byte[20];
        random.nextBytes(bytes);
        return encodeBase32(bytes);
    }

    /**
     * Verifies the 6-digit TOTP code for the given secret key.
     * Uses a tolerance window of 1 step (30 seconds) before/after to account for clock drift.
     */
    public static boolean verifyCode(String secret, String codeStr) {
        if (secret == null || secret.trim().isEmpty() || codeStr == null || codeStr.trim().isEmpty()) {
            return false;
        }
        try {
            int code = Integer.parseInt(codeStr.trim());
            long timeIndex = System.currentTimeMillis() / 1000 / 30; // 30-second window
            for (int i = -1; i <= 1; i++) {
                if (getTotpCode(secret, timeIndex + i) == code) {
                    return true;
                }
            }
        } catch (Exception e) {
            // invalid code format or verification error
        }
        return false;
    }

    /**
     * Generate standard TOTP 6-digit code for a specific time step index.
     */
    private static int getTotpCode(String secret, long timeIndex) throws GeneralSecurityException {
        byte[] decodedKey = decodeBase32(secret);
        byte[] data = new byte[8];
        long value = timeIndex;
        for (int i = 8; i-- > 0; value >>>= 8) {
            data[i] = (byte) value;
        }

        SecretKeySpec signKey = new SecretKeySpec(decodedKey, "HmacSHA1");
        Mac mac = Mac.getInstance("HmacSHA1");
        mac.init(signKey);
        byte[] hash = mac.doFinal(data);

        int offset = hash[hash.length - 1] & 0xF;
        long truncatedHash = 0;
        for (int i = 0; i < 4; ++i) {
            truncatedHash <<= 8;
            truncatedHash |= (hash[offset + i] & 0xFF);
        }
        truncatedHash &= 0x7FFFFFFF;
        truncatedHash %= 1000000;
        return (int) truncatedHash;
    }

    /**
     * Generates a standard Authenticator provisioning URI.
     */
    public static String getOtpAuthUri(String email, String secret) {
        return "otpauth://totp/AIStudyHub:" + email + "?secret=" + secret + "&issuer=AIStudyHub";
    }

    // Base32 encoding implementation
    private static String encodeBase32(byte[] bytes) {
        StringBuilder sb = new StringBuilder((bytes.length + 7) * 8 / 5);
        int i = 0, index = 0, digit = 0;
        int currByte, nextByte;
        while (i < bytes.length) {
            currByte = (bytes[i] >= 0) ? bytes[i] : (bytes[i] + 256);
            if (index > 3) {
                if (i + 1 < bytes.length) {
                    nextByte = (bytes[i + 1] >= 0) ? bytes[i + 1] : (bytes[i + 1] + 256);
                } else {
                    nextByte = 0;
                }
                digit = currByte & (0xFF >> index);
                index = (index + 5) % 8;
                digit <<= index;
                digit |= nextByte >> (8 - index);
                i++;
            } else {
                digit = (currByte >> (8 - (index + 5))) & 0x1F;
                index = (index + 5) % 8;
                if (index == 0) {
                    i++;
                }
            }
            sb.append(BASE32_CHARS.charAt(digit));
        }
        return sb.toString();
    }

    // Base32 decoding implementation
    private static byte[] decodeBase32(String base32) {
        String cleaned = base32.toUpperCase().replaceAll("[^" + BASE32_CHARS + "]", "");
        byte[] bytes = new byte[cleaned.length() * 5 / 8];
        int i = 0, index = 0, lookup;
        for (int c = 0; c < cleaned.length(); c++) {
            lookup = BASE32_LOOKUP[cleaned.charAt(c)];
            if (lookup == -1) continue;
            if (index <= 3) {
                index = (index + 5) % 8;
                if (index == 0) {
                    bytes[i] |= lookup;
                    i++;
                } else {
                    bytes[i] |= lookup << (8 - index);
                }
            } else {
                index = (index + 5) % 8;
                bytes[i] |= lookup >>> index;
                i++;
                if (i < bytes.length) {
                    bytes[i] |= lookup << (8 - index);
                }
            }
        }
        return bytes;
    }
}
