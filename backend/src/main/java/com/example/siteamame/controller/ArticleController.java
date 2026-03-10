package com.example.siteamame.controller;

import com.example.siteamame.dto.article.ArticleCreationRequest;
import com.example.siteamame.dto.article.ArticleDto;
import com.example.siteamame.dto.article.ArticleSearchingRequest;
import com.example.siteamame.dto.article.ArticleSummaryDto;
import com.example.siteamame.service.ArticleService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor

public class ArticleController {

    private final ArticleService articleService;

    @Transactional
    @GetMapping("/visitor/articles")
    public ResponseEntity<List<ArticleSummaryDto>> getAllArticles() {
        return ResponseEntity.ok(articleService.getAllArticles());
    }

    @Transactional
    @GetMapping("/visitor/articles/{id}")
    public ResponseEntity<ArticleDto> getArticleById(@PathVariable Long id) {
        return ResponseEntity.ok(articleService.getArticleById(id));
    }

    @Transactional
    @GetMapping("/visitor/articles/slug/{slug}")
    public ResponseEntity<ArticleDto> getArticleBySlug(@PathVariable String slug) {
        return ResponseEntity.ok(articleService.getArticleBySlug(slug));
    }

    @Transactional
    @GetMapping("/visitor/articles/search")
    public ResponseEntity<List<ArticleSummaryDto>> searchArticles(
            @RequestParam(required = false) String search,
            @RequestParam(required = false, defaultValue = "all") String categorie,
            @RequestParam(required = false, defaultValue = "newest") String sortBy) {

        ArticleSearchingRequest request = new ArticleSearchingRequest(search, categorie, sortBy, true);
        return ResponseEntity.ok(articleService.searchArticles(request));
    }

    @Transactional
    @GetMapping("/visitor/articles/popular")
    public ResponseEntity<List<ArticleSummaryDto>> getPopularArticles() {
        return ResponseEntity.ok(articleService.getPopularArticles());
    }

    @Transactional
    @GetMapping("/visitor/articles/categorie/{categorie}")
    public ResponseEntity<List<ArticleSummaryDto>> getArticlesByCategorie(
            @PathVariable String categorie) {
        return ResponseEntity.ok(articleService.getArticlesByCategorie(categorie));
    }

    @GetMapping("/visitor/articles/{id}/similar")
    public ResponseEntity<List<ArticleSummaryDto>> getSimilarArticles(
            @PathVariable Long id,
            @RequestParam String categorie) {
        return ResponseEntity.ok(articleService.getSimilarArticles(id, categorie));
    }

    @Transactional
    @GetMapping("/visitor/articles/categories")
    public ResponseEntity<Map<String, Long>> getCategoriesWithCount() {
        List<String> categories = articleService.getCategoriesWithCount();
        Map<String, Long> categoriesWithCount = categories.stream()
                .collect(Collectors.toMap(
                        categorie -> categorie,
                        articleService::getArticleCountByCategorie
                ));
        return ResponseEntity.ok(categoriesWithCount);
    }

    @Transactional
    @PostMapping("/admin/articles")
    public ResponseEntity<ArticleDto> createArticle(
            @RequestPart(value = "article") @Valid ArticleCreationRequest request,
            @RequestPart(value = "image", required = false) MultipartFile file) throws IOException {
        return ResponseEntity.ok(articleService.createArticle(request, file));
    }

    @Transactional
    @PutMapping("/admin/articles/{id}")
    public ResponseEntity<ArticleDto> updateArticle (
            @PathVariable  Long id,
            @RequestPart(value = "article") @Valid ArticleDto articleDto,
            @RequestPart(value = "image", required = false) MultipartFile file
    ) throws IOException {
        return ResponseEntity.ok(articleService.updateArticle(id, articleDto, file));
    }

    @Transactional
    @DeleteMapping("/admin/articles/{id}")
    public ResponseEntity<Void> deleteArticle (@PathVariable Long id){
        articleService.deleteArticle(id);
        return  ResponseEntity.noContent().build();
    }

}