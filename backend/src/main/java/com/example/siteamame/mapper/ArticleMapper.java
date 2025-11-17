package com.example.siteamame.mapper;

import com.example.siteamame.dto.article.ArticleDto;
import com.example.siteamame.dto.article.ArticleSummaryDto;
import com.example.siteamame.model.Article;
import lombok.AllArgsConstructor;
import org.springframework.stereotype.Component;

@AllArgsConstructor
@Component
public class ArticleMapper {

    public ArticleSummaryDto convertToSummaryDTO(Article article) {
        String resume = article.getContenu().length() > 150
                ? article.getContenu().substring(0, 150) + "..."
                : article.getContenu();

        return new ArticleSummaryDto(
                article.getId(),
                article.getTitre(),
                article.getSlug(),
                article.getAuteur(),
                article.getCategorie(),
                article.getImageUrl(),
                article.getVues(),
                article.getTempsLecture(),
                article.getDatePublication(),
                resume
        );
    }

    public ArticleDto convertToDTO(Article article) {
        return new ArticleDto(
                article.getId(),
                article.getTitre(),
                article.getSlug(),
                article.getContenu(),
                article.getAuteur(),
                article.getCategorie(),
                article.getImageUrl(),
//                article.getFile().getFilePath(),
                article.getVues(),
                article.getTempsLecture(),
                article.getDatePublication(),
                article.getDateModification(),
                article.getTags(),
                article.getMetaDescription(),
                article.getMetaKeywords()
        );
    }

}
