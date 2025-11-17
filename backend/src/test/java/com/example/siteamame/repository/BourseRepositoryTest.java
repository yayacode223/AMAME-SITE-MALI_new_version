package com.example.siteamame.repository;

import com.example.siteamame.dto.bourse.BourseSummaryDto;
import com.example.siteamame.model.Bourse;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

@Transactional
@DataJpaTest
class BourseRepositoryTest {

    @Autowired
    private BourseRepository bourseRepository;

    @BeforeEach
    void setUp() {
        // Nettoyer la base avant chaque test
        bourseRepository.deleteAll();

        // Créer des données de test avec le constructeur classique
        Bourse bourseValide1 = new Bourse();
        bourseValide1.setId(1L);
        bourseValide1.setTitre("Bourse Excellence France 2024");
        bourseValide1.setDescriptionCourte("Bourse d'excellence pour étudiants maliens en France");
        bourseValide1.setBailleur("Gouvernement Français");
        bourseValide1.setPaysHote("France");
        bourseValide1.setNiveau("Master");
        bourseValide1.setCategorie("Bourse d'excellence");
        bourseValide1.setFinancementStatut("Entièrement financée");
        bourseValide1.setOrganisation("Ministère de l'Enseignement Supérieur");
        bourseValide1.setDateLimite(LocalDate.now().plusDays(30));
        bourseValide1.setDatePublication(LocalDate.now().minusDays(10));
        bourseValide1.setNombresVues(150);
        bourseValide1.setLienSiteOfficiel("https://campusfrance.org");
        bourseValide1.setPaysEligible("Mali");
        bourseValide1.setRegionEligible("Afrique de l'Ouest");

        Bourse bourseValide2 = new Bourse();
        bourseValide2.setId(2L);
        bourseValide2.setTitre("Bourse Recherche Canada 2024");
        bourseValide2.setDescriptionCourte("Bourse de recherche en sciences au Canada");
        bourseValide2.setBailleur("Université de Montréal");
        bourseValide2.setPaysHote("Canada");
        bourseValide2.setNiveau("Doctorat");
        bourseValide2.setCategorie("Bourse de recherche");
        bourseValide2.setFinancementStatut("Partiellement financée");
        bourseValide2.setOrganisation("Université de Montréal");
        bourseValide2.setDateLimite(LocalDate.now().plusDays(45));
        bourseValide2.setDatePublication(LocalDate.now().minusDays(5));
        bourseValide2.setNombresVues(89);
        bourseValide2.setLienSiteOfficiel("https://umontreal.ca");
        bourseValide2.setPaysEligible("Mali, Sénégal, Côte d'Ivoire");
        bourseValide2.setRegionEligible("Afrique");

        Bourse bourseExpiree = new Bourse();
        bourseExpiree.setId(3L);
        bourseExpiree.setTitre("Bourse Expirée 2023");
        bourseExpiree.setDescriptionCourte("Bourse expirée pour tests");
        bourseExpiree.setBailleur("Gouvernement Allemand");
        bourseExpiree.setPaysHote("Allemagne");
        bourseExpiree.setNiveau("Licence");
        bourseExpiree.setCategorie("Bourse d'études");
        bourseExpiree.setFinancementStatut("Entièrement financée");
        bourseExpiree.setOrganisation("DAAD");
        bourseExpiree.setDateLimite(LocalDate.now().minusDays(10)); // Date passée
        bourseExpiree.setDatePublication(LocalDate.now().minusDays(40));
        bourseExpiree.setNombresVues(200);
        bourseExpiree.setLienSiteOfficiel("https://daad.de");
        bourseExpiree.setPaysEligible("Mali");
        bourseExpiree.setRegionEligible("Afrique de l'Ouest");

        Bourse bourseFrance = new Bourse();
        bourseFrance.setId(4L);
        bourseFrance.setTitre("Bourse Ingénierie France");
        bourseFrance.setDescriptionCourte("Bourse pour études d'ingénieur en France");
        bourseFrance.setBailleur("École Polytechnique");
        bourseFrance.setPaysHote("France");
        bourseFrance.setNiveau("Master");
        bourseFrance.setCategorie("Bourse d'ingénierie");
        bourseFrance.setFinancementStatut("Entièrement financée");
        bourseFrance.setOrganisation("École Polytechnique");
        bourseFrance.setDateLimite(LocalDate.now().plusDays(60));
        bourseFrance.setDatePublication(LocalDate.now().minusDays(3));
        bourseFrance.setNombresVues(75);

        Bourse bourseCanada = new Bourse();
        bourseCanada.setId(5L);
        bourseCanada.setTitre("Bourse Médecine Canada");
        bourseCanada.setDescriptionCourte("Bourse pour études de médecine au Canada");
        bourseCanada.setBailleur("Université McGill");
        bourseCanada.setPaysHote("Canada");
        bourseCanada.setNiveau("Doctorat");
        bourseCanada.setCategorie("Bourse médicale");
        bourseCanada.setFinancementStatut("Partiellement financée");
        bourseCanada.setOrganisation("Université McGill");
        bourseCanada.setDateLimite(LocalDate.now().plusDays(90));
        bourseCanada.setDatePublication(LocalDate.now().minusDays(2));
        bourseCanada.setNombresVues(120);

        // Sauvegarder toutes les bourses
        bourseRepository.saveAll(List.of(
                bourseValide1,
                bourseValide2,
                bourseExpiree,
                bourseFrance,
                bourseCanada
        ));
    }

