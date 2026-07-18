package com.lumiedu.notification.websocket;

import org.springframework.stereotype.Component;
import org.springframework.web.socket.CloseStatus;
import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketSession;
import org.springframework.web.socket.handler.TextWebSocketHandler;

import java.io.IOException;
import java.net.URI;
import java.net.URLDecoder;
import java.nio.charset.StandardCharsets;
import java.util.Collections;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.CopyOnWriteArraySet;

@Component
public class NotificationWebSocketHandler extends TextWebSocketHandler {

    private final ConcurrentHashMap<String, Set<WebSocketSession>> userSessions = new ConcurrentHashMap<>();

    @Override
    public void afterConnectionEstablished(WebSocketSession session) throws Exception {
        String email = getEmailFromSession(session);
        if (email != null) {
            String key = email.toLowerCase();
            userSessions.computeIfAbsent(key, k -> new CopyOnWriteArraySet<>()).add(session);
            System.out.println("WebSocket connection established for email: " + email + ", Session ID: " + session.getId());
        } else {
            System.out.println("WebSocket connection established without email, Session ID: " + session.getId());
        }
    }

    @Override
    public void afterConnectionClosed(WebSocketSession session, CloseStatus status) throws Exception {
        String email = getEmailFromSession(session);
        if (email != null) {
            String key = email.toLowerCase();
            Set<WebSocketSession> sessions = userSessions.get(key);
            if (sessions != null) {
                sessions.remove(session);
                if (sessions.isEmpty()) {
                    userSessions.remove(key);
                }
            }
            System.out.println("WebSocket connection closed for email: " + email + ", Session ID: " + session.getId());
        } else {
            System.out.println("WebSocket connection closed, Session ID: " + session.getId());
        }
    }

    public void sendNotification(String email, String message) {
        String key = email.toLowerCase();
        Set<WebSocketSession> sessions = userSessions.getOrDefault(key, Collections.emptySet());
        for (WebSocketSession session : sessions) {
            if (session.isOpen()) {
                try {
                    session.sendMessage(new TextMessage(message));
                    System.out.println("Sent real-time notification to: " + email + ", Session ID: " + session.getId());
                } catch (IOException e) {
                    System.err.println("Failed to send notification to: " + email + ", Session ID: " + session.getId() + ". Error: " + e.getMessage());
                }
            }
        }
    }

    private String getEmailFromSession(WebSocketSession session) {
        URI uri = session.getUri();
        if (uri != null && uri.getQuery() != null) {
            String query = uri.getQuery();
            for (String param : query.split("&")) {
                String[] entry = param.split("=");
                if (entry.length > 1 && "email".equalsIgnoreCase(entry[0])) {
                    try {
                        return URLDecoder.decode(entry[1], StandardCharsets.UTF_8.name());
                    } catch (Exception e) {
                        return entry[1];
                    }
                }
            }
        }
        return null;
    }
}
