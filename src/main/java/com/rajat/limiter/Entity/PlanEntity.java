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


    public String getPlanName() {
        return planName;
    }

    public void setPlanName(String planName) {
        this.planName = planName;
    }

    public int getRateLimit() {
        return rateLimit;
    }

    public void setRateLimit(int rateLimit) {
        this.rateLimit = rateLimit;
    }

    public int getWindowSeconds() {
        return windowSeconds;
    }

    public void setWindowSeconds(int windowSeconds) {
        this.windowSeconds = windowSeconds;
    }

    public RateLimitAlgorithm getAlgorithm() {
        return algorithm;
    }

    public void setAlgorithm(RateLimitAlgorithm algorithm) {
        this.algorithm = algorithm;
    }
}
