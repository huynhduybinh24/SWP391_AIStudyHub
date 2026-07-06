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
            
            System.out.println("=== DOCUMENTS ===");
            ResultSet rsDoc = stmt.executeQuery("SELECT id, title, file_name, file_url, storage_provider FROM documents WHERE title LIKE '%Presentation%'");
            long docId = -1;
            while (rsDoc.next()) {
                docId = rsDoc.getLong("id");
                System.out.printf("Doc ID: %d | Title: %s | FileName: %s | Storage: %s\n",
                        docId,
                        rsDoc.getString("title"),
                        rsDoc.getString("file_name"),
                        rsDoc.getString("storage_provider")
                );
            }
            
            if (docId != -1) {
                System.out.println("\n=== CHUNKS FOR LAST PRESENTATION DOCUMENT ===");
                ResultSet rsChunks = stmt.executeQuery("SELECT id, chunk_index, content FROM document_chunks WHERE document_id = " + docId);
                int count = 0;
                while (rsChunks.next()) {
                    count++;
                    String content = rsChunks.getString("content");
                    System.out.printf("  Chunk ID: %d | Index: %d | Content (len %d): %s\n",
                            rsChunks.getLong("id"),
                            rsChunks.getInt("chunk_index"),
                            content.length(),
                            content.replace("\n", " [NL] ")
                    );
                }
                System.out.println("Total chunks: " + count);
            }
            
            conn.close();
        } catch (Exception e) {
            e.printStackTrace();
        }
    }
}
