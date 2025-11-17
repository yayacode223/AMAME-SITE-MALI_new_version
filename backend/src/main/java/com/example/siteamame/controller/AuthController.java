package com.example.siteamame.controller;

import com.example.siteamame.dto.authentification.LoginRequestDto;
import com.example.siteamame.dto.user.UserReponseDto;
import com.example.siteamame.service.AuthentificationService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import lombok.AllArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
@AllArgsConstructor
@RestController
@RequestMapping("/api")
public class AuthController {
    private final AuthentificationService user;

    @PostMapping("/auth/login")
    public ResponseEntity<UserReponseDto> loginUser(@Valid @RequestBody LoginRequestDto loginReq, HttpServletResponse res) {
        return new ResponseEntity<>(user.login(loginReq, res), HttpStatus.OK);
    }

    @GetMapping("/auth/me")
    public ResponseEntity<UserReponseDto> getUserProfil(Authentication authentication) {
        return new ResponseEntity<>(user.getCurrentUser(authentication), HttpStatus.OK);
    }

    @PostMapping("/auth/logout")
    public ResponseEntity<String> logoutUser(HttpServletRequest req, HttpServletResponse res) {
      return new ResponseEntity<>(user.logout(req, res), HttpStatus.OK);
    }
}
