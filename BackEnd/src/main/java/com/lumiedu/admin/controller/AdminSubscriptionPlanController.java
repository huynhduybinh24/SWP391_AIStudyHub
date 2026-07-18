package com.lumiedu.admin.controller;

import com.lumiedu.admin.dto.request.AdminUpdatePlanRequest;
import com.lumiedu.billing.dto.SubscriptionPlanResponse;
import com.lumiedu.billing.entity.SubscriptionPlan;
import com.lumiedu.billing.repository.SubscriptionPlanRepository;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/admin/plans")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AdminSubscriptionPlanController {

    private final SubscriptionPlanRepository subscriptionPlanRepository;

    @GetMapping
    public ResponseEntity<List<SubscriptionPlanResponse>> getAllPlans() {
        List<SubscriptionPlanResponse> plans = subscriptionPlanRepository.findAll().stream()
                .map(this::toPlanResponse)
                .collect(Collectors.toList());
        return ResponseEntity.ok(plans);
    }

    @PutMapping("/{id}")
    public ResponseEntity<SubscriptionPlanResponse> updatePlan(
            @PathVariable Long id,
            @RequestBody @Valid AdminUpdatePlanRequest request) {
        SubscriptionPlan plan = subscriptionPlanRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Subscription plan not found with id: " + id));

        plan.setPrice(request.getPrice());
        plan.setStorageLimitMb(request.getStorageLimitMb());

        SubscriptionPlan updated = subscriptionPlanRepository.save(plan);
        return ResponseEntity.ok(toPlanResponse(updated));
    }

    private SubscriptionPlanResponse toPlanResponse(SubscriptionPlan plan) {
        return SubscriptionPlanResponse.builder()
                .id(plan.getId())
                .planName(plan.getPlanName())
                .planType(plan.getPlanType())
                .price(plan.getPrice())
                .durationDays(plan.getDurationDays())
                .storageLimitMb(plan.getStorageLimitMb())
                .maxDocuments(plan.getMaxDocuments())
                .aiChatLimitPerDay(plan.getAiChatLimitPerDay())
                .quizLimitPerDay(plan.getQuizLimitPerDay())
                .description(plan.getDescription())
                .active(plan.getActive())
                .build();
    }
}
