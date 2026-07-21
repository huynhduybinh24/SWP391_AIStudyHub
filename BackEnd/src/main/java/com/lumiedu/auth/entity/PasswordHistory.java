package com.lumiedu.auth.entity;

import com.lumiedu.common.entity.BaseEntity;
import com.lumiedu.user.entity.User;
import jakarta.persistence.*;

@Entity
@Table(name = "password_history")
public class PasswordHistory extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(name = "password_hash", nullable = false)
    private String passwordHash;

    public PasswordHistory() {}

    public PasswordHistory(User user, String passwordHash) {
        this.user = user;
        this.passwordHash = passwordHash;
    }

    public PasswordHistory(Long id, User user, String passwordHash) {
        this.id = id;
        this.user = user;
        this.passwordHash = passwordHash;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public User getUser() { return user; }
    public void setUser(User user) { this.user = user; }

    public String getPasswordHash() { return passwordHash; }
    public void setPasswordHash(String passwordHash) { this.passwordHash = passwordHash; }
}
