package com.example.siteamame.controller;


import com.example.siteamame.dto.OpportunitesDto;
import com.example.siteamame.service.OpportunitesService;
import lombok.AllArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@AllArgsConstructor
@RestController
@RequestMapping("/api/user/opportunity")
public class OpportunitesController {
    private final OpportunitesService opportunitesService;

    @GetMapping()
    public ResponseEntity<List<OpportunitesDto>> getAllOpportunites() {
        return new ResponseEntity<>(opportunitesService.getActiveOpportunites(), HttpStatus.OK);
    }
}
