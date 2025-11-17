package com.example.siteamame.dto.concours;

import lombok.Data;
import lombok.Getter;
import lombok.Setter;
import org.springframework.data.domain.Page;

import java.util.List;

@Getter
@Setter
public class ConcoursPageResponse {
    private List<ConcoursReponseDto> concours;
    private int currentPage;
    private int totalPages;
    private Long totalElements;
    private int PageSize;
    private boolean hasNext;
    private boolean hasPrevious;

    public ConcoursPageResponse(Page<ConcoursReponseDto> page) {
        this.concours = page.getContent();
        this.currentPage = page.getNumber();
        this.totalPages = page.getTotalPages();
        this.totalElements = page.getTotalElements();
        this.PageSize = page.getSize();
        this.hasNext = page.hasNext();
        this.hasPrevious = page.hasPrevious();
    }

}
