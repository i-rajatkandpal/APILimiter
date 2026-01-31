package com.rajat.limiter.ratelimit.algorithm;

import com.rajat.limiter.ratelimit.model.RateLimitResponse;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Component;

import java.time.Duration;

@Component
public class SlidingWindowCounterRateLimiter implements RateLimiter{
    private final StringRedisTemplate redisTemplate;

    public SlidingWindowCounterRateLimiter(StringRedisTemplate redisTemplate) {
        this.redisTemplate = redisTemplate;
    }

    @Override
    public RateLimitResponse allow(String key, int limit, int windowSeconds) {
        long now = System.currentTimeMillis() / 1000;
        long currentWindow = now / windowSeconds; // identifies which time window we are currently in
        long previousWindow = currentWindow - 1; // immediate previous window

        String currentKey = "rate:sliding:" + key + ":" + currentWindow;
        String previousKey = "rate:sliding:" + key + ":" + previousWindow;

        Long currentCount = redisTemplate.opsForValue().increment(currentKey); //increment request count
        if(currentCount == 1) redisTemplate.expire(currentKey, Duration.ofSeconds(windowSeconds * 2L)); //deactivate old windows after sufficient time

        String prevStr = redisTemplate.opsForValue().get(previousKey);
        long previousCount = prevStr != null ? Long.parseLong(prevStr) : 0;

        // how far we are into the current window (0.0 → 1.0)
        double timeIntoWindow = (now % windowSeconds) / (double) windowSeconds;

        // previous window traffic fades as time moves forward
        double estimatedCount = (previousCount * (1 - timeIntoWindow)) + currentCount;

        boolean allowed = estimatedCount <= limit;
        long remaining = (long) Math.max(0, limit - estimatedCount);

        return new RateLimitResponse(allowed, remaining, (currentWindow + 1) * windowSeconds);


    }
}
