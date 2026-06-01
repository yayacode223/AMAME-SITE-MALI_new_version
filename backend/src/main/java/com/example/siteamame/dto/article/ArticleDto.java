package com.example.siteamame.dto.article;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Set;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ArticleDto {
    private Long id;
    private String titre;
    private String slug;
    private String contenu;
    private String auteur;
    private String categorie;
    private String filePath;
    private Integer vues;
    private Integer tempsLecture;
    private LocalDateTime datePublication;
    private LocalDateTime dateModification;
    private Set<String> tags;
    private String metaDescription;
    private String metaKeywords;
    private boolean estPublie;
}