package com.example.siteamame.enumeration;

import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public enum DomaineFiliereSerieType {

    SCIENCES_ET_TECHNOLOGIES("Sciences et Technologies"),
    LETTRES_ET_SCIENCES_HUMAINES("Lettres et Sciences Humaines"),
    SCIENCES_ECONOMIQUES_ET_GESTION("Sciences Économiques et Gestion"),
    ARTS_ET_COMMUNICATION("Arts et Communication"),
    SCIENCES_DE_LA_SANTE("Sciences de la Santé"),
    AGRONOMIE_ET_DEVELOPPEMENT_RURAL("Agronomie et Développement Rural"),
    DROIT_ET_SCIENCES_POLITIQUES("Droit et Sciences Politiques"),
    ALL("Tous les domaines");

    DomaineFiliereSerieType(String s) {
    }
}
