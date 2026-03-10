//package com.example.siteamame.datainitializer;
//
//import com.example.siteamame.model.Article;
//import com.example.siteamame.repository.ArticleRepository;
//import lombok.RequiredArgsConstructor;
//import org.springframework.boot.CommandLineRunner;
//import org.springframework.stereotype.Component;
//
//import java.util.Arrays;
//
//@Component
//@RequiredArgsConstructor
//public class ArticleDataInitializer implements CommandLineRunner {
//
//    private final ArticleRepository articleRepository;
//
//    @Override
//    public void run(String... args) throws Exception {
//        if (articleRepository.count() == 0) {
//            // Article 1
//            Article article1 = new Article();
//            article1.setTitre("Comment Rédiger une Lettre de Motivation Gagnante");
//            article1.setSlug("comment-rediger-lettre-motivation-gagnante");
//            article1.setContenu("La lettre de motivation est un élément crucial de votre candidature...");
//            article1.setAuteur("Équipe AMAME");
//            article1.setCategorie("Conseils");
////            article1.setImageUrl("https://images.pexels.com/photos/7688336/pexels-photo-7688336.jpeg");
//            article1.setVues(1247);
//            article1.setTempsLecture(8);
//            article1.setTags(Arrays.asList("lettre motivation", "conseils", "candidature"));
//            article1.setMetaDescription("Découvrez comment rédiger une lettre de motivation efficace pour vos candidatures académiques et professionnelles");
//            article1.setMetaKeywords("lettre motivation, conseils, candidature, études");
//            article1.setEstPublie(true);
//
//            articleRepository.save(article1);
//
//            // Article 2
//            Article article2 = new Article();
//            article2.setTitre("Les 10 Meilleures Destinations pour Étudier en 2025");
//            article2.setSlug("meilleures-destinations-etudier-2025");
//            article2.setContenu("Choisir sa destination d'études est une décision importante...");
//            article2.setAuteur("Équipe AMAME");
//            article2.setCategorie("Orientation");
////            article2.setImageUrl("https://images.pexels.com/photos/267885/pexels-photo-267885.jpeg");
//            article2.setVues(892);
//            article2.setTempsLecture(6);
//            article2.setTags(Arrays.asList("orientation", "études", "international"));
//            article2.setMetaDescription("Découvrez les meilleures destinations pour étudier à l'étranger en 2025");
//            article2.setMetaKeywords("études, international, orientation, destinations");
//            article2.setEstPublie(true);
//
//            articleRepository.save(article2);
//
//            // Article 3
//            Article article3 = new Article();
//            article3.setTitre("Préparer son Dossier de Candidature : Les Essentiels");
//            article3.setSlug("preparer-dossier-candidature-essentiels");
//            article3.setContenu("Un dossier de candidature complet et bien préparé augmente considérablement vos chances...");
//            article3.setAuteur("Équipe AMAME");
//            article3.setCategorie("Conseils");
////            article3.setImageUrl("https://images.pexels.com/photos/3184292/pexels-photo-3184292.jpeg");
//            article3.setVues(756);
//            article3.setTempsLecture(5);
//            article3.setTags(Arrays.asList("dossier", "candidature", "conseils"));
//            article3.setMetaDescription("Guide complet pour préparer un dossier de candidature parfait");
//            article3.setMetaKeywords("dossier, candidature, conseils, admission");
//            article3.setEstPublie(true);
//
//            articleRepository.save(article3);
//
//            System.out.println("=== 3 ARTICLES AJOUTÉS AVEC SUCCÈS ===");
//        }
//    }
//}