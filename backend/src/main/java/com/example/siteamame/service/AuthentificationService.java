package com.example.siteamame.service;

import com.example.siteamame.dto.authentification.LoginRequestDto;
import com.example.siteamame.dto.user.UserReponseDto;
import com.example.siteamame.exception.concours.RessourceNotFoundException;
import com.example.siteamame.exception.user.PasswordNotMatchException;
import com.example.siteamame.exception.user.UserNotFoundException;
import com.example.siteamame.mapper.UserMapperDto;
import com.example.siteamame.model.User;
import com.example.siteamame.repository.UserRepository;
import com.example.siteamame.security.jwt.JwtUtil;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.AllArgsConstructor;

import org.springframework.http.ResponseCookie;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.Optional;

@AllArgsConstructor
@Service
public class AuthentificationService {

    private final UserRepository userRepository;
    private final JwtUtil jwtUtil;
    private final PasswordEncoder passwordEncoder;
    private final UserMapperDto userMapperDto;

    // Login User
    public UserReponseDto login(LoginRequestDto loginRequest, HttpServletResponse response) {

        Optional<User> userOptional = userRepository.findByEmailIgnoreCase(loginRequest.getEmail());

        if (userOptional.isEmpty()) {
            throw new RuntimeException("User doesn't exist");
        }

        User user = userOptional.get();

        if (!passwordEncoder.matches(loginRequest.getPassword(), user.getPassword())) {
            throw new RuntimeException("Invalid password.");
        }

        String token = jwtUtil.generateToken(user.getEmail(), user.getRole());

        // Créer cookie
        ResponseCookie cookie = ResponseCookie.from("token", token)
                .domain(".amame.ml")
                .httpOnly(true)
                .secure(true) // false pour le dev en HTTP, true pour la prod en HTTPS
                .path("/")
                .maxAge(30 * 24 * 60 * 60) // en secondes
                .sameSite("Strict")
                .build();

        response.addHeader("Set-Cookie", cookie.toString());

        return userMapperDto.UserToDto(user);
    }

    // Get Current User
    public UserReponseDto getCurrentUser(Authentication authentication) {

        User user = userRepository.findByEmailIgnoreCase(authentication.getName())
                .orElseThrow(() -> new RuntimeException("L'utilisateur n'existe pas"));
        return userMapperDto.UserToDto(user);
    }

    // Logout User
    public String logout(HttpServletRequest request, HttpServletResponse response) {
        ResponseCookie cookie = ResponseCookie.from("token", "") // Valeur vide
                .domain(".amame.ml")
                .httpOnly(true)
                .secure(true) // Doit correspondre à la config du cookie de login
                .path("/")
                .maxAge(0) // Expire immédiatement
                .sameSite("Strict")
                .build();

        response.addHeader("Set-Cookie", cookie.toString());

        return "Deconnexion reussie";
    }

}
