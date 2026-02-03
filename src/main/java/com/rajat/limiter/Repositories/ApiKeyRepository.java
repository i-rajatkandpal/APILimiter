package com.rajat.limiter.Repositories;

import com.rajat.limiter.Entity.ApiKeyEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ApiKeyRepository extends JpaRepository<ApiKeyEntity, Long> {

    Optional<ApiKeyEntity> findByApiKey(String apiKey);
    List<ApiKeyEntity> findByUserId(Long userId);
}
