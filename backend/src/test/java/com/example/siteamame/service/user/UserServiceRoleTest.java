package com.example.siteamame.service.user;

import com.example.siteamame.dto.user.UserReponseDto;
import com.example.siteamame.dto.user.UserRequestDto;
import com.example.siteamame.enumeration.RoleType;
import com.example.siteamame.mapper.FileMapper;
import com.example.siteamame.mapper.UserMapperDto;
import com.example.siteamame.model.User;
import com.example.siteamame.repository.FileRepository;
import com.example.siteamame.repository.FiliereRepository;
import com.example.siteamame.repository.UserRepository;
import com.example.siteamame.config.StorageProperties;
import com.example.siteamame.service.file.FileStorageService;
import com.example.siteamame.service.file.MediaUrlResolver;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.EnumSource;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.io.IOException;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/**
 * Le rôle ne se choisit jamais dans la requête : ni à l'inscription (endpoint public),
 * ni à la mise à jour du profil (ouverte à l'utilisateur lui-même).
 */
@ExtendWith(MockitoExtension.class)
class UserServiceRoleTest {

    @Mock
    private UserRepository userRepository;
    @Mock
    private FileStorageService fileStorageService;
    @Mock
    private FileRepository fileRepository;
    @Mock
    private FileMapper fileMapper;
    @Mock
    private PasswordEncoder passwordEncoder;
    @Mock
    private FiliereRepository filiereRepository;

    private UserService userService;

    @BeforeEach
    void setUp() {
        userService = new UserService(userRepository, new UserMapperDto(passwordEncoder, filiereRepository,
                        new MediaUrlResolver(new StorageProperties("local", "", new StorageProperties.Local("uploads"),
                StorageProperties.Purge.disabled()))),
                fileStorageService, fileRepository, fileMapper);
        when(userRepository.save(any(User.class))).thenAnswer(invocation -> invocation.getArgument(0));
    }

    @ParameterizedTest
    @EnumSource(RoleType.class)
    void registrationAlwaysCreatesAPlainUserWhateverRoleIsRequested(RoleType requestedRole) throws IOException {
        when(userRepository.findByEmailIgnoreCase("intrus@test.local")).thenReturn(Optional.empty());
        when(passwordEncoder.encode("secret")).thenReturn("hash");

        UserReponseDto created = userService.register(request(requestedRole), null, null);

        assertThat(created.getRole()).isEqualTo(RoleType.USER);
        assertThat(savedUser().getRole()).isEqualTo(RoleType.USER);
    }

    @Test
    void registrationWithoutRoleCreatesAPlainUser() throws IOException {
        when(userRepository.findByEmailIgnoreCase("intrus@test.local")).thenReturn(Optional.empty());
        when(passwordEncoder.encode("secret")).thenReturn("hash");

        userService.register(request(null), null, null);

        assertThat(savedUser().getRole()).isEqualTo(RoleType.USER);
    }

    @ParameterizedTest
    @EnumSource(RoleType.class)
    void profileUpdateNeverChangesTheRole(RoleType requestedRole) throws IOException {
        User existing = new User();
        existing.setId(3L);
        existing.setRole(RoleType.MEMBER);
        when(userRepository.findById(3L)).thenReturn(Optional.of(existing));

        UserReponseDto updated = userService.update(3L, request(requestedRole), null, null);

        assertThat(updated.getRole()).isEqualTo(RoleType.MEMBER);
        assertThat(savedUser().getRole()).isEqualTo(RoleType.MEMBER);
    }

    private User savedUser() {
        ArgumentCaptor<User> captor = ArgumentCaptor.forClass(User.class);
        verify(userRepository).save(captor.capture());
        return captor.getValue();
    }

    private static UserRequestDto request(RoleType role) {
        UserRequestDto dto = new UserRequestDto();
        dto.setNom("Intrus");
        dto.setPrenom("Anonyme");
        dto.setEmail("intrus@test.local");
        dto.setPassword("secret");
        dto.setRole(role);
        return dto;
    }
}
