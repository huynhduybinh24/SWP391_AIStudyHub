package com.lumiedu.billing.repository;

import com.lumiedu.billing.entity.SubscriptionPlan;
import com.lumiedu.billing.enums.PlanType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface SubscriptionPlanRepository extends JpaRepository<SubscriptionPlan, Long> {
    List<SubscriptionPlan> findByActiveTrue();
    Optional<SubscriptionPlan> findByPlanType(PlanType planType);
}
