package com.example.siteamame.model;

import com.example.siteamame.enumeration.NiveauType;
import com.example.siteamame.enumeration.StatusType;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.Date;

@AllArgsConstructor
@NoArgsConstructor
@Entity
@Table(name = "opportunites")
public class Opportunites {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(columnDefinition = "TEXT")
    private String titre;

    @Column(columnDefinition = "TEXT")
    private String descriptionComplete;

    @Column(columnDefinition = "TEXT")
    private String urlSource;

    @Column(columnDefinition = "TEXT")
    private String urlPdf1;

    @Column(columnDefinition = "TEXT")
    private String urlPdf2;

    private String sourceSite;

    private Integer anneePertinence;

    private String paysOffrant;
    private String urlDrapeau;
    @Enumerated(EnumType.STRING)
    private NiveauType niveau;
    @Enumerated(EnumType.STRING)
    private StatusType status;
    private Boolean isAvalable;
    private LocalDateTime dateLimite;

    @Temporal(TemporalType.TIMESTAMP)
    private Date dateScraping;

}