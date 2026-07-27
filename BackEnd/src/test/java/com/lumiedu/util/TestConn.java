package com.lumiedu.util;

import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.ResultSet;
import java.sql.Statement;

public class TestConn {
    public static void main(String[] args) {
        String railwayUrl = "jdbc:mysql://sakura.proxy.rlwy.net:34236/railway?useSSL=false&allowPublicKeyRetrieval=true&serverTimezone=Asia/Ho_Chi_Minh&connectTimeout=5000";
        String railwayUser = "root";
        String railwayPass = "wPqSEwjOnAwprreSPiCxIVbflYFEqFJC";

        try (Connection conn = DriverManager.getConnection(railwayUrl, railwayUser, railwayPass);
             Statement stmt = conn.createStatement();
             ResultSet rs = stmt.executeQuery("SHOW TABLES")) {

            int count = 0;
            while (rs.next()) {
                count++;
                System.out.println("Table " + count + ": " + rs.getString(1));
            }
            System.out.println("TOTAL TABLES CREATED IN RAILWAY MYSQL: " + count);

        } catch (Exception e) {
            e.printStackTrace();
        }
    }
}
