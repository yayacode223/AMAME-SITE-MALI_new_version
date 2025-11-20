package com.example.siteamame.repository;


import com.example.siteamame.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByEmailIgnoreCase(String email);

//    private Long id;
//    private String nom;
//    private String prenom;
//    private String email;
//    private LocalDate birthDate;
//    private String ville;
//    @Enumerated(EnumType.STRING)
//    private SexeType sexe;
//    private String adresse;
//    private String imagePath;
//    private String phone;
//    private String cvPath;
//    @Enumerated(EnumType.STRING)
//    private RoleType role;
//    private String pays;
//    @Enumerated(EnumType.STRING)
//    private NiveauType niveauEtude;
//    private Integer codePostal;

    @Query("SELECT new com.example.siteamame.dto.user.UserReponseDto("+
            "u.id, "+
            "u.nom, "+
            "u.prenom, "+
            "u.email, "+
            "u.birthDate, "+
            "u.ville, "+
            "u.sexe, "+
            "u.adresse, "+
            "u.file.fileName"

    )
}
