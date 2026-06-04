package com.lumiedu.billing.repository;

import com.lumiedu.billing.entity.UserSubscription;
import com.lumiedu.billing.enums.SubscriptionStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserSubscriptionRepository extends JpaRepository<UserSubscription, Long> {
    List<UserSubscription> findByUserId(Long userId);
    Optional<UserSubscription> findFirstByUserIdAndStatusOrderByEndDateDesc(Long userId, SubscriptionStatus status);
}