    @Test
    void shouldFindValideBoursesAvecPagination() {
        // GIVEN
        LocalDate currentDate = LocalDate.now();
        Pageable pageable = PageRequest.of(0, 10);

        // WHEN
        Page<BourseSummaryDto> result = bourseRepository.findValideBoursesAvecPagination(currentDate, pageable);

        // THEN
        assertThat(result).isNotNull();
        assertThat(result.getContent()).hasSize(4); // 4 bourses avec dates futures
        assertThat(result.getContent())
                .allMatch(bourse -> bourse.getDateLimite().isAfter(currentDate) ||
                        bourse.getDateLimite().isEqual(currentDate));

        // Vérifier que les DTO contiennent les bonnes données
        assertThat(result.getContent())
                .extracting(BourseSummaryDto::getTitre)
                .containsExactlyInAnyOrder(
                        "Bourse Excellence France 2024",
                        "Bourse Recherche Canada 2024",
                        "Bourse Ingénierie France",
                        "Bourse Médecine Canada"
                );

        // Vérifier que la bourse expirée n'est pas incluse
        assertThat(result.getContent())
                .noneMatch(bourse -> bourse.getTitre().equals("Bourse Expirée 2023"));

        // Vérifier l'ordre DESC par date limite
        List<BourseSummaryDto> content = result.getContent();
        for (int i = 0; i < content.size() - 1; i++) {
            assertThat(content.get(i).getDateLimite())
                    .isAfterOrEqualTo(content.get(i + 1).getDateLimite());
        }
    }

    @Test
    void shouldFindValideAndFilteredBourse() {
        // GIVEN
        LocalDate currentDate = LocalDate.now();
        String categorie = "Bourse d'excellence";
        String niveau = "Master";
        String pays = "France";
        Pageable pageable = PageRequest.of(0, 10);

        // WHEN
        Page<BourseSummaryDto> result = bourseRepository.findValideAndFilteredBourse(
                currentDate, categorie, niveau, pays, pageable);

        // THEN
        assertThat(result).isNotNull();
        // Doit trouver bourseValide1 (catégorie correspond) ET bourseFrance (pays correspond)
        assertThat(result.getContent()).hasSize(2);
        assertThat(result.getContent())
                .extracting(BourseSummaryDto::getTitre)
                .containsExactlyInAnyOrder(
                        "Bourse Excellence France 2024",
                        "Bourse Ingénierie France"
                );

        // Vérifier que toutes les bourses ont des dates valides
        assertThat(result.getContent())
                .allMatch(bourse -> bourse.getDateLimite().isAfter(currentDate) ||
                        bourse.getDateLimite().isEqual(currentDate));
    }

