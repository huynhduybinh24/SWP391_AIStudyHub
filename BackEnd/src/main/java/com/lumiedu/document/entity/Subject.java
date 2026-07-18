package com.lumiedu.document.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "subjects")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Subject {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "name", nullable = false)
    private String name;

    @Column(name = "code", nullable = false)
    private String code;

    @Column(name = "semester_name", nullable = false)
    private String semesterName; // References Semester.name

    @Column(name = "majors", length = 150)
    private String majors; // Comma-separated list, e.g. "SE,AI,BA"

    @Column(name = "user_id")
    private Long userId; // Nullable for system-wide defaults
}
