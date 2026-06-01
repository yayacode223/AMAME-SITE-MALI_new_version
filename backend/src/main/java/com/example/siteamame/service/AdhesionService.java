package com.example.siteamame.service;

import com.example.siteamame.dto.adhesion.AdhesionDto;
import com.example.siteamame.dto.adhesion.AdhesionRegisterRequest;
import com.example.siteamame.dto.adhesion.AdhesionRequestDto;
import com.example.siteamame.dto.common.PageResponse;
import com.example.siteamame.enumeration.AdhesionStatus;
import com.example.siteamame.enumeration.RoleType;
import com.example.siteamame.mapper.AdhesionMapper;
import com.example.siteamame.model.Adhesion;
import com.example.siteamame.model.User;
import com.example.siteamame.repository.AdhesionRepository;
import com.example.siteamame.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class AdhesionService {

    private final AdhesionRepository adhesionRepository;
    private final UserRepository userRepository;
    private final AdhesionMapper adhesionMapper;
    private final EmailService emailService;
    private final PasswordEncoder passwordEncoder;

    // ── Inscription + demande d'adhésion combinées (flux public) ────────────

    @Transactional
    public AdhesionDto registerAndSubmitAdhesion(AdhesionRegisterRequest request) {
        if (!request.isAcceptConditions()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Vous devez accepter les conditions d'adhésion.");
        }

        // Vérifier email unique
        if (userRepository.findByEmailIgnoreCase(request.getEmail()).isPresent()) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "Un compte existe déjà avec cet email.");
        }

        // Créer le compte utilisateur
        User user = new User();
        user.setNom(request.getNom());
        user.setPrenom(request.getPrenom());
        user.setEmail(request.getEmail().toLowerCase().trim());
        user.setPassword(passwordEncoder.encode(request.getPassword()));
        user.setVille(request.getVille());
        user.setPhone(request.getPhone());
        user.setRole(RoleType.USER);
        user.setFiles(new ArrayList<>());
        User savedUser = userRepository.save(user);

        // Créer la demande d'adhésion
        Adhesion adhesion = new Adhesion();
        adhesion.setUser(savedUser);
        adhesion.setMotivation(null);
        adhesion.setStatus(AdhesionStatus.PENDING);
        AdhesionDto result = adhesionMapper.toDto(adhesionRepository.save(adhesion));

        // Notifier les SUPERADMINs par email (asynchrone)
        notifyAdmins(savedUser, adhesion.getId());

        return result;
    }

    // ── Demande d'adhésion pour utilisateur déjà connecté ───────────────────

    @Transactional
    public AdhesionDto submitAdhesion(Long userId, AdhesionRequestDto request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Utilisateur non trouvé"));

        if (adhesionRepository.existsByUserIdAndStatusIn(userId,
                List.of(AdhesionStatus.PENDING, AdhesionStatus.APPROVED))) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "Une demande d'adhésion est déjà en cours ou approuvée.");
        }

        Adhesion adhesion = new Adhesion();
        adhesion.setUser(user);
        adhesion.setMotivation(request.getMotivation());
        adhesion.setStatus(AdhesionStatus.PENDING);
        AdhesionDto result = adhesionMapper.toDto(adhesionRepository.save(adhesion));

        // Notifier les SUPERADMINs par email (asynchrone)
        notifyAdmins(user, adhesion.getId());

        return result;
    }

    // ── Statut de sa propre adhésion ─────────────────────────────────────────

    @Transactional(readOnly = true)
    public Optional<AdhesionDto> getAdhesionStatus(Long userId) {
        return adhesionRepository.findTopByUserIdOrderByCreatedAtDesc(userId)
                .map(adhesionMapper::toDto);
    }

    // ── Liste paginée admin ──────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public PageResponse<AdhesionDto> getAllAdhesions(
            int page, int size, String sortBy, String sortDirection, AdhesionStatus status) {
        Sort sort = "ASC".equalsIgnoreCase(sortDirection)
                ? Sort.by(sortBy).ascending()
                : Sort.by(sortBy).descending();
        Pageable pageable = PageRequest.of(page, size, sort);
        Page<Adhesion> adhesions = (status != null)
                ? adhesionRepository.findByStatus(status, pageable)
                : adhesionRepository.findAll(pageable);
        return new PageResponse<>(adhesions.map(adhesionMapper::toDto));
    }

    @Transactional(readOnly = true)
    public long countByStatus(AdhesionStatus status) {
        return adhesionRepository.countByStatus(status);
    }

    // ── Approbation ─────────────────────────────────────────────────────────

    @Transactional
    public AdhesionDto approveAdhesion(Long adhesionId) {
        Adhesion adhesion = adhesionRepository.findById(adhesionId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Adhésion non trouvée"));

        if (adhesion.getStatus() == AdhesionStatus.APPROVED) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Cette adhésion est déjà approuvée.");
        }

        adhesion.setStatus(AdhesionStatus.APPROVED);
        adhesion.setAdhesionDate(LocalDate.now());
        adhesion.setRejectionReason(null);

        User user = adhesion.getUser();
        user.setRole(RoleType.MEMBER);
        userRepository.save(user);
        AdhesionDto result = adhesionMapper.toDto(adhesionRepository.save(adhesion));

        // Notifier l'utilisateur par email
        emailService.sendAdhesionApprovalToUser(user.getEmail(), user.getPrenom(), user.getNom());

        return result;
    }

    // ── Rejet ────────────────────────────────────────────────────────────────

    @Transactional
    public AdhesionDto rejectAdhesion(Long adhesionId, String reason) {
        Adhesion adhesion = adhesionRepository.findById(adhesionId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Adhésion non trouvée"));

        adhesion.setStatus(AdhesionStatus.REJECTED);
        adhesion.setRejectionReason(reason);

        User user = adhesion.getUser();
        if (user.getRole() == RoleType.MEMBER) {
            user.setRole(RoleType.USER);
            userRepository.save(user);
        }
        AdhesionDto result = adhesionMapper.toDto(adhesionRepository.save(adhesion));

        // Notifier l'utilisateur par email
        emailService.sendAdhesionRejectionToUser(user.getEmail(), user.getPrenom(), user.getNom(), reason);

        return result;
    }

    // ── Suppression ──────────────────────────────────────────────────────────

    @Transactional
    public void deleteAdhesion(Long adhesionId) {
        if (!adhesionRepository.existsById(adhesionId)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Adhésion non trouvée");
        }
        adhesionRepository.deleteById(adhesionId);
    }

    // ── Utilitaire : notifier tous les SUPERADMINs ───────────────────────────

    private void notifyAdmins(User user, Long adhesionId) {
        List<User> admins = userRepository.findAllByRole(RoleType.SUPERADMIN);
        admins.forEach(admin ->
            emailService.sendAdhesionRequestToAdmin(
                admin.getEmail(),
                user.getPrenom(), user.getNom(), user.getEmail(),
                adhesionId
            )
        );
    }
}
