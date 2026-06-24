package com.lumiedu.integration.service;

public interface EncryptionService {
    String encrypt(String plainText);
    String decrypt(String cipherText);
}
