package com.rajat.limiter.ratelimit.service;

import com.rajat.limiter.ratelimit.algorithm.FixedWindowRateLimiter;
import com.rajat.limiter.ratelimit.algorithm.RateLimiter;
import com.rajat.limiter.ratelimit.algorithm.SlidingWindowCounterRateLimiter;
import com.rajat.limiter.ratelimit.algorithm.TokenBucketRateLimiter;
import com.rajat.limiter.ratelimit.model.RateLimitAlgorithm;
import com.rajat.limiter.ratelimit.model.RateLimitRequest;
import com.rajat.limiter.ratelimit.model.RateLimitResponse;
import org.springframework.stereotype.Service;

import java.util.Map;

@Service
public class RateLimiterService {

    private final Map<RateLimitAlgorithm, RateLimiter> limiters;

    public RateLimiterService(FixedWindowRateLimiter fixedWindowRateLimiter,
                              TokenBucketRateLimiter tokenBucketRateLimiter,
                              SlidingWindowCounterRateLimiter slidingWindowCounterRateLimiter) {
        this.limiters = Map.of(
                RateLimitAlgorithm.FIXED_WINDOW, fixedWindowRateLimiter,
                RateLimitAlgorithm.TOKEN_BUCKET, tokenBucketRateLimiter,
                RateLimitAlgorithm.SLIDING_WINDOW, slidingWindowCounterRateLimiter
        );
    }

    public RateLimitResponse check(RateLimitRequest request) {
        RateLimiter limiter = limiters.get(request.getAlgorithm());
        return limiter.allow(
                request.getKey(),
                request.getLimit(),
                request.getWindowSeconds()
        );
    }
}
