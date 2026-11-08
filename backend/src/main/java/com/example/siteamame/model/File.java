package com.example.siteamame.model;

import com.example.siteamame.enumeration.FileType;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Setter
@Getter
@Entity
@Table(name="file_entity")
@AllArgsConstructor
@NoArgsConstructor
public class File {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // Nom et clé ne changent jamais (I4) : Hibernate ne les inclut dans aucun UPDATE, et la base
    // refuse de toute façon une modification de file_path (déclencheur de V2).
    @Column(nullable = false, updatable = false)
    private String fileName;

    /** Clé de stockage uploads/&lt;dossier&gt;/&lt;uuid&gt;.&lt;ext&gt;, unique et immuable. */
    @Column(nullable = false, updatable = false)
    private String filePath;

    @Column(nullable = false)
    @Enumerated(EnumType.STRING)
    private FileType fileType;

    private String fileMimeType;
    private Long fileSize;
    private LocalDateTime uploadDate;

    /** Empreinte SHA-256 du contenu, en hexadécimal minuscule ; vide pour les fichiers antérieurs à l'étape 2. */
    @Column(name = "file_sha256", length = 64)
    private String fileSha256;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    private User user ; 

}
