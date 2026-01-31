package com.rajat.limiter.Entity;

import jakarta.persistence.*;

import java.time.Instant;

@Entity
@Table(name = "api_keys")
public class ApiKeyEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, nullable = false)
    private String apiKey;

    @Column(nullable = false)
    private String targetUrl;

    @Column(nullable = false)
    private String planName;

    private boolean enabled = true;

    private Instant createdAt = Instant.now();
}
