package com.example.siteamame.model;

import com.example.siteamame.enumeration.Permission;
import com.example.siteamame.enumeration.PermissionType;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@Entity
@Table(
    name = "user_permission",
    indexes = { @Index(name = "idx_user_permission_user", columnList = "user_id") },
    uniqueConstraints = { @UniqueConstraint(name = "uk_user_permission", columnNames = {"user_id", "permission"}) }
)
public class UserPermission {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** L'utilisateur concerné par cet override. */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    /** La permission accordée ou révoquée. */
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 100)
    private Permission permission;

    /** GRANTED = accordée au-delà du rôle, REVOKED = retirée du rôle par défaut. */
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 10)
    private PermissionType type;

    /** Qui a effectué l'opération (traçabilité). */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "granted_by")
    private User grantedBy;

    @Column(name = "granted_at", nullable = false)
    private LocalDateTime grantedAt = LocalDateTime.now();
}
