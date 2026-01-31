package com.rajat.limiter.gateway.service;

import com.rajat.limiter.ratelimit.algorithm.RateLimiter;
import com.rajat.limiter.ratelimit.model.RateLimitAlgorithm;

public class PlanConfig {
    private final int limit;
    private final int windowSeconds;
    private final RateLimitAlgorithm rateLimitAlgorithm;

    public PlanConfig(int limit, int windowSeconds, RateLimitAlgorithm rateLimitAlgorithm) {
        this.limit = limit;
        this.windowSeconds = windowSeconds;
        this.rateLimitAlgorithm = rateLimitAlgorithm;
    }

    public int getLimit() {
        return limit;
    }

    public int getWindowSeconds() {
        return windowSeconds;
    }

    public RateLimitAlgorithm getRateLimitAlgorithm() {
        return rateLimitAlgorithm;
    }
}
