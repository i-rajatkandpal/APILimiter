package com.rajat.limiter.Entity;

import com.rajat.limiter.ratelimit.model.RateLimitAlgorithm;
import jakarta.persistence.*;

@Entity
@Table(name = "plans")
public class PlanEntity {

    @Id
    private String planName; // FREE, PREMIUM

    private int limit;

    private int windowSeconds;

    @Enumerated(EnumType.STRING)
    private RateLimitAlgorithm algorithm;
}
