package com.lumiedu.support.repository;

import com.lumiedu.support.entity.SupportTicket;
import com.lumiedu.support.enums.TicketStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface SupportTicketRepository extends JpaRepository<SupportTicket, Long> {
    List<SupportTicket> findByUserIdOrderByCreatedAtDesc(Long userId);
    List<SupportTicket> findByStatusOrderByCreatedAtDesc(TicketStatus status);
    List<SupportTicket> findAllByOrderByCreatedAtDesc();
}
