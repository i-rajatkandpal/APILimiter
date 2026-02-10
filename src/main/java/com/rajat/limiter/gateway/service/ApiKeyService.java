package com.rajat.limiter.gateway.service;

import com.rajat.limiter.Entity.ApiKeyEntity;
import com.rajat.limiter.Entity.PlanEntity;
import com.rajat.limiter.Repositories.ApiKeyRepository;
import com.rajat.limiter.Repositories.PlanRepository;
import com.rajat.limiter.common.exception.InvalidApiKeyException;
import com.rajat.limiter.common.exception.PlanNotFoundException;
import org.springframework.stereotype.Service;

import java.util.Optional;

@Service
public class ApiKeyService {
    private final ApiKeyRepository apiKeyRepository;
    private final PlanRepository planRepository;

    public ApiKeyService(ApiKeyRepository apiKeyRepository, PlanRepository planRepository) {
        this.apiKeyRepository = apiKeyRepository;
        this.planRepository = planRepository;
    }

    public boolean isValid(String apiKey) {
        Optional<ApiKeyEntity> temp = apiKeyRepository.findByApiKey(apiKey);

        if (temp.isEmpty())
            return false;

        ApiKeyEntity key = temp.get();
        return key.isEnabled();
    }

    public String getTargetUrl(String apiKey) {
        Optional<ApiKeyEntity> temp = apiKeyRepository.findByApiKey(apiKey);

        if (temp.isEmpty())
            throw new InvalidApiKeyException("Invalid API key");

        ApiKeyEntity key = temp.get();

        return key.getTargetUrl();
    }

    public PlanConfig getPlanConfig(String apiKey) {
        ApiKeyEntity key = apiKeyRepository.findByApiKey(apiKey)
                .orElseThrow(() -> new InvalidApiKeyException("Invalid API key"));

        PlanEntity plan = planRepository.findById(key.getPlanName())
                .orElseThrow(() -> new PlanNotFoundException("Plan '" + key.getPlanName() + "' not found"));

        return new PlanConfig(
                plan.getRateLimit(),
                plan.getWindowSeconds(),
                plan.getAlgorithm());
    }
}
