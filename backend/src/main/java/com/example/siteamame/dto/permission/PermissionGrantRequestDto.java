package com.example.siteamame.dto.permission;

import com.example.siteamame.enumeration.Permission;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
public class PermissionGrantRequestDto {

    @NotNull(message = "La permission est obligatoire")
    private Permission permission;
}
