package com.lumiedu.ai.entity;

import com.lumiedu.ai.dto.ChatSourceDto;
import com.lumiedu.common.entity.BaseEntity;
import jakarta.persistence.*;
import lombok.*;

import java.util.List;

@Entity
@Table(name = "ai_chat_messages")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AiChatMessage extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "session_id", nullable = false)
    private Long sessionId;

    @Column(name = "sender", nullable = false, length = 50)
    private String sender;

    @Column(name = "message_text", columnDefinition = "TEXT")
    private String messageText;

    @Column(name = "thought", columnDefinition = "TEXT")
    private String thought;

    @Column(name = "execution_log_id")
    private Long executionLogId;

    @Transient
    private List<ChatSourceDto> sources;
}
