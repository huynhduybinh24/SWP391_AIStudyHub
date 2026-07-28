package com.lumiedu.util;

import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.ResultSet;
import java.sql.Statement;

public class TestAivenConn {
    public static void main(String[] args) {
        String aivenUrl = System.getenv().getOrDefault("SPRING_DATASOURCE_URL", "jdbc:mysql://mysql-3234de44-lumiedu-project1.d.aivencloud.com:12699/defaultdb?useSSL=true&trustServerCertificate=true&allowPublicKeyRetrieval=true&serverTimezone=Asia/Ho_Chi_Minh");
        String aivenUser = System.getenv().getOrDefault("SPRING_DATASOURCE_USERNAME", "avnadmin");
        String aivenPass = System.getenv().getOrDefault("SPRING_DATASOURCE_PASSWORD", "AIVEN_DB_PASSWORD");

        try (Connection conn = DriverManager.getConnection(aivenUrl, aivenUser, aivenPass);
             Statement stmt = conn.createStatement();
             ResultSet rs = stmt.executeQuery("SHOW TABLES;")) {

            int count = 0;
            while (rs.next()) {
                count++;
            }
            System.out.println("✅ VERIFIED AIVEN MYSQL DATABASE HAS EXACTLY " + count + " TABLES!");

        } catch (Exception e) {
            e.printStackTrace();
        }
    }
}
