package com.example.siteamame.datainitializer;

import com.example.siteamame.enumeration.RoleType;
import com.example.siteamame.model.User;
import com.example.siteamame.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class UserDataInitializer implements CommandLineRunner {
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    @Override
    public void run(String... args) throws Exception {
        if(userRepository.count() == 0){
            User user = new User();
            user.setNom("Admin");
            user.setPrenom("Amame");
            user.setEmail("amameadmin@gmail.com");
            user.setPassword(passwordEncoder.encode("amameadmin123@"));
            user.setRole(RoleType.ADMIN);
            userRepository.save(user);

            System.out.println("Admin crée avec succès");
        }
    }
}
