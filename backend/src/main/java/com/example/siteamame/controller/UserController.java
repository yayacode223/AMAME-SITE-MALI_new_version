package com.example.siteamame.controller;

import com.example.siteamame.dto.user.UserRequestDto;
import com.example.siteamame.dto.user.UserReponseDto;
import com.example.siteamame.service.user.UserService;
import jakarta.validation.Valid;
import lombok.AllArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;

@AllArgsConstructor
@RestController
@RequestMapping("/api")
public class UserController {
    private final UserService userService;

    //Get All Users
    @GetMapping("/admin/users")
    public ResponseEntity<List<UserReponseDto>> getAllUsers(){
        return new ResponseEntity<>(userService.getAllUser(), HttpStatus.OK);
    }

    //Get User by Id
    @GetMapping("/user/{id}")
    public ResponseEntity<UserReponseDto> getUserById(@PathVariable Long id){
        return ResponseEntity.ok(userService.getUserById(id));
    }

    //Create User
    @PostMapping("/visitor/register")
    public ResponseEntity<UserReponseDto> register(
            @Valid @RequestPart(value = "user") UserRequestDto requestDto,
            @RequestPart(value ="cv", required = false) MultipartFile cv,
            @RequestPart(value ="image", required = false) MultipartFile image
    ) throws IOException {
        return new ResponseEntity<>(userService.register(requestDto, cv, image), HttpStatus.CREATED);
    }

    @PutMapping("/user/update/{id}")
    public ResponseEntity<UserReponseDto> update(
            @PathVariable Long id,
            @RequestPart("user") @Valid UserRequestDto requestDto,
            @RequestPart(value="cv", required = false) MultipartFile cv,
            @RequestPart(value="image", required = false) MultipartFile image
    ) throws IOException {
        return ResponseEntity.ok(userService.update(id, requestDto, cv, image ));
    }

    @DeleteMapping("/admin/user/{id}")
    public ResponseEntity<Void> deleteUser(@PathVariable Long id){
        userService.deleteUser(id);
        return ResponseEntity.noContent().build();
    }
}
