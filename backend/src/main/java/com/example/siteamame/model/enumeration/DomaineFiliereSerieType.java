package com.example.siteamame.model.enumeration;

import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public enum DomaineFiliereSerieType {

    SCIENTIFIQUE("Scientifique"),
    LITTERAIRE("Littéraire"),
    ECONOMIE_GESTION("Économie et Gestion"),
    INGENIERIE_TECHNIQUE("Ingénierie et Technique"),
    SANTE_PARAMEDICAL("Santé et Paramédical"),
    AGRONOMIE_DEVELOPPEMENT("Agronomie et Développement Rural"),
    DROIT_SCIENCES_SOCIALES("Droit et Sciences Sociales"),
    INFORMATIQUE_NUMERIQUE("Informatique et Numérique"),
    AUTRES("autre domaines");

    private final String label; //  Le label
}
