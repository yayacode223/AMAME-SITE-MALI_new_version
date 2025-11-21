package com.example.siteamame.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Table(name = "article")
public class Article {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "titre", nullable = false, length = 500)
    private String titre;

    @Column(name = "slug", nullable = false, unique = true, length = 600)
    private String slug;

    @Column(name = "contenu", columnDefinition = "TEXT", nullable = false)
    private String contenu;

    @Column(name = "auteur", nullable = false, length = 200)
    private String auteur;

    private String categorie;

    @Column(name = "vues")
    private Integer vues = 0;

    @Column(name = "temps_lecture")
    private Integer tempsLecture;

    @Column(name = "est_publie")
    private Boolean estPublie = true;

    @CreationTimestamp
    @Column(name = "date_publication", updatable = false)
    private LocalDateTime datePublication;

    @UpdateTimestamp
    @Column(name = "date_modification")
    private LocalDateTime dateModification;

    @ElementCollection
    @CollectionTable(name = "article_tags", joinColumns = @JoinColumn(name = "article_id"))
    @Column(name = "tag")
    private List<String> tags = new ArrayList<>();

    @Column(name = "meta_description", length = 500)
    private String metaDescription;

    @Column(name = "meta_keywords", length = 500)
    private String metaKeywords;

    @OneToOne(fetch = FetchType.EAGER, cascade = CascadeType.ALL)
    private File file;
}