package com.lumiedu.ai.entity;

import com.lumiedu.common.entity.BaseEntity;
import jakarta.persistence.*;
import lombok.*;
import java.util.List;

@Entity
@Table(name = "ai_chat_sessions")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AiChatSession extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "document_id")
    private Long documentId;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(name = "title", length = 255)
    private String title;

    @ManyToMany(fetch = FetchType.LAZY)
    @JoinTable(
        name = "ai_chat_session_documents",
        joinColumns = @JoinColumn(name = "session_id"),
        inverseJoinColumns = @JoinColumn(name = "document_id")
    )
    @Builder.Default
    private List<com.lumiedu.document.entity.Document> documents = new java.util.ArrayList<>();

}
