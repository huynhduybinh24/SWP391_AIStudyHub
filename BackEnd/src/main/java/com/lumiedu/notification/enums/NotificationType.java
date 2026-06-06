package com.lumiedu.notification.enums;

import com.fasterxml.jackson.annotation.JsonValue;

public enum NotificationType {
    AI("ai"),
    FOLDER("folder"),
    MENTION("mention"),
    SECURITY("security"),
    DOCUMENT("document"),
    CALENDAR("calendar"),
    FLASHCARD("flashcard"),
    DOCUMENT_DELETED("document_deleted"),
    DOCUMENT_REJECTED("document_rejected"),
    DOCUMENT_REMOVED("document_removed"),
    DOCUMENT_APPROVED("document_approved"),
    SYSTEM("system"),
    SHARED_FILE("shared_file"),
    AI_UPDATE("ai_update");

    private final String value;

    NotificationType(String value) {
        this.value = value;
    }

    @JsonValue
    public String getValue() {
        return value;
    }
}
