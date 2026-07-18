package com.lumiedu.ai.entity;

import com.lumiedu.common.entity.BaseEntity;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "document_chunks")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DocumentChunk extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "document_id", nullable = false)
    private Long documentId;

    @Column(name = "chunk_index", nullable = false)
    private Integer chunkIndex;

    @Column(name = "content", columnDefinition = "LONGTEXT", nullable = false)
    private String content;

    @Column(name = "embedding", columnDefinition = "LONGTEXT")
    private String embedding;
}
