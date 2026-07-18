package com.lumiedu;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.io.OutputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.HashMap;
import java.util.Map;
import java.util.Scanner;

public class GetRefreshToken {
    public static void main(String[] args) {
        Scanner scanner = new Scanner(System.in);
        System.out.println("=================================================");
        System.out.println("       GOOGLE OAUTH2 REFRESH TOKEN GENERATOR     ");
        System.out.println("=================================================");
        System.out.print("1. Nhập Google Client ID: ");
        String clientId = scanner.nextLine().trim();

        System.out.print("2. Nhập Google Client Secret: ");
        String clientSecret = scanner.nextLine().trim();

        String redirectUri = "http://localhost:8888";

        try {
            // Generate Auth URL
            String authUrl = "https://accounts.google.com/o/oauth2/v2/auth?" +
                    "client_id=" + URLEncoder.encode(clientId, "UTF-8") +
                    "&redirect_uri=" + URLEncoder.encode(redirectUri, "UTF-8") +
                    "&response_type=code" +
                    "&scope=" + URLEncoder.encode("https://www.googleapis.com/auth/drive", "UTF-8") +
                    "&access_type=offline" +
                    "&prompt=consent";

            System.out.println("\n-------------------------------------------------");
            System.out.println("BƯỚC 1: Đăng nhập và cấp quyền");
            System.out.println("Hãy sao chép liên kết dưới đây, dán vào trình duyệt và đồng ý cấp quyền:");
            System.out.println(authUrl);
            System.out.println("-------------------------------------------------");
            System.out.println("\nBƯỚC 2: Sau khi cấp quyền, trình duyệt sẽ chuyển hướng đến lỗi trang http://localhost:8888/?code=xxxx...");
            System.out.print("Hãy copy chuỗi code từ thanh địa chỉ trình duyệt (phần sau '?code=') và dán vào đây: ");
            String code = scanner.nextLine().trim();

            // Exchange Code for Tokens
            System.out.println("\nĐang trao đổi mã code để lấy Refresh Token...");
            URL tokenUrl = new URL("https://oauth2.googleapis.com/token");
            HttpURLConnection conn = (HttpURLConnection) tokenUrl.openConnection();
            conn.setRequestMethod("POST");
            conn.setRequestProperty("Content-Type", "application/x-www-form-urlencoded");
            conn.setDoOutput(true);

            String requestBody = "client_id=" + URLEncoder.encode(clientId, "UTF-8") +
                    "&client_secret=" + URLEncoder.encode(clientSecret, "UTF-8") +
                    "&code=" + URLEncoder.encode(code, "UTF-8") +
                    "&redirect_uri=" + URLEncoder.encode(redirectUri, "UTF-8") +
                    "&grant_type=authorization_code";

            try (OutputStream os = conn.getOutputStream()) {
                os.write(requestBody.getBytes(StandardCharsets.UTF_8));
            }

            int responseCode = conn.getResponseCode();
            if (responseCode == 200) {
                BufferedReader in = new BufferedReader(new InputStreamReader(conn.getInputStream(), StandardCharsets.UTF_8));
                StringBuilder response = new StringBuilder();
                String inputLine;
                while ((inputLine = in.readLine()) != null) {
                    response.append(inputLine);
                }
                in.close();

                String json = response.toString();
                System.out.println("\n================ KẾT QUẢ ================");
                System.out.println("Thành công! Dưới đây là JSON trả về:");
                System.out.println(json);
                System.out.println("=========================================");
            } else {
                BufferedReader in = new BufferedReader(new InputStreamReader(conn.getErrorStream(), StandardCharsets.UTF_8));
                StringBuilder response = new StringBuilder();
                String inputLine;
                while ((inputLine = in.readLine()) != null) {
                    response.append(inputLine);
                }
                in.close();
                System.out.println("\nLỗi! Mã HTTP: " + responseCode);
                System.out.println("Chi tiết lỗi: " + response.toString());
            }

        } catch (Exception e) {
            e.printStackTrace();
        }
    }
}
