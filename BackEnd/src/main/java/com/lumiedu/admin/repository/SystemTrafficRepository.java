package com.lumiedu.admin.repository;

import com.lumiedu.admin.entity.SystemTraffic;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.Optional;

public interface SystemTrafficRepository extends JpaRepository<SystemTraffic, Long> {

    Optional<SystemTraffic> findByTrafficDate(LocalDate trafficDate);

    @Modifying
    @Transactional
    @Query("UPDATE SystemTraffic t SET t.pageViews = t.pageViews + 1 WHERE t.trafficDate = :date")
    int incrementPageViews(@Param("date") LocalDate date);

    @Query("SELECT SUM(t.pageViews) FROM SystemTraffic t WHERE t.trafficDate >= :start AND t.trafficDate <= :end")
    Long sumPageViewsBetween(@Param("start") LocalDate start, @Param("end") LocalDate end);
}
