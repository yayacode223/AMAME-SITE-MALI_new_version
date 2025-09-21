package com.example.siteamame.controller;

import com.example.siteamame.dto.UserReqDto;
import com.example.siteamame.dto.UserResDto;
import com.example.siteamame.service.UserService;
import jakarta.validation.Valid;
import lombok.AllArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;

@AllArgsConstructor
@RestController
@RequestMapping("/api/user")
public class UserController {
    private final UserService userSer;
    @GetMapping()
    public ResponseEntity<List<UserResDto>> getAllUsers(){
        return new ResponseEntity<>(userSer.getAllUser(), HttpStatus.OK);
    }

    @PostMapping("/register")
    public ResponseEntity<UserResDto> register(
            @Valid @RequestPart(value = "user") UserReqDto userReq,
            @RequestPart(value = "cv", required = false) MultipartFile cv,
            @RequestPart(value = "image", required = false) MultipartFile image
    ) throws IOException {
        return new ResponseEntity<>(userSer.register(userReq, cv, image), HttpStatus.CREATED);
    }
}
