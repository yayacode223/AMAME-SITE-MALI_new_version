package com.example.siteamame.mapper;

import com.example.siteamame.dto.article.ArticleDto;
import com.example.siteamame.dto.article.ArticleSummaryDto;
import com.example.siteamame.model.Article;
import lombok.AllArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Set;

@AllArgsConstructor
@Component
public class ArticleMapper {

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
                article.getVues(),
                article.getTempsLecture(),
                article.getDatePublication(),
                resume
        );
    }

    public ArticleDto convertToDTO(Article article) {

        String filePath = article.getFile()!= null
                ? article.getFile().getFilePath()
                : null;
        Set<String> tags = article.getTags()!= null
                ? article.getTags()
                : null;

        return new ArticleDto(
                article.getId(),
                article.getTitre(),
                article.getSlug(),
                article.getContenu(),
                article.getAuteur(),
                article.getCategorie(),
                filePath,
                article.getVues(),
                article.getTempsLecture(),
                article.getDatePublication(),
                article.getDateModification(),
                tags,
                article.getMetaDescription(),
                article.getMetaKeywords()
        );
    }

}
