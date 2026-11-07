package com.example.siteamame.mapper;

import com.example.siteamame.config.StorageProperties;
import com.example.siteamame.dto.concours.ConcoursReponseDto;
import com.example.siteamame.model.Concours;
import com.example.siteamame.model.File;
import com.example.siteamame.service.file.MediaUrlResolver;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

/** Le fichier d'un concours est facultatif : son absence ne doit provoquer aucune erreur. */
class ConcoursMapperTest {

    private final ConcoursMapper mapper = new ConcoursMapper(new MediaUrlResolver(
            new StorageProperties("local", "https://media.amame.ml", new StorageProperties.Local("uploads"))));

    @Test
    void aConcoursWithoutFileIsConvertedWithoutError() {
        Concours concours = new Concours();
        concours.setId(1L);
        concours.setNom("Concours sans fichier");

        ConcoursReponseDto dto = mapper.convertToDTO(concours);

        assertThat(dto.getNom()).isEqualTo("Concours sans fichier");
        assertThat(dto.getFilePath()).isNull();
        assertThat(dto.getFileUrl()).isNull();
    }

    @Test
    void aConcoursWithFileExposesItsKeyAndItsComputedUrl() {
        File file = new File();
        file.setId(5L);
        file.setFilePath("uploads/concours/a1b2.pdf");
        Concours concours = new Concours();
        concours.setFile(file);

        ConcoursReponseDto dto = mapper.convertToDTO(concours);

        assertThat(dto.getFilePath()).isEqualTo("uploads/concours/a1b2.pdf");
        assertThat(dto.getFileUrl()).isEqualTo("https://media.amame.ml/uploads/concours/a1b2.pdf");
    }

    @Test
    void aListRowGetsItsUrlFromItsKeyAndStaysWithoutUrlWhenItHasNoFile() {
        ConcoursReponseDto withFile = row("uploads/concours/a1b2.pdf");
        ConcoursReponseDto withoutFile = row(null);

        assertThat(mapper.withFileUrl(withFile).getFileUrl())
                .isEqualTo("https://media.amame.ml/uploads/concours/a1b2.pdf");
        assertThat(mapper.withFileUrl(withoutFile).getFileUrl()).isNull();
    }

    /** Même constructeur que les requêtes JPQL de ConcoursRepository. */
    private static ConcoursReponseDto row(String filePath) {
        return new ConcoursReponseDto(1L, "Concours", "Description", "Mali", null, null, true,
                null, null, "https://exemple.ml", filePath);
    }
}
