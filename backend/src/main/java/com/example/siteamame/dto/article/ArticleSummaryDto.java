package com.example.siteamame.dto.article;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ArticleSummaryDto {
    private Long id;
    private String titre;
    private String slug;
    private String auteur;
    private String categorie;
    private String imageUrl;
    private Integer vues;
    private Integer tempsLecture;
    private LocalDateTime datePublication;
    private String resume;
}