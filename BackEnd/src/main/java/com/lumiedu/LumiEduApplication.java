package com.lumiedu;

import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;
import org.springframework.jdbc.core.JdbcTemplate;

import org.springframework.scheduling.annotation.EnableAsync;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
@EnableAsync
public class LumiEduApplication {
    public static void main(String[] args) {
        SpringApplication.run(LumiEduApplication.class, args);
    }

    @Bean
    public CommandLineRunner run(JdbcTemplate jdbcTemplate) {
        return args -> {
            try {
                jdbcTemplate.execute("ALTER TABLE users MODIFY COLUMN avatar_url LONGTEXT");
                System.out.println("Successfully modified users.avatar_url column definition to LONGTEXT");
            } catch (Exception e) {
                System.err.println("Could not modify users.avatar_url column: " + e.getMessage());
            }
            try {
                jdbcTemplate.execute("UPDATE documents SET subject = 'GENERAL' WHERE subject = 'BIOLOGY'");
                System.out.println("Successfully updated BIOLOGY subjects in documents table to GENERAL");
            } catch (Exception e) {
                System.err.println("Could not update documents subject column: " + e.getMessage());
            }
        };
    }
}
