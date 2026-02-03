package com.rajat.limiter.Security.controller;

import com.rajat.limiter.Entity.UserEntity;
import com.rajat.limiter.Repositories.UserRepository;
import com.rajat.limiter.Security.JwtService;
import com.rajat.limiter.Security.model.AuthRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/auth")
public class AuthController {


    private final UserRepository userRepository;
    private final BCryptPasswordEncoder bCryptPasswordEncoder;
    private final JwtService jwtService;

    public AuthController(UserRepository userRepository, BCryptPasswordEncoder bCryptPasswordEncoder, JwtService jwtService) {
        this.userRepository = userRepository;
        this.bCryptPasswordEncoder = bCryptPasswordEncoder;
        this.jwtService = jwtService;
    }

    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody AuthRequest authRequest){
        String email = authRequest.getEmail();
        String password = authRequest.getPassword();
        if(userRepository.existsByEmail(email)){
           return ResponseEntity.status(409).body(Map.of("error","user already exists"));
        }
        UserEntity userEntity = new UserEntity();
        userEntity.setEmail(email);
        userEntity.setPassword(bCryptPasswordEncoder.encode(password));

        userRepository.save(userEntity);
        return ResponseEntity.ok(Map.of("msg" , "user created successfully"));
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody AuthRequest authRequest){

        UserEntity userEntity = userRepository.findByEmail(authRequest.getEmail()).orElse(null);
        if(userEntity == null || !bCryptPasswordEncoder.matches(authRequest.getPassword(), userEntity.getPassword())){
            return ResponseEntity.status(401).body(Map.of("error", "wrong credentials"));
        }

        String token = jwtService.generateToken(userEntity);
        return ResponseEntity.ok().body(Map.of(
                "token", token ,
                "type", "bearer"
        ));
    }

}
