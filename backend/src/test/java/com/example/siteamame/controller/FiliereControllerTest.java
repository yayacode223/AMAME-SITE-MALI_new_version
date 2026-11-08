package com.example.siteamame.controller;

import com.example.siteamame.dto.filiere.FiliereDto;
import com.example.siteamame.dto.filiere.FiliereRequestDto;
import com.example.siteamame.exception.GlobalHandlerException;
import com.example.siteamame.service.FiliereService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.multipart.MultipartFile;

import java.nio.charset.StandardCharsets;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.isNull;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Liaison de la requête de création d'une filière (anomalie C8) : le frontend envoie la filière en
 * partie JSON « filiere » d'un formulaire multipart, et l'image en partie « file », facultative.
 * MockMvc autonome : pas de contexte Spring, ni sécurité ni base.
 */
@ExtendWith(MockitoExtension.class)
class FiliereControllerTest {

    @Mock
    private FiliereService filiereService;

    private MockMvc mockMvc;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.standaloneSetup(new FiliereController(filiereService))
                .setControllerAdvice(new GlobalHandlerException())
                .build();
    }

    private static MockMultipartFile filierePart(String json) {
        // Même forme que le Blob « application/json » du frontend (orientationService.ts).
        return new MockMultipartFile("filiere", "blob", MediaType.APPLICATION_JSON_VALUE,
                json.getBytes(StandardCharsets.UTF_8));
    }

    @Test
    void createsFiliereFromJsonPartAndImage() throws Exception {
        when(filiereService.ajouterFiliere(any(), any())).thenReturn(new FiliereDto());
        MockMultipartFile image = new MockMultipartFile("file", "photo.png", MediaType.IMAGE_PNG_VALUE, new byte[]{1, 2, 3});

        mockMvc.perform(multipart("/api/admin/filieres")
                        .file(filierePart("{\"nom\":\"Informatique\",\"domaine\":\"SCIENCES_ET_TECHNOLOGIES\"}"))
                        .file(image))
                .andExpect(status().isOk());

        ArgumentCaptor<FiliereRequestDto> request = ArgumentCaptor.forClass(FiliereRequestDto.class);
        ArgumentCaptor<MultipartFile> file = ArgumentCaptor.forClass(MultipartFile.class);
        verify(filiereService).ajouterFiliere(request.capture(), file.capture());
        assertThat(request.getValue().getNom()).isEqualTo("Informatique");
        assertThat(request.getValue().getDomaine()).hasToString("SCIENCES_ET_TECHNOLOGIES");
        assertThat(file.getValue().getOriginalFilename()).isEqualTo("photo.png");
    }

    @Test
    void createsFiliereWithoutImage() throws Exception {
        when(filiereService.ajouterFiliere(any(), isNull())).thenReturn(new FiliereDto());

        mockMvc.perform(multipart("/api/admin/filieres").file(filierePart("{\"nom\":\"Médecine\"}")))
                .andExpect(status().isOk());

        verify(filiereService).ajouterFiliere(any(), isNull());
    }

    @Test
    void refusesFiliereWithoutNameWithBadRequest() throws Exception {
        mockMvc.perform(multipart("/api/admin/filieres").file(filierePart("{\"nom\":\"  \"}")))
                .andExpect(status().isBadRequest());

        verify(filiereService, never()).ajouterFiliere(any(), any());
    }
}
