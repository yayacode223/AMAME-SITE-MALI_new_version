package com.example.siteamame.service;

import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
@Slf4j
public class EmailService {

    private final JavaMailSender mailSender;

    @Value("${app.mail.from}")
    private String mailFrom;

    @Value("${app.mail.from-name:AMAME}")
    private String mailFromName;

    @Value("${app.frontend.url:https://amame.ml}")
    private String frontendUrl;

    // ── Styles partagés ─────────────────────────────────────────────────────

    private static final String GREEN     = "#16a34a";
    private static final String DARK_BG   = "#14532d";
    private static final String LIGHT_BG  = "#f0fdf4";
    private static final String TEXT      = "#111827";
    private static final String MUTED     = "#6b7280";

    // ── Envoi générique ─────────────────────────────────────────────────────

    @Async
    public void send(String to, String subject, String htmlBody) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            helper.setFrom(mailFrom, mailFromName);
            helper.setTo(to);
            helper.setSubject(subject);
            helper.setText(htmlBody, true);
            mailSender.send(message);
            log.info("Email envoyé à {} — sujet : {}", to, subject);
        } catch (Exception e) {
            log.error("Échec d'envoi d'email à {} : {}", to, e.getMessage());
        }
    }

    // ── Email : notification admin → nouvelle demande ────────────────────────

    public void sendAdhesionRequestToAdmin(
            String adminEmail,
            String userPrenom, String userNom, String userEmail,
            Long adhesionId) {

        String adminLink = frontendUrl + "/admin/adhesions";
        String subject   = "Nouvelle demande d'adhésion — " + prenom(userPrenom, userNom);

        String body = layout(
            "Nouvelle demande d'adhésion",
            """
            <p style="margin:0 0 16px;font-size:15px;color:%s;line-height:1.6;">
              Bonjour,<br><br>
              Une nouvelle demande d'adhésion a été soumise sur la plateforme AMAME.
            </p>

            <table style="width:100%%;border-collapse:collapse;margin-bottom:24px;">
              <tr>
                <td style="padding:8px 12px;background:#f9fafb;border:1px solid #e5e7eb;font-size:13px;color:%s;font-weight:600;width:140px;">Nom complet</td>
                <td style="padding:8px 12px;border:1px solid #e5e7eb;font-size:14px;color:%s;">%s %s</td>
              </tr>
              <tr>
                <td style="padding:8px 12px;background:#f9fafb;border:1px solid #e5e7eb;font-size:13px;color:%s;font-weight:600;">Email</td>
                <td style="padding:8px 12px;border:1px solid #e5e7eb;font-size:14px;color:%s;">%s</td>
              </tr>
            </table>

            <p style="margin:0 0 24px;font-size:14px;color:%s;">
              Connectez-vous au tableau de bord administrateur pour examiner et traiter cette demande.
            </p>
            """.formatted(TEXT, MUTED, TEXT, userPrenom, userNom, MUTED, TEXT, userEmail, MUTED),
            "Voir les demandes d'adhésion",
            adminLink
        );

        send(adminEmail, subject, body);
    }

    // ── Email : approbation → utilisateur ───────────────────────────────────

    public void sendAdhesionApprovalToUser(
            String userEmail,
            String userPrenom, String userNom) {

        String dashboardLink = frontendUrl + "/membre/dashboard";
        String subject = "🎉 Félicitations ! Votre adhésion à l'AMAME est approuvée";

        String body = layout(
            "Bienvenue dans la communauté AMAME !",
            """
            <p style="margin:0 0 16px;font-size:15px;color:%s;line-height:1.6;">
              Bonjour <strong>%s</strong>,<br><br>
              Nous avons le plaisir de vous informer que votre demande d'adhésion à
              l'<strong>Association Malienne pour l'Avancement du Mérite Éducatif (AMAME)</strong>
              a été <span style="color:%s;font-weight:700;">approuvée</span>.
            </p>

            <div style="background:%s;border-left:4px solid %s;padding:16px 20px;border-radius:0 8px 8px 0;margin-bottom:24px;">
              <p style="margin:0;font-size:14px;color:%s;font-weight:600;">
                Vous êtes maintenant membre officiel de l'AMAME.
              </p>
              <p style="margin:8px 0 0;font-size:13px;color:%s;">
                Accédez à votre espace membre pour compléter votre profil et profiter de tous les avantages.
              </p>
            </div>

            <p style="margin:0 0 8px;font-size:14px;color:%s;font-weight:600;">Ce que vous pouvez faire maintenant :</p>
            <ul style="margin:0 0 24px;padding-left:20px;font-size:14px;color:%s;line-height:1.8;">
              <li>Compléter votre profil (photo, informations)</li>
              <li>Accéder aux ressources exclusives membres</li>
              <li>Consulter les activités et événements</li>
              <li>Rejoindre la communauté d'étudiants d'excellence</li>
            </ul>
            """.formatted(TEXT, userPrenom, GREEN, LIGHT_BG, GREEN, DARK_BG, MUTED, TEXT, MUTED),
            "Accéder à mon espace membre",
            dashboardLink
        );

        send(userEmail, subject, body);
    }

    // ── Email : rejet → utilisateur ─────────────────────────────────────────

    public void sendAdhesionRejectionToUser(
            String userEmail,
            String userPrenom, String userNom,
            String reason) {

        String adhesionLink = frontendUrl + "/adhesion";
        String subject = "Votre demande d'adhésion à l'AMAME";

        String reasonBlock = (reason != null && !reason.isBlank())
            ? """
              <div style="background:#fff7ed;border-left:4px solid #f97316;padding:16px 20px;border-radius:0 8px 8px 0;margin-bottom:24px;">
                <p style="margin:0 0 6px;font-size:13px;color:#9a3412;font-weight:600;">Motif communiqué :</p>
                <p style="margin:0;font-size:14px;color:#7c2d12;">%s</p>
              </div>
              """.formatted(reason)
            : "<p style=\"margin:0 0 24px;font-size:14px;color:" + MUTED + ";\">Notre équipe a examiné votre dossier et ne peut pas y donner une suite favorable pour le moment.</p>";

        String body = layout(
            "Résultat de votre demande d'adhésion",
            """
            <p style="margin:0 0 16px;font-size:15px;color:%s;line-height:1.6;">
              Bonjour <strong>%s</strong>,<br><br>
              Nous avons examiné votre demande d'adhésion à l'AMAME.
              Après délibération, nous ne sommes pas en mesure de l'accepter pour le moment.
            </p>

            %s

            <p style="margin:0 0 24px;font-size:14px;color:%s;line-height:1.6;">
              Nous vous encourageons à soumettre une nouvelle demande en tenant compte de ces éléments.
              N'hésitez pas à nous contacter si vous avez des questions.
            </p>
            """.formatted(TEXT, userPrenom, reasonBlock, MUTED),
            "Soumettre une nouvelle demande",
            adhesionLink
        );

        send(userEmail, subject, body);
    }

    // ── Email : réinitialisation de mot de passe ────────────────────────────

    public void sendPasswordResetEmail(
            String userEmail,
            String userPrenom, String userNom,
            String token) {

        String resetLink = frontendUrl + "/reset-password?token=" + token;
        String subject   = "Réinitialisation de votre mot de passe AMAME";

        String body = layout(
            "Réinitialisation de votre mot de passe",
            """
            <p style="margin:0 0 16px;font-size:15px;color:%s;line-height:1.6;">
              Bonjour <strong>%s</strong>,<br><br>
              Vous avez demandé la réinitialisation du mot de passe de votre compte AMAME.
            </p>

            <div style="background:%s;border-left:4px solid %s;padding:16px 20px;border-radius:0 8px 8px 0;margin-bottom:24px;">
              <p style="margin:0 0 4px;font-size:13px;color:%s;font-weight:600;">
                ⏱ Lien valable pendant <strong>1 heure</strong> uniquement.
              </p>
              <p style="margin:0;font-size:13px;color:%s;">
                Si vous n'êtes pas à l'origine de cette demande, ignorez cet email — votre mot de passe reste inchangé.
              </p>
            </div>

            <p style="margin:0 0 24px;font-size:14px;color:%s;line-height:1.6;">
              Cliquez sur le bouton ci-dessous pour définir un nouveau mot de passe.
            </p>
            """.formatted(TEXT, userPrenom, LIGHT_BG, GREEN, DARK_BG, MUTED, MUTED),
            "Réinitialiser mon mot de passe",
            resetLink
        );

        send(userEmail, subject, body);
    }

    // ── Template HTML partagé ────────────────────────────────────────────────

    private String layout(String title, String contentHtml, String btnLabel, String btnUrl) {
        return """
            <!DOCTYPE html>
            <html lang="fr">
            <head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
            <body style="margin:0;padding:0;background:#f3f4f6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
              <table width="100%%" cellpadding="0" cellspacing="0" style="background:#f3f4f6;padding:32px 16px;">
                <tr><td align="center">
                  <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%%;">

                    <!-- Header -->
                    <tr>
                      <td style="background:%s;padding:28px 32px;border-radius:12px 12px 0 0;text-align:center;">
                        <p style="margin:0;font-size:22px;font-weight:800;color:#ffffff;letter-spacing:-0.5px;">AMAME</p>
                        <p style="margin:4px 0 0;font-size:12px;color:rgba(255,255,255,0.75);letter-spacing:1px;text-transform:uppercase;">
                          Association Malienne pour l'Avancement du Mérite Éducatif
                        </p>
                      </td>
                    </tr>

                    <!-- Body -->
                    <tr>
                      <td style="background:#ffffff;padding:32px;border-left:1px solid #e5e7eb;border-right:1px solid #e5e7eb;">
                        <h2 style="margin:0 0 20px;font-size:20px;font-weight:700;color:%s;">%s</h2>
                        %s
                        <!-- CTA -->
                        <div style="text-align:center;margin-top:8px;">
                          <a href="%s"
                             style="display:inline-block;padding:13px 28px;background:%s;color:#ffffff;text-decoration:none;font-size:14px;font-weight:700;border-radius:10px;">
                            %s
                          </a>
                        </div>
                      </td>
                    </tr>

                    <!-- Footer -->
                    <tr>
                      <td style="background:#f9fafb;padding:20px 32px;border:1px solid #e5e7eb;border-top:none;border-radius:0 0 12px 12px;text-align:center;">
                        <p style="margin:0;font-size:12px;color:#9ca3af;">
                          © 2025 AMAME — Tous droits réservés<br>
                          Cet email a été envoyé automatiquement, merci de ne pas y répondre.
                        </p>
                      </td>
                    </tr>

                  </table>
                </td></tr>
              </table>
            </body>
            </html>
            """.formatted(DARK_BG, TEXT, title, contentHtml, btnUrl, GREEN, btnLabel);
    }

    private String prenom(String prenom, String nom) {
        return prenom + " " + nom;
    }
}
