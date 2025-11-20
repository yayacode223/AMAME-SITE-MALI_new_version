package com.example.siteamame.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class WebMvcconfigurer implements WebMvcConfigurer {
    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        //Expose le dossier uploads (images, documents)
        registry.addResourceHandler("uploads/**")
                .addResourceLocations("file:uploads/");
    }
}