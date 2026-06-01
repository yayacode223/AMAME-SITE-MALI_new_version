package com.example.siteamame.service;

import com.example.siteamame.dto.cotisation.CotisationDto;
import com.example.siteamame.dto.don.DonDto;
import com.example.siteamame.dto.don.DonRequestDto;
import com.example.siteamame.dto.user.ChangePasswordRequest;
import com.example.siteamame.dto.user.UpdateProfileRequest;
import com.example.siteamame.dto.user.UserReponseDto;
import com.example.siteamame.enumeration.CotisationStatus;
import com.example.siteamame.mapper.UserMapperDto;
import com.example.siteamame.model.Cotisation;
import com.example.siteamame.model.Don;
import com.example.siteamame.model.User;
import com.example.siteamame.repository.CotisationRepository;
import com.example.siteamame.repository.DonRepository;
import com.example.siteamame.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.time.Year;
import java.util.List;

@Service
@RequiredArgsConstructor
public class MembreService {

    private final UserRepository userRepository;
    private final CotisationRepository cotisationRepository;
    private final DonRepository donRepository;
    private final PasswordEncoder passwordEncoder;
    private final UserMapperDto userMapperDto;

    // ── Profil ───────────────────────────────────────────────────────────────

    @Transactional
    public UserReponseDto updateProfile(Long userId, UpdateProfileRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Utilisateur introuvable"));

        user.setNom(request.getNom());
        user.setPrenom(request.getPrenom());
        user.setPhone(request.getPhone());
        user.setVille(request.getVille());
        user.setAdresse(request.getAdresse());
        user.setPays(request.getPays());
        user.setBirthDate(request.getBirthDate());
        user.setSexe(request.getSexe());
        user.setNiveauEtude(request.getNiveauEtude());
        user.setCodePostal(request.getCodePostal());

        return userMapperDto.UserToDto(userRepository.save(user));
    }

    // ── Mot de passe ─────────────────────────────────────────────────────────

    @Transactional
    public void changePassword(Long userId, ChangePasswordRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Utilisateur introuvable"));

        if (!passwordEncoder.matches(request.getCurrentPassword(), user.getPassword())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Mot de passe actuel incorrect.");
        }

        user.setPassword(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);
    }

    // ── Cotisations ──────────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public List<CotisationDto> getMyCotisations(Long userId) {
        return cotisationRepository.findByUserIdOrderByAnneeDesc(userId)
                .stream()
                .map(this::toCotisationDto)
                .toList();
    }

    // ── Dons ─────────────────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public List<DonDto> getMyDons(Long userId) {
        return donRepository.findByUserIdOrderByDateDonDesc(userId)
                .stream()
                .map(this::toDonDto)
                .toList();
    }

    @Transactional
    public DonDto submitDon(Long userId, DonRequestDto request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Utilisateur introuvable"));

        Don don = new Don();
        don.setUser(user);
        don.setMontant(request.getMontant());
        don.setMessage(request.getMessage());

        return toDonDto(donRepository.save(don));
    }

    // ── Stats tableau de bord ────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public DashboardStats getDashboardStats(Long userId) {
        List<Cotisation> cotisations = cotisationRepository.findByUserIdOrderByAnneeDesc(userId);
        List<Don> dons = donRepository.findByUserIdOrderByDateDonDesc(userId);

        int currentYear = Year.now().getValue();
        boolean cotisationAJour = cotisations.stream()
                .anyMatch(c -> c.getAnnee() == currentYear && c.getStatus() == CotisationStatus.PAID);

        BigDecimal totalDons = dons.stream()
                .map(Don::getMontant)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        return new DashboardStats(cotisationAJour, cotisations.size(), dons.size(), totalDons);
    }

    public record DashboardStats(
            boolean cotisationAJourCetteAnnee,
            int totalCotisations,
            int totalDons,
            BigDecimal totalMontantDons
    ) {}

    // ── Mappers internes ─────────────────────────────────────────────────────

    private CotisationDto toCotisationDto(Cotisation c) {
        CotisationDto dto = new CotisationDto();
        dto.setId(c.getId());
        dto.setAnnee(c.getAnnee());
        dto.setMontant(c.getMontant());
        dto.setStatus(c.getStatus());
        dto.setStatusLabel(c.getStatus().getLabel());
        dto.setDatePaiement(c.getDatePaiement());
        dto.setReferencePaiement(c.getReferencePaiement());
        dto.setNotes(c.getNotes());
        dto.setCreatedAt(c.getCreatedAt());
        return dto;
    }

    private DonDto toDonDto(Don d) {
        DonDto dto = new DonDto();
        dto.setId(d.getId());
        dto.setMontant(d.getMontant());
        dto.setMessage(d.getMessage());
        dto.setDateDon(d.getDateDon());
        return dto;
    }
}
