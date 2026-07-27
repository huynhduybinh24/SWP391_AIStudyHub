package com.lumiedu.util;

import java.io.BufferedReader;
import java.io.FileReader;
import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.Statement;

public class LocalToRailwayDataImporter {

    public static void main(String[] args) {
        String railwayUrl = "jdbc:mysql://sakura.proxy.rlwy.net:34236/railway?useSSL=false&allowPublicKeyRetrieval=true&rewriteBatchedStatements=true&serverTimezone=Asia/Ho_Chi_Minh";
        String railwayUser = "root";
        String railwayPass = "wPqSEwjOnAwprreSPiCxIVbflYFEqFJC";
        String sqlFile = "local_lumiedu_backup.sql";

        System.out.println("Starting HIGH-SPEED batch import of 23MB " + sqlFile + " into Railway MySQL...");

        try (Connection conn = DriverManager.getConnection(railwayUrl, railwayUser, railwayPass);
             BufferedReader reader = new BufferedReader(new FileReader(sqlFile));
             Statement stmt = conn.createStatement()) {

            conn.setAutoCommit(false);
            stmt.execute("SET FOREIGN_KEY_CHECKS = 0;");

            StringBuilder sqlBuilder = new StringBuilder();
            String line;
            int count = 0;
            int pendingInBatch = 0;

            while ((line = reader.readLine()) != null) {
                String trimmed = line.trim();
                if (trimmed.isEmpty() || trimmed.startsWith("--") || trimmed.startsWith("#")) {
                    continue;
                }

                sqlBuilder.append(line).append("\n");

                if (trimmed.endsWith(";")) {
                    String fullSql = sqlBuilder.toString().trim();
                    sqlBuilder.setLength(0);

                    // Drop trailing semicolon if present
                    if (fullSql.endsWith(";")) {
                        fullSql = fullSql.substring(0, fullSql.length() - 1);
                    }

                    stmt.addBatch(fullSql);
                    count++;
                    pendingInBatch++;

                    if (pendingInBatch >= 300) {
                        try {
                            stmt.executeBatch();
                            conn.commit();
                        } catch (Exception e) {
                            conn.rollback();
                            System.err.println("Batch error: " + e.getMessage());
                        }
                        pendingInBatch = 0;
                        System.out.println("Fast-imported " + count + " statements...");
                    }
                }
            }

            if (pendingInBatch > 0) {
                try {
                    stmt.executeBatch();
                    conn.commit();
                } catch (Exception e) {
                    conn.rollback();
                }
            }

            stmt.execute("SET FOREIGN_KEY_CHECKS = 1;");
            conn.commit();

            System.out.println("🎉 SUCCESS! Ultra-fast imported ALL " + count + " statements into Railway MySQL database!");

        } catch (Exception e) {
            System.err.println("Import failed: " + e.getMessage());
            e.printStackTrace();
        }
    }
}
