package com.rajat.limiter.gateway.controller;

import com.rajat.limiter.common.exception.InvalidApiKeyException;
import com.rajat.limiter.common.exception.RateLimitExceededException;
import com.rajat.limiter.gateway.service.ApiKeyService;
import com.rajat.limiter.gateway.service.PlanConfig;
import com.rajat.limiter.ratelimit.model.RateLimitRequest;
import com.rajat.limiter.ratelimit.model.RateLimitResponse;
import com.rajat.limiter.ratelimit.service.RateLimiterService;
import jakarta.servlet.http.HttpServletRequest;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.RestTemplate;

@RestController
@RequestMapping("/gateway")
public class GatewayController {

    private static final Logger log = LoggerFactory.getLogger(GatewayController.class);

    private final RestTemplate restTemplate;
    private final RateLimiterService rateLimiterService;
    private final ApiKeyService apiKeyService;

    public GatewayController(RestTemplate restTemplate, RateLimiterService rateLimiterService,
            ApiKeyService apiKeyService) {
        this.restTemplate = restTemplate;
        this.rateLimiterService = rateLimiterService;
        this.apiKeyService = apiKeyService;
    }

    @RequestMapping(value = "/**")
    public ResponseEntity<String> proxyRequest(
            HttpServletRequest request,
            @RequestHeader("X-API-Key") String apiKey,
            @RequestBody(required = false) String body) {

        // validate the api-key
        if (!apiKeyService.isValid(apiKey)) {
            throw new InvalidApiKeyException("Invalid or disabled API key");
        }

        String targetUrl = apiKeyService.getTargetUrl(apiKey);
        PlanConfig plan = apiKeyService.getPlanConfig(apiKey);

        // rate limit check
        RateLimitRequest rateLimitRequest = new RateLimitRequest();
        rateLimitRequest.setKey(apiKey);
        rateLimitRequest.setLimit(plan.getLimit());
        rateLimitRequest.setAlgorithm(plan.getRateLimitAlgorithm());
        rateLimitRequest.setWindowSeconds(plan.getWindowSeconds());

        RateLimitResponse rateLimitResponse = rateLimiterService.check(rateLimitRequest);

        if (!rateLimitResponse.isAllowed()) {
            throw new RateLimitExceededException(
                    "Rate limit exceeded. Try again later.",
                    rateLimitResponse.getResetAt());
        }

        // build the full target URL
        String path = request.getRequestURI().replace("/gateway", "");
        String query = request.getQueryString() != null ? "?" + request.getQueryString() : "";
        String fullUrl = targetUrl + path + query;

        // forward headers (except internal ones)
        HttpHeaders headers = new HttpHeaders();
        request.getHeaderNames().asIterator().forEachRemaining(headerName -> {
            if (!headerName.equalsIgnoreCase("X-API-Key")
                    && !headerName.equalsIgnoreCase("Accept-Encoding")) {
                headers.add(headerName, request.getHeader(headerName));
            }
        });

        HttpEntity<String> entity = new HttpEntity<>(body, headers);

        log.debug("[GATEWAY] key={} method={} url={}", apiKey, request.getMethod(), fullUrl);

        ResponseEntity<String> response = restTemplate.exchange(
                fullUrl,
                HttpMethod.valueOf(request.getMethod()),
                entity,
                String.class);

        // return proxied response with rate-limit headers
        return ResponseEntity.status(response.getStatusCode())
                .header("X-RateLimit-Limit", String.valueOf(plan.getLimit()))
                .header("X-RateLimit-Remaining", String.valueOf(rateLimitResponse.getRemaining()))
                .header("X-RateLimit-Reset", String.valueOf(rateLimitResponse.getResetAt()))
                .body(response.getBody());
    }
}
