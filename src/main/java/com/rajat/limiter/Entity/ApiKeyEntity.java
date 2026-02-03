package com.rajat.limiter.Entity;

import jakarta.persistence.*;
import lombok.Data;

import java.time.Instant;

@Entity
@Data
@Table(name = "api_keys")


public class ApiKeyEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(unique = true, nullable = false)
    private String apiKey;

    @Column(nullable = false)
    private String targetUrl;

    @Column(nullable = false)
    private String planName;

    private boolean enabled = true;

    private Instant createdAt = Instant.now();


}
