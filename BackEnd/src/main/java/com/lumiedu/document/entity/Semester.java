package com.lumiedu.document.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "semesters")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Semester {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "name", nullable = false)
    private String name;

    @Column(name = "user_id")
    private Long userId; // Nullable for system-wide defaults
}
