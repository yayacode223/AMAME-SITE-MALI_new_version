package com.example.siteamame.service;

import com.example.siteamame.dto.LoginReqDto;
import com.example.siteamame.dto.UserResDto;
import com.example.siteamame.exception.concours.RessourceNotFoundException;
import com.example.siteamame.exception.user.PasswordNotMatchException;
import com.example.siteamame.exception.user.UserNotFoundException;
import com.example.siteamame.mapper.UserMapperDto;
import com.example.siteamame.model.User;
import com.example.siteamame.repository.UserRepo;
import com.example.siteamame.security.JwtUtil;
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
public class AuthService {

    private final UserRepo userRepo;
    private final JwtUtil jwtUtil;
    private final PasswordEncoder passwordEncoder;
    private final UserMapperDto userMapperDto;

    // Login User
    public UserResDto login(LoginReqDto loginRequest, HttpServletResponse response) {

        Optional<User> userOptional = userRepo.findByEmailIgnoreCase(loginRequest.getEmail());

        if (userOptional.isEmpty()) {
            throw new UserNotFoundException("User doesn't exist");
        }

        User user = userOptional.get();

        if (!passwordEncoder.matches(loginRequest.getPassword(), user.getPassword())) {
            throw new PasswordNotMatchException("Invalid password.");
        }

        String token = jwtUtil.generateToken(user.getEmail(), user.getRole());

        // Créer cookie
        ResponseCookie cookie = ResponseCookie.from("token", token)
                .httpOnly(true)
                .secure(false) // false pour le dev en HTTP, true pour la prod en HTTPS
                .path("/")
                .maxAge(30 * 24 * 60 * 60) // en secondes
                .sameSite("Lax") // <-- LA LIGNE MAGIQUE !
                .build();

        response.addHeader("Set-Cookie", cookie.toString());

        return userMapperDto.UserToDto(user);
    }

    // Get Current User
    public UserResDto getCurrentUser(Authentication authentication) {

        User user = userRepo.findByEmailIgnoreCase(authentication.getName())
                .orElseThrow(() -> new RessourceNotFoundException("L'utilsateur n'existe pas"));
        return userMapperDto.UserToDto(user);
    }

    // Logout User
    public String logout(HttpServletRequest request, HttpServletResponse response) {
        //String token = getTokenFromRequest(request);

        // On crée un cookie avec le MÊME NOM que celui du login
    ResponseCookie cookie = ResponseCookie.from("token", "") // Valeur vide
            .httpOnly(true)
            .secure(false) // Doit correspondre à la config du cookie de login
            .path("/")
            .maxAge(0) // Expire immédiatement
            .sameSite("Lax")
            .build();
    
    response.addHeader("Set-Cookie", cookie.toString());
    
    return "Deconnexion reussie";
    }

    // private String getTokenFromRequest(HttpServletRequest request) {
    //     Cookie[] cookies = request.getCookies();
    //     if (cookies != null) {
    //         for (Cookie cookie : cookies) {
    //             if ("token".equals(cookie.getName())) {
    //                 return cookie.getValue();
    //             }
    //         }
    //     }

    //     String header = request.getHeader("Authorization");
    //     if (header != null && header.startsWith("Bearer ")) {
    //         return header.substring(7);
    //     }

    //     return null;
    // }
}
