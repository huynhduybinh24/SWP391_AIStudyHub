package com.lumiedu.util;

import java.io.BufferedReader;
import java.io.FileReader;
import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.Statement;

public class LocalToAivenDataImporter {

    public static void main(String[] args) {
        String aivenUrl = "jdbc:mysql://mysql-3234de44-lumiedu-project1.d.aivencloud.com:12699/defaultdb?useSSL=true&trustServerCertificate=true&allowPublicKeyRetrieval=true&rewriteBatchedStatements=true&serverTimezone=Asia/Ho_Chi_Minh";
        String aivenUser = "avnadmin";
        String aivenPass = "AVNS_XbDfvRbVCLB2-X6TnB-";
        String sqlFile = "local_lumiedu_backup.sql";

        System.out.println("Starting HIGH-SPEED batch import of 23MB " + sqlFile + " into Aiven MySQL...");

        try (Connection conn = DriverManager.getConnection(aivenUrl, aivenUser, aivenPass);
             BufferedReader reader = new BufferedReader(new FileReader(sqlFile));
             Statement stmt = conn.createStatement()) {

            conn.setAutoCommit(false);
            stmt.execute("SET SESSION sql_require_primary_key = OFF;");
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
                        System.out.println("Pushed " + count + " statements to Aiven...");
                    }
                }
            }

            if (pendingInBatch > 0) {
                stmt.executeBatch();
                conn.commit();
                System.out.println("Pushed final batch. Total statements: " + count);
            }

            stmt.execute("SET FOREIGN_KEY_CHECKS = 1;");
            System.out.println("✅ IMPORT TO AIVEN MYSQL COMPLETED SUCCESSFULLY!");

        } catch (Exception e) {
            e.printStackTrace();
        }
    }
}
