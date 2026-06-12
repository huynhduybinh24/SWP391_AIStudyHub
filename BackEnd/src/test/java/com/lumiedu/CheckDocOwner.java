package com.lumiedu;

import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.ResultSet;
import java.sql.Statement;

public class CheckDocOwner {
    public static void main(String[] args) {
        String url = "jdbc:mysql://localhost:3306/lumiedu?useSSL=false&allowPublicKeyRetrieval=true&serverTimezone=Asia/Ho_Chi_Minh";
        String user = "root";
        String password = "12345";

        try {
            Class.forName("com.mysql.cj.jdbc.Driver");
            Connection conn = DriverManager.getConnection(url, user, password);
            Statement stmt = conn.createStatement();
            ResultSet rs = stmt.executeQuery("SELECT d.id, d.title, d.user_id, u.email, u.full_name FROM documents d LEFT JOIN users u ON d.user_id = u.id WHERE d.id = 4");
            if (rs.next()) {
                System.out.printf("Doc ID: %d | Title: %s | UserID: %s | UserEmail: %s | UserFullName: %s\n",
                        rs.getLong("id"),
                        rs.getString("title"),
                        rs.getString("user_id"),
                        rs.getString("email"),
                        rs.getString("full_name")
                );
            } else {
                System.out.println("Doc not found");
            }
            conn.close();
        } catch (Exception e) {
            e.printStackTrace();
        }
    }
}
