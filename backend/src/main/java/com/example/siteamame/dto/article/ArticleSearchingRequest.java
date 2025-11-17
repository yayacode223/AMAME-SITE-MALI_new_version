package com.example.siteamame.dto.article;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;


@Data
@NoArgsConstructor
@AllArgsConstructor
public class ArticleSearchingRequest {
    private String search;
    private String categorie;
    private String sortBy = "newest";
    private Boolean publishedOnly = true;
}