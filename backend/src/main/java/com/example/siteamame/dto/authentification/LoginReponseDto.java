package com.example.siteamame.dto.authentification;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@AllArgsConstructor
public class LoginReponseDto {
    private String email;
    private String token;
}
