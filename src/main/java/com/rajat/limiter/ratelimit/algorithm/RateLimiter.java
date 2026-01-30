package com.rajat.limiter.ratelimit.algorithm;

import com.rajat.limiter.ratelimit.model.RateLimitResponse;

public interface RateLimiter {
    RateLimitResponse allow(String key, int limit, int windowSeconds);
}
