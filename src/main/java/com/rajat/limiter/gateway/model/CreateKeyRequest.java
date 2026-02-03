package com.rajat.limiter.gateway.model;

import lombok.Data;

@Data
public class CreateKeyRequest {
    private String targetUrl;
    private String planName;
}