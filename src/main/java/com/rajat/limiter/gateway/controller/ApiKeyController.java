package com.rajat.limiter.gateway.controller;

import com.rajat.limiter.Entity.ApiKeyEntity;
import com.rajat.limiter.Entity.UserEntity;
import com.rajat.limiter.Repositories.ApiKeyRepository;
import com.rajat.limiter.gateway.model.CreateKeyRequest;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("api/keys")
public class ApiKeyController {

    private final ApiKeyRepository apiKeyRepository;

    public ApiKeyController(ApiKeyRepository apiKeyRepository) {
        this.apiKeyRepository = apiKeyRepository;
    }

    @PostMapping("/generate")
    public ResponseEntity<?> generateKey(@RequestBody CreateKeyRequest request) {

        // checking if url is present or not
        if (request.getTargetUrl() == null || request.getTargetUrl().isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("error", "targetUrl is required"));
        }

        // Get current authenticated user
        UserEntity currentUser = (UserEntity) SecurityContextHolder.getContext().getAuthentication().getPrincipal();

        // generate a unique key
        String apiKey = "api_k" + UUID.randomUUID().toString().replace("-", "");

        // saving this key with url in database
        ApiKeyEntity apiKeyEntity = new ApiKeyEntity();
        apiKeyEntity.setUserId((long) currentUser.getId());
        apiKeyEntity.setApiKey(apiKey);
        apiKeyEntity.setTargetUrl(request.getTargetUrl());
        apiKeyEntity.setPlanName(request.getPlanName() != null ? request.getPlanName() : "FREE");
        apiKeyEntity.setEnabled(true);
        apiKeyEntity.setCreatedAt(Instant.now());

        apiKeyRepository.save(apiKeyEntity);

        return ResponseEntity.ok(Map.of("apiKey", apiKey, "targetUrl", request.getTargetUrl(), "plan",
                apiKeyEntity.getPlanName(), "message", "Save this key! It won't be shown again."));

    }

    @GetMapping("/list")
    public ResponseEntity<?> listKeys() {
        // Get current authenticated user
        UserEntity currentUser = (UserEntity) SecurityContextHolder.getContext().getAuthentication().getPrincipal();

        var keys = apiKeyRepository.findByUserId(currentUser.getId()).stream()
                .map(key -> Map.of(
                        "id", key.getId(),
                        "apiKey", maskKey(key.getApiKey()), // Show only last 8 chars
                        "targetUrl", key.getTargetUrl(),
                        "plan", key.getPlanName(),
                        "enabled", key.isEnabled(),
                        "createdAt", key.getCreatedAt()))
                .toList();
        return ResponseEntity.ok(keys);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteKey(@PathVariable Long id) {
        // Get current authenticated user
        UserEntity currentUser = (UserEntity) SecurityContextHolder.getContext().getAuthentication().getPrincipal();

        ApiKeyEntity key = apiKeyRepository.findById(id).orElse(null);

        // Security Check: Key exists AND belongs to this user
        if (key == null || !key.getUserId().equals(Long.valueOf(currentUser.getId()))) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of("message", "key not found or unauthorized"));
        }

        apiKeyRepository.delete(key);
        return ResponseEntity.ok(Map.of("message", "key deleted"));
    }

    @PatchMapping("/{id}/disable")
    public ResponseEntity<?> disableKey(@PathVariable Long id) {
        // Get current authenticated user
        UserEntity currentUser = (UserEntity) SecurityContextHolder.getContext().getAuthentication().getPrincipal();

        ApiKeyEntity key = apiKeyRepository.findById(id)
                .orElse(null);

        // Security Check: Key exists AND belongs to this user
        if (key == null || !key.getUserId().equals(Long.valueOf(currentUser.getId()))) {
            return ResponseEntity
                    .status(HttpStatus.FORBIDDEN)
                    .body(Map.of("message", "Key not found or unauthorized"));
        }

        key.setEnabled(false);
        apiKeyRepository.save(key);

        return ResponseEntity.ok(Map.of("message", "Key disabled"));
    }

    @PatchMapping("/{id}/enable")
    public ResponseEntity<?> enableKey(@PathVariable Long id) {
        UserEntity currentUser = (UserEntity) SecurityContextHolder.getContext().getAuthentication().getPrincipal();

        ApiKeyEntity key = apiKeyRepository.findById(id).orElse(null);

        if (key == null || !key.getUserId().equals(Long.valueOf(currentUser.getId()))) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of("message", "Key not found or unauthorized"));
        }

        key.setEnabled(true);
        apiKeyRepository.save(key);

        return ResponseEntity.ok(Map.of("message", "Key enabled"));
    }

    @PostMapping("/{id}/rotate")
    public ResponseEntity<?> rotateKey(@PathVariable Long id) {
        UserEntity currentUser = (UserEntity) SecurityContextHolder.getContext().getAuthentication().getPrincipal();

        ApiKeyEntity key = apiKeyRepository.findById(id).orElse(null);

        if (key == null || !key.getUserId().equals(Long.valueOf(currentUser.getId()))) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of("message", "Key not found or unauthorized"));
        }

        String newApiKey = "api_k" + UUID.randomUUID().toString().replace("-", "");
        key.setApiKey(newApiKey);
        key.setEnabled(true);
        apiKeyRepository.save(key);

        return ResponseEntity.ok(Map.of(
                "apiKey", newApiKey,
                "message", "Key rotated. Save this new key! It won't be shown again."));
    }

    private String maskKey(String key) {
        if (key.length() <= 8)
            return key;
        return "****" + key.substring(key.length() - 8);
    }

}
