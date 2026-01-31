package com.rajat.limiter.gateway.service;

import com.rajat.limiter.ratelimit.model.RateLimitAlgorithm;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.Map;

@Service
public class ApiKeyService {
    private final Map<String, String> apiKeys = new HashMap<>();
    private final Map<String, PlanConfig> planConfigs = new HashMap<>();

    public ApiKeyService(){
        apiKeys.put("api-8148892552", "https://rajat-kandpal.com/data");
        planConfigs.put("api-8148892552", new PlanConfig(10,60, RateLimitAlgorithm.TOKEN_BUCKET));
    }

    public boolean isValid(String apiKey){
        return apiKeys.containsKey(apiKey);
    }
    public String getTargetUrl(String apiKey){
        return apiKeys.get(apiKey);
    }
    public PlanConfig getPlanConfig(String apiKey){
        return planConfigs.get(apiKey);
    }


}
