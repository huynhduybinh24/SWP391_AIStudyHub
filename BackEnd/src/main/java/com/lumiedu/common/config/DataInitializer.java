package com.lumiedu.common.config;

import com.lumiedu.user.entity.User;
import com.lumiedu.user.enums.AccountStatus;
import com.lumiedu.user.enums.UserRole;
import com.lumiedu.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
@RequiredArgsConstructor
public class DataInitializer implements CommandLineRunner {

    private final UserRepository userRepository;

    @Override
    public void run(String... args) throws Exception {
        if (userRepository.count() == 0) {
            User student = User.builder()
                    .fullName("Student User")
                    .email("student@lumiedu.com")
                    .passwordHash("123456")
                    .role(UserRole.STUDENT)
                    .accountStatus(AccountStatus.ACTIVE)
                    .build();

            User instructor = User.builder()
                    .fullName("Instructor User")
                    .email("instructor@lumiedu.com")
                    .passwordHash("123456")
                    .role(UserRole.INSTRUCTOR)
                    .accountStatus(AccountStatus.ACTIVE)
                    .build();

            User admin = User.builder()
                    .fullName("Admin User")
                    .email("admin@lumiedu.com")
                    .passwordHash("123456")
                    .role(UserRole.ADMIN)
                    .accountStatus(AccountStatus.ACTIVE)
                    .build();

            userRepository.saveAll(List.of(student, instructor, admin));
            System.out.println("--- Seeded sample users successfully ---");
        }
    }
}
