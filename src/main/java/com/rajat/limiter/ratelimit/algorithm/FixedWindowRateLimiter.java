package com.rajat.limiter.ratelimit.algorithm;

import com.rajat.limiter.ratelimit.model.RateLimitAlgorithm;
import org.springframework.data.redis.core.StringRedisTemplate;
import com.rajat.limiter.ratelimit.model.RateLimitResponse;
import org.springframework.stereotype.Component;

import java.time.Duration;

@Component
public class FixedWindowRateLimiter implements RateLimiter {

    private final StringRedisTemplate redisTemplate;

    public FixedWindowRateLimiter(StringRedisTemplate redisTemplate) {
        this.redisTemplate = redisTemplate;
    }

    @Override
    public RateLimitResponse allow(String key, int limit, int windowSeconds){
        long now = System.currentTimeMillis() / 1000;
        long windowStart = (now / windowSeconds) * windowSeconds;

        String redisKey = "rate:fixed:" + key + ":" + windowStart;

        long count = redisTemplate.opsForValue().increment(redisKey);

        if(count == 1){
            redisTemplate.expire(redisKey, Duration.ofSeconds(windowSeconds));
        }

        boolean allowed = count != 0 && count <= limit;
        long remaining = Math.max(0, limit - count);

        return new RateLimitResponse(allowed, remaining, windowSeconds + windowStart);

    }
}
