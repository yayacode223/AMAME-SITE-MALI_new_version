package com.example.siteamame.dto.bourse;

import lombok.Getter;
import lombok.Setter;
import org.springframework.data.domain.Page;

import java.util.List;

@Getter
@Setter
public class BoursePageResponse {
    private List<BourseSummaryDto> bourseSummaryDtos;
    private int currentPage;
    private int totalPages;
    private Long totalElements;
    private int pageSize;
    private boolean hasNext;
    private boolean hasPrevious;

    public BoursePageResponse(Page<BourseSummaryDto> page){
        this.bourseSummaryDtos = page.getContent();
        this.currentPage = page.getNumber();
        this.totalPages = page.getTotalPages();
        this.totalElements = page.getTotalElements();
        this.pageSize = page.getSize();
        this.hasNext = page.hasNext();
        this.hasPrevious = page.hasPrevious();
    }
}
