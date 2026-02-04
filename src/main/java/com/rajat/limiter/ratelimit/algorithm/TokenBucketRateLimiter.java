package com.rajat.limiter.ratelimit.algorithm;

import com.rajat.limiter.ratelimit.model.RateLimitResponse;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Component;

import java.time.Duration;

@Component
public class TokenBucketRateLimiter implements RateLimiter {
    private final StringRedisTemplate redisTemplate;

    public TokenBucketRateLimiter(StringRedisTemplate redisTemplate) {
        this.redisTemplate = redisTemplate;
    }

    @Override
    public RateLimitResponse allow(String key, int limit, int windowSeconds){

        //everyUser gets two attributes 1) number of tokens 2) last refill time
        String tokensKey = "rate:token:" + key + ":tokens";
        String lastRefillKey = "rate:token:" + key + ":lastRefill";

        long now = System.currentTimeMillis();

        // getting current state of user from redis
        String tokenStr = redisTemplate.opsForValue().get(tokensKey);
        String lastRefillStr = redisTemplate.opsForValue().get(lastRefillKey);

        //if first time start with full bucket and lastRefillTime is current
        double tokens = tokenStr != null ? Double.parseDouble(tokenStr) : limit;
        long lastRefill = lastRefillStr != null ? Long.parseLong(lastRefillStr) : now;

        double refillRate = (double) limit / windowSeconds;
        double timePassed = (double) (now - lastRefill) / 1000;

        tokens = Math.min(limit, tokens + (refillRate * timePassed));

        boolean allowed = tokens >= 1;
        if(allowed) tokens--;

        //saving updated state
        redisTemplate.opsForValue().set(tokensKey,String.valueOf(tokens));
        redisTemplate.opsForValue().set(lastRefillKey, String.valueOf(now));

        // Expire inactive buckets after sufficient idle time to prevent Redis memory growth
        redisTemplate.expire(tokensKey, Duration.ofSeconds(windowSeconds * 2L));
        redisTemplate.expire(lastRefillKey, Duration.ofSeconds(windowSeconds * 2L));

        long remaining = (long) tokens;
        long resetAt = (long) (now + ((limit - tokens) / refillRate * 1000));

        return new RateLimitResponse(allowed, remaining, resetAt);

    }
}
