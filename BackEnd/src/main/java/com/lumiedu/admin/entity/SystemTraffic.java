package com.lumiedu.admin.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDate;

@Entity
@Table(name = "system_traffic")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SystemTraffic {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "traffic_date", nullable = false, unique = true)
    private LocalDate trafficDate;

    @Column(name = "page_views", nullable = false)
    private Long pageViews;
}
