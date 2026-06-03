package com.lumiedu.auth.repository;

import com.lumiedu.auth.entity.PasswordResetToken;
import com.lumiedu.auth.enums.TokenStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface PasswordResetTokenRepository extends JpaRepository<PasswordResetToken, Long> {
    Optional<PasswordResetToken> findByToken(String token);
    List<PasswordResetToken> findByUserId(Long userId);
    Optional<PasswordResetToken> findFirstByUserIdAndStatusOrderByExpiredAtDesc(Long userId, TokenStatus status);
}
