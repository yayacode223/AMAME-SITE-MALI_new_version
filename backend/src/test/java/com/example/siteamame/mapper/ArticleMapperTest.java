package com.example.siteamame.mapper;

import com.example.siteamame.config.StorageProperties;
import com.example.siteamame.dto.article.ArticleDto;
import com.example.siteamame.model.Article;
import com.example.siteamame.service.file.MediaUrlResolver;
import org.junit.jupiter.api.Test;

import java.util.HashSet;
import java.util.Set;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Les tags de l'article sont copiés dans la transaction : Jackson ne doit jamais recevoir la
 * collection de l'entité, qui peut être un proxy non chargé (open-in-view désactivé).
 */
class ArticleMapperTest {

    private final ArticleMapper mapper = new ArticleMapper(new MediaUrlResolver(
            new StorageProperties("local", "", new StorageProperties.Local("uploads"),
                StorageProperties.Purge.disabled())));

    @Test
    void tagsAreCopiedNotShared() {
        Article article = new Article();
        article.setId(1L);
        Set<String> tags = new HashSet<>(Set.of("bourse", "mali"));
        article.setTags(tags);

        ArticleDto dto = mapper.convertToDTO(article);

        assertThat(dto.getTags()).containsExactlyInAnyOrder("bourse", "mali").isNotSameAs(tags);
    }

    @Test
    void anArticleWithoutTagsKeepsNull() {
        Article article = new Article();
        article.setId(2L);
        article.setTags(null);

        assertThat(mapper.convertToDTO(article).getTags()).isNull();
    }
}