    @Test
    void shouldFindBySearchBourses() {
        // GIVEN
        LocalDate currentDate = LocalDate.now();
        String searchTerm = "excellence";
        Pageable pageable = PageRequest.of(0, 10);

        // WHEN
        Page<BourseSummaryDto> result = bourseRepository.findBySearchBourses(
                currentDate, searchTerm, searchTerm, searchTerm, pageable);

        // THEN
        assertThat(result).isNotNull();
        assertThat(result.getContent()).hasSize(1);
        assertThat(result.getContent().get(0).getTitre())
                .isEqualTo("Bourse Excellence France 2024");

        // Vérifier que le DTO contient les bonnes données
        BourseSummaryDto dto = result.getContent().getFirst();
        assertThat(dto.getId()).isNotNull();
        assertThat(dto.getTitre()).contains("excellence");
        assertThat(dto.getBailleur()).isEqualTo("Gouvernement Français");
        assertThat(dto.getPaysHote()).isEqualTo("France");
    }

    @Test
    void shouldFindBySearchBoursesWithPays() {
        // GIVEN
        LocalDate currentDate = LocalDate.now();
        String paysSearch = "Canada";
        Pageable pageable = PageRequest.of(0, 10);

        // WHEN - Recherche par pays seulement
        Page<BourseSummaryDto> result = bourseRepository.findBySearchBourses(
                currentDate, "", "", paysSearch, pageable);

        // THEN
        assertThat(result).isNotNull();
        assertThat(result.getContent()).hasSize(2); // bourseValide2 et bourseCanada
        assertThat(result.getContent())
                .extracting(BourseSummaryDto::getTitre)
                .containsExactlyInAnyOrder(
                        "Bourse Recherche Canada 2024",
                        "Bourse Médecine Canada"
                );
    }

    @Test
    void shouldReturnEmptyWhenNoMatchingBourses() {
        // GIVEN
        LocalDate currentDate = LocalDate.now();
        String searchTerm = "inexistant";
        Pageable pageable = PageRequest.of(0, 10);

        // WHEN
        Page<BourseSummaryDto> result = bourseRepository.findBySearchBourses(
                currentDate, searchTerm, searchTerm, searchTerm, pageable);

        // THEN
        assertThat(result).isNotNull();
        assertThat(result.getContent()).isEmpty();
    }

    @Test
    void shouldHandleNullDateLimiteInValideBourses() {
        // GIVEN - Ajouter une bourse sans date limite
        Bourse bourseSansDate = new Bourse();
        bourseSansDate.setTitre("Bourse Sans Date Limite");
        bourseSansDate.setDescriptionCourte("Bourse sans date limite spécifiée");
        bourseSansDate.setBailleur("Test Organisation");
        bourseSansDate.setPaysHote("Test Pays");
        bourseSansDate.setDateLimite(null); // Date limite null
        bourseSansDate.setDatePublication(LocalDate.now());
        bourseRepository.save(bourseSansDate);

        LocalDate currentDate = LocalDate.now();
        Pageable pageable = PageRequest.of(0, 10);

        // WHEN
        Page<BourseSummaryDto> result = bourseRepository.findValideBoursesAvecPagination(currentDate, pageable);

        // THEN - La bourse sans date limite ne doit PAS être incluse
        assertThat(result.getContent())
                .noneMatch(bourse -> bourse.getTitre().equals("Bourse Sans Date Limite"));
        assertThat(result.getContent()).hasSize(4); // Seulement les 4 bourses avec dates valides
    }
}