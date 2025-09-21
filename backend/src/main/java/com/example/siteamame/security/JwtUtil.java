package com.example.siteamame.security;

import com.example.siteamame.model.enumeration.RoleType;
import io.jsonwebtoken.*;
import java.util.Date;

import io.jsonwebtoken.security.Keys;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

@Component
public class JwtUtil {

    // Clé secrète pour la signature du JWT (devrait être stockée de manière sécurisée)
    private final String secretKey;

    // Durée de validité du token (30 jours ici)
    private final long expirationTime;

    public JwtUtil(@Value("${jwt.secret}")String secretKey, @Value("${jwt.expiration}")long expirationTime) {
        this.secretKey = secretKey;
        this.expirationTime = expirationTime;
    }

    // Génération du JWT
    public String generateToken(String email, RoleType role) {
        return Jwts.builder()
                .setSubject(email) // Mettre l'email de l'utilisateur dans le token
                .claim("roles",role) // Mettre le role de l'utilisateur dans le token
                .setIssuedAt(new Date()) // Date de création du token
                .setExpiration(new Date(System.currentTimeMillis() + expirationTime)) // Date d'expiration
                .signWith(Keys.hmacShaKeyFor(secretKey.getBytes())) // Signature avec clé secrète
                .compact();
    }

    // Extraire le nom d'utilisateur (email) du token JWT
    public String extractUsername(String token) {
        return Jwts.parserBuilder()
                .setSigningKey(Keys.hmacShaKeyFor(secretKey.getBytes())) // Clé pour valider la signature
                .build()
                .parseClaimsJws(token)
                .getBody()
                .getSubject();
    }

    // Vérifier si le token est expiré
    public boolean isTokenExpired(String token) {
        return extractExpiration(token).before(new Date());
    }

    // Extraire la date d'expiration du token
    public Date extractExpiration(String token) {
        return Jwts.parserBuilder()
                .setSigningKey(Keys.hmacShaKeyFor(secretKey.getBytes())) // Clé pour valider la signature
                .build()
                .parseClaimsJws(token)
                .getBody()
                .getExpiration();
    }

    // Valider le token
    public boolean validateToken(String token, String username) {
        return (username.equals(extractUsername(token)) && !isTokenExpired(token));
    }
}

