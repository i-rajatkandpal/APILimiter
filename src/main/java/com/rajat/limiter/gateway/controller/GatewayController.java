package com.rajat.limiter.gateway.controller;

import com.rajat.limiter.gateway.service.ApiKeyService;
import com.rajat.limiter.gateway.service.PlanConfig;
import com.rajat.limiter.ratelimit.model.RateLimitRequest;
import com.rajat.limiter.ratelimit.model.RateLimitResponse;
import com.rajat.limiter.ratelimit.service.RateLimiterService;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.RestTemplate;

import javax.swing.text.html.parser.Entity;

@RestController
@RequestMapping("/gateway")
public class GatewayController {
    private final RestTemplate restTemplate;
    private final RateLimiterService rateLimiterService;
    private final ApiKeyService apiKeyService;

    public GatewayController(RestTemplate restTemplate, RateLimiterService rateLimiterService, ApiKeyService apiKeyService) {
        this.restTemplate = restTemplate;
        this.rateLimiterService = rateLimiterService;
        this.apiKeyService = apiKeyService;
    }

    @RequestMapping(value = "/**")
    public ResponseEntity<String> proxyRequest(
            HttpServletRequest request,
            @RequestHeader("X-API-Key") String apiKey,
            @RequestBody(required = false) String body){

        //check if the api-key is valid if yes get url and plan
        if(!apiKeyService.isValid(apiKey)){
            return ResponseEntity.status(401).body("{\"error\":\"Invalid API Key\"}");
        }

        String targetUrl = apiKeyService.getTargetUrl(apiKey);
        PlanConfig plan  = apiKeyService.getPlanConfig(apiKey);

        //rate limit check
        RateLimitRequest rateLimitRequest = new RateLimitRequest();
        rateLimitRequest.setKey(apiKey);
        rateLimitRequest.setLimit(plan.getLimit());
        rateLimitRequest.setAlgorithm(plan.getRateLimitAlgorithm());
        rateLimitRequest.setWindowSeconds(plan.getWindowSeconds());

        RateLimitResponse rateLimitResponse = rateLimiterService.check(rateLimitRequest);

        if(!rateLimitResponse.isAllowed()){
            return ResponseEntity.status(429)
                    .header("X-RateLimit-Remaining", "0")
                    .body("{\"error\":\"Rate limit exceeded\"}");
        }

        // building the full target URL
        String path = request.getRequestURI().replace("/gateway", "");
        String query = request.getQueryString() != null ? "?" + request.getQueryString() : "";

        String fullUrl = targetUrl + path + query;


        HttpHeaders headers = new HttpHeaders();
        request.getHeaderNames().asIterator().forEachRemaining(headerName -> {
            if (!headerName.equalsIgnoreCase("X-API-Key")) {
                headers.add(headerName, request.getHeader(headerName));
            }
        });

        HttpEntity<String> entity = new HttpEntity<>(body, headers);

        //log to check
        System.out.println(
                "[GATEWAY] key=" + apiKey +
                        " method=" + request.getMethod() +
                        " url=" + fullUrl +
                        " time=" + System.currentTimeMillis()
        );


        ResponseEntity<String> response = restTemplate.exchange(
                fullUrl,
                HttpMethod.valueOf(request.getMethod()),
                entity,
                String.class
        );

        return ResponseEntity.status(response.getStatusCode()).body(response.getBody());

    }

}
