package com.rajat.limiter.Entity;

import com.rajat.limiter.ratelimit.model.RateLimitAlgorithm;
import jakarta.persistence.*;
import lombok.Data;

@Entity
@Table(name = "plans")
@Data
public class PlanEntity {

    @Id
    private String planName; // FREE, PREMIUM

    @Column(name = "rate_limit")
    private int rateLimit;

    private int windowSeconds;

    @Enumerated(EnumType.STRING)
    private RateLimitAlgorithm algorithm;

}
