package com.example.siteamame.dto.article;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ArticleCreationRequest {
    @NotBlank(message = "Le titre est obligatoire")
    private String titre;

    @NotBlank(message = "Le contenu est obligatoire")
    private String contenu;

    @NotBlank(message = "L'auteur est obligatoire")
    private String auteur;

    @NotBlank(message = "La catégorie est obligatoire")
    private String categorie;

    private String filePath;
    private Integer tempsLecture;
    private List<String> tags;
    private String metaDescription;
    private String metaKeywords;
}