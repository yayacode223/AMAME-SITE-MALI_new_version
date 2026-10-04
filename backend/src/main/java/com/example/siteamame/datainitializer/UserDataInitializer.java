package com.example.siteamame.datainitializer;

import com.example.siteamame.enumeration.RoleType;
import com.example.siteamame.model.User;
import com.example.siteamame.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class UserDataInitializer implements CommandLineRunner {
    private static final Logger log = LoggerFactory.getLogger(UserDataInitializer.class);

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Value("${app.bootstrap.admin-email:}")
    private String adminEmail;

    @Value("${app.bootstrap.admin-password:}")
    private String adminPassword;

    @Override
    public void run(String... args) throws Exception {
        // Aucun identifiant dans le code : sans les deux variables, rien n'est créé (cas normal en production)
        if (adminEmail.isBlank() || adminPassword.isBlank()) {
            return;
        }
        if(userRepository.count() == 0){
            User user = new User();
            user.setNom("Admin");
            user.setPrenom("Amame");
            user.setEmail(adminEmail.trim());
            user.setPassword(passwordEncoder.encode(adminPassword));
            user.setRole(RoleType.ADMIN);
            userRepository.save(user);

            log.info("Premier administrateur créé : {}. Retirer BOOTSTRAP_ADMIN_PASSWORD de l'environnement.", adminEmail.trim());
        }
    }
}
