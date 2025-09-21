package com.example.siteamame.model;

import com.example.siteamame.model.enumeration.ContinentType;
import com.example.siteamame.model.enumeration.SexeType;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Entity
@Table(name="critere")
@AllArgsConstructor

public class Critere {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "description_critere")
    private String description;

    @Column(name = "age_critere")
    private Integer age;

    @Column(name = "pays_critere")
    private String pays;

    @Column(name = "continent_critere")
    @Enumerated(EnumType.STRING)
    private ContinentType continent;

    @Column(name = "sexe_critere")
    @Enumerated(EnumType.STRING)
    private SexeType sexe;

    @Column(name = "allocation_finanaciere_critere")
    private Integer allocationFinanciere;
}

