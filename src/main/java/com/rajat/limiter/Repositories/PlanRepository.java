package com.rajat.limiter.Repositories;

import com.rajat.limiter.Entity.PlanEntity;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PlanRepository
        extends JpaRepository<PlanEntity, String> {
}
