package com.example.siteamame.controller;

import com.example.siteamame.dto.EtablissementDto;
import com.example.siteamame.service.EtablissementService;
import lombok.AllArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@AllArgsConstructor
@RestController
@RequestMapping("/api/user/etablissement")
public class EtablissementController {
    private final EtablissementService etablissementService;


    @GetMapping()
    public ResponseEntity<List<EtablissementDto>> listerEtablissements () {
        return new ResponseEntity<>(etablissementService.getAllEtablissements(), HttpStatus.OK);
    }
}
