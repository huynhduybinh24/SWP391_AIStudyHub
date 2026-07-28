package com.lumiedu.util;

import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.ResultSet;
import java.sql.Statement;

public class CheckAivenUserCount {
    public static void main(String[] args) {
        String url = "jdbc:mysql://mysql-3234de44-lumiedu-project1.d.aivencloud.com:12699/defaultdb?useSSL=false&allowPublicKeyRetrieval=true";
        String user = "avnadmin";
        String pass = "AVNS_XbDfvRbVCLB2-X6TnB-";

        try (Connection conn = DriverManager.getConnection(url, user, pass);
             Statement stmt = conn.createStatement()) {

            ResultSet rsUsers = stmt.executeQuery("SELECT COUNT(*), role FROM users GROUP BY role");
            System.out.println("=== AIVEN MYSQL USER BREAKDOWN BY ROLE ===");
            while (rsUsers.next()) {
                System.out.println("Role: " + rsUsers.getString(2) + " -> Count: " + rsUsers.getInt(1));
            }

            ResultSet rsTotal = stmt.executeQuery("SELECT COUNT(*) FROM users");
            if (rsTotal.next()) {
                System.out.println("Total Users in Table: " + rsTotal.getInt(1));
            }

            ResultSet rsDocs = stmt.executeQuery("SELECT COUNT(*) FROM documents");
            if (rsDocs.next()) {
                System.out.println("Total Documents in Table: " + rsDocs.getInt(1));
            }

        } catch (Exception e) {
            e.printStackTrace();
        }
    }
}
