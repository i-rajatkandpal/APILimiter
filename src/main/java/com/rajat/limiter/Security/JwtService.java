package com.rajat.limiter.Security;

import com.rajat.limiter.Entity.UserEntity;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.time.Instant;
import java.util.Date;

@Service
public class JwtService {

    @Value("${jwt.secret}")
    private String secret;

    @Value("${jwt.expiration-ms}")
    private long expirationMs;

    private SecretKey getSigningKey(){
        byte[] keyBytes = Decoders.BASE64.decode(secret);
        return Keys.hmacShaKeyFor(keyBytes);
    }

    public String generateToken(UserEntity user){
        Instant now = Instant.now();
        Instant expiry = now.plusMillis(expirationMs);

        return Jwts.builder()
                .subject(user.getEmail())
                .claim("userId",user.getId())
                .issuedAt(Date.from(now))
                .expiration(Date.from(now.plusMillis(expirationMs)))
                .signWith(getSigningKey())
                .compact();
    }

    public String extractEmail(String token){
        return getClaims(token).getSubject();
    }

    public Long extractUserId(String token){
        Claims claims = getClaims(token);
        return claims.get("userId", Long.class);
    }

    public boolean isTokenValid(String token) {
        try {
            Date expiration = getClaims(token).getExpiration();
            return expiration != null && expiration.after(new Date());
        } catch (Exception e) {
            return false;
        }
    }

    private Claims getClaims(String token){
        return Jwts.parser()
                .verifyWith(getSigningKey())
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }

}
