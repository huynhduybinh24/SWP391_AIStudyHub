package com.lumiedu.document.entity;

import com.lumiedu.common.entity.BaseEntity;
import com.lumiedu.user.entity.User;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "documents")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Document extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "title", nullable = false, length = 255)
    private String title;

    @Column(name = "file_size", nullable = false)
    private Long fileSize; // size in bytes

    @Column(name = "file_url", columnDefinition = "LONGTEXT")
    private String fileUrl;

    @Column(name = "file_type", nullable = false, length = 50)
    private String fileType; // PDF, IMAGE, AUDIO, VIDEO, OTHER

    @Column(name = "checksum", nullable = false, length = 64)
    private String checksum; // hash/checksum to find duplicates

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;
}
