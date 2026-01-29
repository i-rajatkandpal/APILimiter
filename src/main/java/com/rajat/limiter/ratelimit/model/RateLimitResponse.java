package com.rajat.limiter.ratelimit.model;


public class RateLimitResponse {
    private boolean allowed;
    private long remaining;
    private long resetAt;

    public boolean isAllowed() {
        return allowed;
    }

    public void setAllowed(boolean allowed) {
        this.allowed = allowed;
    }

    public long getRemaining() {
        return remaining;
    }

    public void setRemaining(long remaining) {
        this.remaining = remaining;
    }

    public long getResetAt() {
        return resetAt;
    }

    public void setResetAt(long resetAt) {
        this.resetAt = resetAt;
    }

    public RateLimitResponse(boolean allowed, long remaining, long resetAt) {
        this.allowed = allowed;
        this.remaining = remaining;
        this.resetAt = resetAt;
    }
}
