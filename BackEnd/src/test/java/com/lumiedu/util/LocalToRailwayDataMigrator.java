package com.lumiedu.util;

import java.io.FileWriter;
import java.io.PrintWriter;
import java.sql.*;
import java.util.ArrayList;
import java.util.List;

public class LocalToRailwayDataMigrator {

    public static void main(String[] args) {
        String localUrl = "jdbc:mysql://localhost:3306/lumiedu?useSSL=false&allowPublicKeyRetrieval=true&serverTimezone=Asia/Ho_Chi_Minh";
        String localUser = "root";
        String localPass = "12345";
        String outputFile = "local_lumiedu_backup.sql";

        System.out.println("Starting full export (Schema + Data) from local MySQL (" + localUrl + ")...");

        try (Connection conn = DriverManager.getConnection(localUrl, localUser, localPass);
             PrintWriter writer = new PrintWriter(new FileWriter(outputFile))) {

            writer.println("SET FOREIGN_KEY_CHECKS = 0;");

            DatabaseMetaData metaData = conn.getMetaData();
            ResultSet tables = metaData.getTables("lumiedu", null, "%", new String[]{"TABLE"});

            List<String> tableNames = new ArrayList<>();
            while (tables.next()) {
                String tableName = tables.getString("TABLE_NAME");
                tableNames.add(tableName);
            }

            for (String table : tableNames) {
                System.out.println("Exporting DDL & Data for table: " + table);

                // 1. Export CREATE TABLE statement
                try (Statement stmt = conn.createStatement();
                     ResultSet createRs = stmt.executeQuery("SHOW CREATE TABLE `" + table + "`")) {
                    if (createRs.next()) {
                        String createSql = createRs.getString(2);
                        writer.println("DROP TABLE IF EXISTS `" + table + "`;");
                        writer.println(createSql + ";");
                    }
                } catch (Exception e) {
                    System.err.println("Error exporting schema for " + table + ": " + e.getMessage());
                }

                // 2. Export INSERT statements
                try (Statement stmt = conn.createStatement();
                     ResultSet rs = stmt.executeQuery("SELECT * FROM `" + table + "`")) {

                    ResultSetMetaData rsMeta = rs.getMetaData();
                    int columnCount = rsMeta.getColumnCount();

                    while (rs.next()) {
                        StringBuilder insertSb = new StringBuilder();
                        insertSb.append("INSERT INTO `").append(table).append("` VALUES (");

                        for (int i = 1; i <= columnCount; i++) {
                            if (i > 1) insertSb.append(", ");
                            Object value = rs.getObject(i);
                            if (value == null) {
                                insertSb.append("NULL");
                            } else if (value instanceof Number || value instanceof Boolean) {
                                insertSb.append(value);
                            } else if (value instanceof byte[]) {
                                byte[] bytes = (byte[]) value;
                                StringBuilder hex = new StringBuilder("0x");
                                for (byte b : bytes) {
                                    hex.append(String.format("%02x", b));
                                }
                                insertSb.append(hex);
                            } else {
                                String strVal = value.toString().replace("'", "''").replace("\\", "\\\\");
                                insertSb.append("'").append(strVal).append("'");
                            }
                        }
                        insertSb.append(");");
                        writer.println(insertSb.toString());
                    }
                } catch (Exception e) {
                    System.err.println("Error exporting data for table " + table + ": " + e.getMessage());
                }
            }

            writer.println("SET FOREIGN_KEY_CHECKS = 1;");
            System.out.println("Full export (Schema + Data) completed successfully to " + outputFile);

        } catch (Exception e) {
            System.err.println("Export failed: " + e.getMessage());
            e.printStackTrace();
        }
    }
}
