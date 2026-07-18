package com.lumiedu.ai.service;

import com.lumiedu.ai.repository.AiUsageLogRepository;
import com.lumiedu.billing.entity.SubscriptionPlan;
import com.lumiedu.billing.entity.UserSubscription;
import com.lumiedu.billing.enums.PlanType;
import com.lumiedu.billing.enums.SubscriptionStatus;
import com.lumiedu.billing.repository.SubscriptionPlanRepository;
import com.lumiedu.billing.repository.UserSubscriptionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.Optional;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class AiLimitService {

    private final UserSubscriptionRepository userSubscriptionRepository;
    private final SubscriptionPlanRepository subscriptionPlanRepository;
    private final AiUsageLogRepository aiUsageLogRepository;

    public boolean isWithinDailyLimit(Long userId, String featureType) {
        int limit = getDailyLimit(userId, featureType);
        long todayUsage = aiUsageLogRepository.countByUserIdAndFeatureTypeAndUsageDate(userId, featureType, LocalDate.now());
        return todayUsage < limit;
    }

    public int getDailyLimit(Long userId, String featureType) {
        Optional<UserSubscription> activeSubOpt = userSubscriptionRepository
                .findFirstByUserIdAndStatusOrderByEndDateDesc(userId, SubscriptionStatus.ACTIVE);

        SubscriptionPlan plan = null;
        if (activeSubOpt.isPresent()) {
            plan = activeSubOpt.get().getSubscriptionPlan();
        } else {
            // Fallback to Free plan
            plan = subscriptionPlanRepository.findByPlanType(PlanType.FREE).orElse(null);
        }

        if ("CHAT".equalsIgnoreCase(featureType)) {
            if (plan != null && plan.getAiChatLimitPerDay() != null) {
                return plan.getAiChatLimitPerDay();
            }
            return 10; // Default Free chat limit
        } else if ("QUIZ".equalsIgnoreCase(featureType)) {
            if (plan != null && plan.getQuizLimitPerDay() != null) {
                return plan.getQuizLimitPerDay();
            }
            return 3; // Default Free quiz limit
        }

        // Default for other features if any
        return 100;
    }
}
