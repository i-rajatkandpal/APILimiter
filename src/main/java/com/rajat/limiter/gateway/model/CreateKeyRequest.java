package com.rajat.limiter.gateway.model;

public class CreateKeyRequest {
    private String targetUrl;
    private String planName;

    public String getTargetUrl() { return targetUrl; }
    public void setTargetUrl(String targetUrl) { this.targetUrl = targetUrl; }
    public String getPlanName() { return planName; }
    public void setPlanName(String planName) { this.planName = planName; }
}