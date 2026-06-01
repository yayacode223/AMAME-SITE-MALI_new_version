package com.example.siteamame.dto.permission;

import com.example.siteamame.enumeration.RoleType;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
public class RoleChangeRequestDto {

    @NotNull(message = "Le rôle est obligatoire")
    private RoleType role;
}
