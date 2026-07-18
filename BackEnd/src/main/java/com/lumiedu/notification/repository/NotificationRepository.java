package com.lumiedu.notification.repository;

import com.lumiedu.notification.entity.Notification;
import com.lumiedu.notification.enums.NotificationType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Collection;
import java.util.List;

@Repository
public interface NotificationRepository extends JpaRepository<Notification, Long> {

    List<Notification> findByUserIdAndDeletedFalseOrderByCreatedAtDesc(Long userId);

    List<Notification> findByUserIdAndIsReadFalseAndDeletedFalseOrderByCreatedAtDesc(Long userId);

    List<Notification> findByUserIdAndTypeInAndDeletedFalseOrderByCreatedAtDesc(Long userId, Collection<NotificationType> types);

    long countByUserIdAndIsReadFalseAndDeletedFalse(Long userId);

    void deleteByCreatedAtBefore(java.time.LocalDateTime dateTime);
}

