package com.lumiedu.notification.repository;

import com.lumiedu.notification.entity.BroadcastNotification;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface BroadcastNotificationRepository extends JpaRepository<BroadcastNotification, Long> {
    List<BroadcastNotification> findAllByOrderByCreatedAtDesc();
}
