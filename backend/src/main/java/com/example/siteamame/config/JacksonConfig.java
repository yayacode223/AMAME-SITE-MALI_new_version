package com.example.siteamame.config;

import com.fasterxml.jackson.databind.module.SimpleModule;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import org.springframework.boot.autoconfigure.jackson.Jackson2ObjectMapperBuilderCustomizer;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.time.LocalDateTime;

@Configuration
public class JacksonConfig {

    @Bean
    public Jackson2ObjectMapperBuilderCustomizer flexibleDateTimeDeserializer() {
        return builder -> {
            SimpleModule module = new SimpleModule();
            module.addDeserializer(LocalDateTime.class, new FlexibleLocalDateTimeDeserializer());
            // IMPORTANT : modulesToInstall (et NON modules()) — modules() REMPLACE toute la
            // liste de modules et désactive l'auto-détection, ce qui supprimait le JavaTimeModule
            // auto-enregistré par Spring Boot. Sans lui, la SÉRIALISATION de tout LocalDate /
            // LocalDateTime échouait (DTO contenant une date, et même ApiError.timestamp), ce qui
            // cascadait en forward vers /error → 401 sur des endpoints pourtant publics.
            // On réenregistre explicitement JavaTimeModule, puis notre module (dont le
            // désérialiseur LocalDateTime souple écrase celui par défaut, car enregistré en dernier).
            builder.modulesToInstall(new JavaTimeModule(), module);
        };
    }
}
