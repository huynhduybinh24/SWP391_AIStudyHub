package com.lumiedu.billing.repository;

import com.lumiedu.billing.entity.Payment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface PaymentRepository extends JpaRepository<Payment, Long> {
    List<Payment> findByUserId(Long userId);
    Optional<Payment> findByTransactionCode(String transactionCode);
    Optional<Payment> findByInvoiceCode(String invoiceCode);
}
