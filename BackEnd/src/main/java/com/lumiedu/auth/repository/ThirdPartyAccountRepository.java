package com.lumiedu.auth.repository;

import com.lumiedu.auth.entity.ThirdPartyAccount;
import com.lumiedu.auth.enums.ProviderType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ThirdPartyAccountRepository extends JpaRepository<ThirdPartyAccount, Long> {
    Optional<ThirdPartyAccount> findByProviderTypeAndProviderUserId(ProviderType providerType, String providerUserId);
    List<ThirdPartyAccount> findByUserId(Long userId);
}
