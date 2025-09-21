package com.example.siteamame.controller;

import com.example.siteamame.dto.LoginReqDto;
import com.example.siteamame.dto.UserResDto;
import com.example.siteamame.service.AuthService;
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
@RequestMapping("/api/auth")
public class AuthController {
    private final AuthService user;

    @PostMapping("/login")
    public ResponseEntity<UserResDto> loginUser(@Valid @RequestBody LoginReqDto loginReq, HttpServletResponse res) {
        return new ResponseEntity<>(user.login(loginReq, res), HttpStatus.OK);
    }

    @GetMapping("/me")
    public ResponseEntity<UserResDto> getUserProfil(Authentication authentication) {
        return new ResponseEntity<>(user.getCurrentUser(authentication), HttpStatus.OK);
    }

    @PostMapping("/logout")
    public ResponseEntity<String> logoutUser(HttpServletRequest req, HttpServletResponse res) {
      return new ResponseEntity<>(user.logout(req, res), HttpStatus.OK);
    }
}
