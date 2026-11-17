package com.example.siteamame.mapper;

import com.example.siteamame.dto.article.ArticleDto;
import com.example.siteamame.dto.article.ArticleSummaryDto;
import com.example.siteamame.model.Article;
import com.example.siteamame.service.file.MediaUrlResolver;
import lombok.AllArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.HashSet;
import java.util.List;
import java.util.Set;

@AllArgsConstructor
@Component
public class ArticleMapper {

    private final MediaUrlResolver mediaUrlResolver;

    public ArticleSummaryDto convertToSummaryDTO(Article article) {
        String resume = article.getContenu() != null && article.getContenu().length() > 150
                ? article.getContenu().substring(0, 150) + "..."
                : article.getContenu();

        String filePath = article.getFile()!= null
                ? article.getFile().getFilePath()
                : null;

        return new ArticleSummaryDto(
                article.getId(),
                article.getTitre(),
                article.getSlug(),
                article.getAuteur(),
                article.getCategorie(),
                filePath,
                mediaUrlResolver.urlOf(article.getFile()),
                article.getVues(),
                article.getTempsLecture(),
                article.getDatePublication(),
                resume,
                Boolean.TRUE.equals(article.getEstPublie())
        );
    }

    public ArticleDto convertToDTO(Article article) {

        String filePath = article.getFile()!= null
                ? article.getFile().getFilePath()
                : null;
        // Copie, lue ici, dans la transaction de l'appelant : la collection de l'entité peut être un
        // proxy non chargé, que Jackson lirait après la fermeture de la session (open-in-view est
        // désactivé). Cas d'une modification d'article envoyée sans « tags » : 500 après l'enregistrement.
        Set<String> tags = article.getTags()!= null
                ? new HashSet<>(article.getTags())
                : null;

        return new ArticleDto(
                article.getId(),
                article.getTitre(),
                article.getSlug(),
                article.getContenu(),
                article.getAuteur(),
                article.getCategorie(),
                filePath,
                mediaUrlResolver.urlOf(article.getFile()),
                article.getVues(),
                article.getTempsLecture(),
                article.getDatePublication(),
                article.getDateModification(),
                tags,
                article.getMetaDescription(),
                article.getMetaKeywords(),
                Boolean.TRUE.equals(article.getEstPublie())
        );
    }

}
