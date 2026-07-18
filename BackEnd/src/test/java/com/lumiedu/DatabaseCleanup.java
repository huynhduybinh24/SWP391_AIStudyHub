package com.lumiedu;

import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.Statement;

public class DatabaseCleanup {
    public static void main(String[] args) {
        String url = "jdbc:mysql://localhost:3306/lumiedu?useSSL=false&serverTimezone=Asia/Ho_Chi_Minh&allowPublicKeyRetrieval=true";
        String user = "root";
        String password = "12345";

        System.out.println("=== Standalone MySQL Cleanup Starting ===");
        try {
            Class.forName("com.mysql.cj.jdbc.Driver");
            try (Connection conn = DriverManager.getConnection(url, user, password);
                 Statement stmt = conn.createStatement()) {
                
                System.out.println("Connected to MySQL successfully!");
                stmt.execute("SET FOREIGN_KEY_CHECKS = 0");

                String selectTestUsersSubquery = "SELECT id FROM users WHERE email LIKE 'test_%' OR email LIKE 'testuser_%' OR full_name LIKE 'Test User%'";
                
                stmt.executeUpdate("DELETE FROM workspace_members WHERE user_id IN (" + selectTestUsersSubquery + ")");
                stmt.executeUpdate("DELETE FROM shared_workspaces WHERE owner_id IN (" + selectTestUsersSubquery + ")");
                stmt.executeUpdate("DELETE FROM ai_chat_sessions WHERE user_id IN (" + selectTestUsersSubquery + ")");
                stmt.executeUpdate("DELETE FROM quiz_attempt WHERE user_id IN (" + selectTestUsersSubquery + ")");
                stmt.executeUpdate("DELETE FROM ai_usage_logs WHERE user_id IN (" + selectTestUsersSubquery + ")");
                stmt.executeUpdate("DELETE FROM user_subscriptions WHERE user_id IN (" + selectTestUsersSubquery + ")");
                stmt.executeUpdate("DELETE FROM payments WHERE user_id IN (" + selectTestUsersSubquery + ")");
                stmt.executeUpdate("DELETE FROM notifications WHERE user_id IN (" + selectTestUsersSubquery + ")");
                stmt.executeUpdate("DELETE FROM documents WHERE user_id IN (" + selectTestUsersSubquery + ")");
                int deletedCount = stmt.executeUpdate("DELETE FROM users WHERE email LIKE 'test_%' OR email LIKE 'testuser_%' OR full_name LIKE 'Test User%'");
                
                stmt.execute("SET FOREIGN_KEY_CHECKS = 1");
                System.out.println("=== CLEANUP SUCCESSFUL, deleted users count: " + deletedCount + " ===");
            }
        } catch (Exception e) {
            System.err.println("Cleanup failed with error: " + e.getMessage());
            e.printStackTrace();
        }
    }
}
