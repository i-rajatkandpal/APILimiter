package com.rajat.limiter.ratelimit.controller;

import com.rajat.limiter.ratelimit.model.RateLimitRequest;
import com.rajat.limiter.ratelimit.model.RateLimitResponse;
import com.rajat.limiter.ratelimit.service.RateLimiterService;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/ratelimit")
public class RateLimitControllerV1 {

    private final RateLimiterService service;

    public RateLimitControllerV1(RateLimiterService service) {
        this.service = service;
    }

    @PostMapping("/check")
    public RateLimitResponse check(@RequestBody RateLimitRequest request){
        return service.check(request);
    }

    @GetMapping("/test")
    public String test(){
        return "Working....";
    }

}