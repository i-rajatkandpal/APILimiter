package com.rajat.limiter.config;

import com.rajat.limiter.Entity.PlanEntity;
import com.rajat.limiter.Repositories.PlanRepository;
import com.rajat.limiter.ratelimit.model.RateLimitAlgorithm;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

@Component
public class DataInitializer implements CommandLineRunner {
    private final PlanRepository planRepository;

    public DataInitializer(PlanRepository planRepository) {
        this.planRepository = planRepository;
    }

    @Override
    public void run(String... args){
        if(!planRepository.existsById("FREE")){
            PlanEntity free = new PlanEntity();
            free.setPlanName("FREE");
            free.setRateLimit(10);
            free.setWindowSeconds(60);
            free.setAlgorithm(RateLimitAlgorithm.TOKEN_BUCKET);
            planRepository.save(free);
        }

        if(!planRepository.existsById("PREMIUM")){
            PlanEntity premium = new PlanEntity();
            premium.setPlanName("PREMIUM");
            premium.setRateLimit(100);
            premium.setWindowSeconds(60);
            premium.setAlgorithm(RateLimitAlgorithm.SLIDING_WINDOW);
            planRepository.save(premium);
        }

        System.out.println("Plans initialized.");
    }

}
