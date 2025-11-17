package com.example.siteamame.service;

import com.example.siteamame.dto.article.ArticleCreationRequest;
import com.example.siteamame.dto.article.ArticleDto;
import com.example.siteamame.dto.article.ArticleSearchingRequest;
import com.example.siteamame.dto.article.ArticleSummaryDto;
import com.example.siteamame.dto.file.FileDto;
import com.example.siteamame.enumeration.FileType;
import com.example.siteamame.mapper.ArticleMapper;
import com.example.siteamame.mapper.FileMapper;
import com.example.siteamame.model.Article;
import com.example.siteamame.model.File;
import com.example.siteamame.repository.ArticleRepository;
import com.example.siteamame.repository.FileRepository;
import com.example.siteamame.service.file.FileStorageServiceImpl;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;


import java.io.IOException;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ArticleService {

    private final ArticleRepository articleRepository;
    private final ArticleMapper articleMapper;
    private final FileStorageServiceImpl fileStorageService;
    private final FileRepository fileRepository;
    private final FileMapper fileMapper;

    public List<ArticleSummaryDto> getAllArticles() {
        return articleRepository.findByEstPublieTrueOrderByDatePublicationDesc()
                .stream()
                .map(articleMapper::convertToSummaryDTO)
                .collect(Collectors.toList());
    }

    public ArticleDto getArticleById(Long id) {
        Article article = articleRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Article non trouvé avec l'id: " + id));
        return articleMapper.convertToDTO(article);
    }

    @Transactional
    public ArticleDto getArticleBySlug(String slug) {
        Article article = articleRepository.findBySlug(slug)
                .orElseThrow(() -> new RuntimeException("Article non trouvé avec le slug: " + slug));

        // Incrémenter les vues
        articleRepository.incrementViews(article.getId());
        article.setVues(article.getVues() + 1);

        return articleMapper.convertToDTO(article);
    }

    public List<ArticleSummaryDto> searchArticles(ArticleSearchingRequest request) {
        List<Article> articles;

        if (request.getCategorie() == null || request.getCategorie().equals("all")) {
            if (request.getSearch() == null || request.getSearch().trim().isEmpty()) {
                articles = articleRepository.findByEstPublieTrueOrderByDatePublicationDesc();
            } else {
                articles = articleRepository.searchArticles(request.getSearch().trim());
            }
        } else {
            if (request.getSearch() == null || request.getSearch().trim().isEmpty()) {
                articles = articleRepository.findByCategorieAndEstPublieTrue(request.getCategorie());
            } else {
                articles = articleRepository.searchArticlesByCategorie(request.getSearch().trim(), request.getCategorie());
            }
        }

        // Trier les résultats
        if ("oldest".equals(request.getSortBy())) {
            articles.sort((a1, a2) -> a1.getDatePublication().compareTo(a2.getDatePublication()));
        } else {
            articles.sort((a1, a2) -> a2.getDatePublication().compareTo(a1.getDatePublication()));
        }

        return articles.stream()
                .map(articleMapper::convertToSummaryDTO)
                .collect(Collectors.toList());
    }

    public List<ArticleSummaryDto> getPopularArticles() {
        return articleRepository.findByEstPublieTrueOrderByVuesDesc()
                .stream()
                .limit(5)
                .map(articleMapper::convertToSummaryDTO)
                .collect(Collectors.toList());
    }

    public List<ArticleSummaryDto> getArticlesByCategorie(String categorie) {
        return articleRepository.findByCategorieAndEstPublieTrue(categorie)
                .stream()
                .map(articleMapper::convertToSummaryDTO)
                .collect(Collectors.toList());
    }

    public List<ArticleSummaryDto> getSimilarArticles(Long articleId, String categorie) {
        return articleRepository.findByCategorieAndEstPublieTrue(categorie)
                .stream()
                .filter(article -> !article.getId().equals(articleId))
                .limit(3)
                .map(articleMapper::convertToSummaryDTO)
                .collect(Collectors.toList());
    }


    public List<String> getCategoriesWithCount() {
        return articleRepository.findDistinctCategories();
    }

    public Long getArticleCountByCategorie(String categorie) {
        return articleRepository.countByCategorie(categorie);
    }


    //Methode pour la creation d'article
    @Transactional
    public ArticleDto createArticle(ArticleCreationRequest request, MultipartFile file) {
        // Générer le slug à partir du titre
        String slug = generateSlug(request.getTitre());

        Article article = new Article();
        article.setTitre(request.getTitre());
        article.setSlug(slug);
        article.setContenu(request.getContenu());
        article.setAuteur(request.getAuteur());
        article.setCategorie(request.getCategorie());
        article.setTempsLecture(request.getTempsLecture());
        article.setTags(request.getTags());
        article.setMetaDescription(request.getMetaDescription());
        article.setMetaKeywords(request.getMetaKeywords());
        article.setEstPublie(true);
        article.setVues(0);

        if(file != null){
            try {
                FileDto fileDto = fileStorageService.storeFile(file, "actualite", FileType.IMAGE);
                File fileToSave = fileMapper.convertDtoToFile(fileDto);
                File savedFile = fileRepository.save(fileToSave);
                article.setFile(savedFile);
            } catch (IOException e) {
                throw new RuntimeException(e);
            }
        }

        Article savedArticle = articleRepository.save(article);
        return articleMapper.convertToDTO(savedArticle);
    }

    //Methode pour mettre un article
    @Transactional
    public ArticleDto updateArticle( Long id, ArticleDto articleDto, MultipartFile file) {
        Article articleToUpdate = articleRepository.findById(id).
                    orElseThrow(()-> new RuntimeException("Article avec cet Id:"+ articleDto.getId() +"n'existe pas"));

        if(articleToUpdate.getEstPublie() == true) {
            throw new RuntimeException("L'article est deja publie, vous ne pourrez plus la supprimer");
        }

        if(!articleDto.getTitre().isEmpty()) articleToUpdate.setTitre(articleDto.getTitre());
        if(!articleDto.getContenu().isEmpty()) articleToUpdate.setContenu(articleDto.getContenu());
        if(!articleDto.getMetaDescription().isEmpty()) articleToUpdate.setMetaDescription(articleDto.getMetaDescription());
        if(!articleDto.getAuteur().isEmpty()) articleToUpdate.setAuteur(articleDto.getAuteur());
        if(!articleDto.getCategorie().isEmpty()) articleToUpdate.setCategorie(articleDto.getCategorie());
        if(!articleDto.getMetaKeywords().isEmpty()) articleToUpdate.setMetaKeywords(articleDto.getMetaKeywords());
        if(articleDto.getTempsLecture()!= null) articleToUpdate.setTempsLecture(articleDto.getTempsLecture());
        if(!articleDto.getTags().isEmpty()) articleToUpdate.setTags(articleDto.getTags());
        articleToUpdate.setDateModification(LocalDateTime.now());
        articleToUpdate.setDatePublication(LocalDateTime.now());
        articleToUpdate.setEstPublie(true);
        articleToUpdate.setSlug(generateSlug(articleDto.getTitre()));

        if(file != null){
            if(articleToUpdate.getFile() != null){
                try {
                    fileStorageService.deleteFile(articleToUpdate.getFile().getFileName(), "actualite");
                } catch (IOException e) {
                    throw new RuntimeException(e);
                }
            }

            try {
                FileDto fileDto = fileStorageService.storeFile(file, "actulite", FileType.IMAGE);
                File fileToSave = fileMapper.convertDtoToFile(fileDto);
                File savedFile = fileRepository.save(fileToSave);
                articleToUpdate.setFile(savedFile);
            } catch (IOException e) {
                throw new RuntimeException(e);
            }
        }

        Article savedArticle = articleRepository.save(articleToUpdate);

        return articleMapper.convertToDTO(savedArticle);

    }

    //Supprimer un article
    public void deleteArticle(Long id){
        if(articleRepository.existsById(id)){
            articleRepository.deleteById(id);
        }else{
            throw new RuntimeException("Impossible de supprimer cet article");
        }
    }

    private String generateSlug(String titre) {
        return titre.toLowerCase()
                .replaceAll("[^a-z0-9\\s-]", "")
                .replaceAll("\\s+", "-")
                .replaceAll("-+", "-")
                .trim();
    }
}