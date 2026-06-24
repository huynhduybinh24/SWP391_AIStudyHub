package com.lumiedu.integration.repository;

import com.lumiedu.integration.entity.UserGoogleDriveConnection;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface UserGoogleDriveConnectionRepository extends JpaRepository<UserGoogleDriveConnection, Long> {
    Optional<UserGoogleDriveConnection> findByUserId(Long userId);
}
