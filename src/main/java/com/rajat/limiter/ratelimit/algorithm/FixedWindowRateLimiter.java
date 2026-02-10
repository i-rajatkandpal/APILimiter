package com.rajat.limiter.ratelimit.algorithm;

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

        long nowMillis = System.currentTimeMillis();

        // round down to the start of the current window (in seconds), then convert to millis.
        long nowSeconds = nowMillis / 1000;
        long windowStartSeconds = (nowSeconds / windowSeconds) * windowSeconds;
        long windowStartMillis = windowStartSeconds * 1000L;

        // key can be IP, this is done so that different users get exclusive counters to limit api.
        String redisKey = "rate:fixed:" + key + ":" + windowStartSeconds;

        // counts how many request can be made by a particular user
        Long count = redisTemplate.opsForValue().increment(redisKey);

        //for first request start expiry
        if (count == 1) {
            redisTemplate.expire(redisKey, Duration.ofSeconds(windowSeconds));
        }

        boolean allowed = count <= limit;
        long remaining = Math.max(0, limit - count);

        long resetAtMillis = windowStartMillis + windowSeconds * 1000L;

        // resetAt is the end of the current window
        return new RateLimitResponse(allowed, remaining, resetAtMillis);

    }
}
