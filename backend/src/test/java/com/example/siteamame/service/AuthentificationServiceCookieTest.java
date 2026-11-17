package com.example.siteamame.service;

import com.example.siteamame.enumeration.RoleType;
import com.example.siteamame.mapper.UserMapperDto;
import com.example.siteamame.model.RefreshToken;
import com.example.siteamame.model.User;
import com.example.siteamame.repository.UserRepository;
import com.example.siteamame.security.jwt.JwtUtil;
import jakarta.servlet.http.Cookie;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

/**
 * Cookies de session quand le navigateur en garde plusieurs du même nom, un par domaine
 * (écart E50 du suivi de migration) : le renouvellement les lit tous, la déconnexion les
 * révoque tous et efface les deux variantes.
 */
@ExtendWith(MockitoExtension.class)
class AuthentificationServiceCookieTest {

    @Mock
    private UserRepository userRepository;
    @Mock
    private JwtUtil jwtUtil;
    @Mock
    private PasswordEncoder passwordEncoder;
    @Mock
    private UserMapperDto userMapperDto;
    @Mock
    private RefreshTokenService refreshTokenService;
    @Mock
    private PermissionService permissionService;

    private AuthentificationService service;

    @BeforeEach
    void setUp() {
        service = new AuthentificationService(userRepository, jwtUtil, passwordEncoder, userMapperDto,
                refreshTokenService, permissionService);
        ReflectionTestUtils.setField(service, "cookieSecure", true);
        ReflectionTestUtils.setField(service, "cookieDomain", "");
    }

    @Test
    void refreshHandsOverEveryRefreshCookieInTheOrderReceived() {
        MockHttpServletRequest request = new MockHttpServletRequest();
        request.setCookies(new Cookie("refresh_token", "ancien"), new Cookie("access_token", "jeton"),
                new Cookie("refresh_token", "actuel"));
        User user = new User();
        user.setEmail("admin@test.local");
        user.setRole(RoleType.ADMIN);
        RefreshToken current = token("actuel", user);
        when(refreshTokenService.validateFirstUsable(List.of("ancien", "actuel"))).thenReturn(current);
        when(refreshTokenService.rotateRefreshToken(current)).thenReturn(token("nouveau", user));
        when(jwtUtil.generateToken("admin@test.local", RoleType.ADMIN)).thenReturn("jwt");
        MockHttpServletResponse response = new MockHttpServletResponse();

        service.refresh(request, response);

        assertThat(response.getHeaders("Set-Cookie"))
                .anySatisfy(header -> assertThat(header).startsWith("access_token=jwt;"))
                .anySatisfy(header -> assertThat(header).startsWith("refresh_token=nouveau;"))
                .allSatisfy(header -> assertThat(header).doesNotContain("Domain="));
    }

    @Test
    void refreshWithoutRefreshCookieIsRefused() {
        MockHttpServletRequest request = new MockHttpServletRequest();
        request.setCookies(new Cookie("access_token", "jeton"), new Cookie("refresh_token", ""));

        assertThatThrownBy(() -> service.refresh(request, new MockHttpServletResponse()))
                .isInstanceOfSatisfying(ResponseStatusException.class, refusal -> {
                    assertThat(refusal.getStatusCode()).isEqualTo(HttpStatus.UNAUTHORIZED);
                    assertThat(refusal.getReason()).isEqualTo("Refresh token absent");
                });
        verifyNoInteractions(refreshTokenService);
    }

    @Test
    void logoutRevokesEveryRefreshTokenReceived() {
        MockHttpServletRequest request = new MockHttpServletRequest();
        request.setCookies(new Cookie("refresh_token", "ancien"), new Cookie("refresh_token", "actuel"));

        service.logout(request, new MockHttpServletResponse());

        verify(refreshTokenService).revokeByTokenValue("ancien");
        verify(refreshTokenService).revokeByTokenValue("actuel");
    }

    @Test
    void logoutWithoutDomainClearsTheHostOnlyCookies() {
        MockHttpServletResponse response = new MockHttpServletResponse();

        service.logout(new MockHttpServletRequest(), response);

        assertThat(response.getHeaders("Set-Cookie")).hasSize(2)
                .anySatisfy(header -> assertThat(header).startsWith("access_token=;").contains("Path=/;", "Max-Age=0"))
                .anySatisfy(header -> assertThat(header).startsWith("refresh_token=;").contains("Path=/api/auth;", "Max-Age=0"))
                .allSatisfy(header -> assertThat(header).doesNotContain("Domain="));
    }

    @Test
    void logoutWithADomainClearsBothVariantsOfEachCookie() {
        ReflectionTestUtils.setField(service, "cookieDomain", ".amame.ml");
        MockHttpServletResponse response = new MockHttpServletResponse();

        service.logout(new MockHttpServletRequest(), response);

        List<String> headers = response.getHeaders("Set-Cookie");
        assertThat(headers).hasSize(4).allSatisfy(header -> assertThat(header).contains("Max-Age=0"));
        for (String name : List.of("access_token=;", "refresh_token=;")) {
            assertThat(headers).filteredOn(header -> header.startsWith(name))
                    .hasSize(2)
                    .anySatisfy(header -> assertThat(header).doesNotContain("Domain="))
                    .anySatisfy(header -> assertThat(header).contains("Domain=.amame.ml"));
        }
    }

    @Test
    void withADomainNewCookiesCarryIt() {
        ReflectionTestUtils.setField(service, "cookieDomain", ".amame.ml");
        MockHttpServletRequest request = new MockHttpServletRequest();
        request.setCookies(new Cookie("refresh_token", "actuel"));
        User user = new User();
        user.setEmail("membre@test.local");
        user.setRole(RoleType.MEMBER);
        RefreshToken current = token("actuel", user);
        when(refreshTokenService.validateFirstUsable(List.of("actuel"))).thenReturn(current);
        when(refreshTokenService.rotateRefreshToken(current)).thenReturn(token("nouveau", user));
        when(jwtUtil.generateToken("membre@test.local", RoleType.MEMBER)).thenReturn("jwt");
        MockHttpServletResponse response = new MockHttpServletResponse();

        service.refresh(request, response);

        assertThat(response.getHeaders("Set-Cookie")).hasSize(2)
                .allSatisfy(header -> assertThat(header).contains("Domain=.amame.ml"));
    }

    private static RefreshToken token(String value, User user) {
        RefreshToken token = new RefreshToken();
        token.setToken(value);
        token.setUser(user);
        return token;
    }
}
