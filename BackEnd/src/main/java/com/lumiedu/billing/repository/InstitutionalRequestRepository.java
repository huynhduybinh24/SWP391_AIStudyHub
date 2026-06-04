package com.lumiedu.billing.repository;

import com.lumiedu.billing.entity.InstitutionalRequest;
import com.lumiedu.billing.enums.InstitutionalRequestStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface InstitutionalRequestRepository extends JpaRepository<InstitutionalRequest, Long> {
    List<InstitutionalRequest> findByStatus(InstitutionalRequestStatus status);
    Optional<InstitutionalRequest> findByRequesterEmail(String requesterEmail);
}
