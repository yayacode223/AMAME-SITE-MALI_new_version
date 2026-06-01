import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAuth } from "@/context/AuthContext";
import {
  useRegisterAndSubmitAdhesion,
  useSubmitAdhesion,
  useGetAdhesionStatus,
} from "@/service/adhesionService";
import { ADHESION_STATUS_LABELS } from "@/types/adhesionType";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import SEO from "@/components/SEO";
import { toast } from "@/hooks/use-toast";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  CheckCircleIcon,
  ClockIcon,
  XCircleIcon,
  UserGroupIcon,
  AcademicCapIcon,
  TrophyIcon,
  GlobeAltIcon,
  EyeIcon,
  EyeSlashIcon,
} from "@heroicons/react/24/outline";
import { CheckCircleIcon as CheckCircleSolid } from "@heroicons/react/24/solid";

// ── Schéma de validation ────────────────────────────────────────────────────

const registerSchema = z
  .object({
    nom: z.string().min(2, "Au moins 2 caractères"),
    prenom: z.string().min(2, "Au moins 2 caractères"),
    email: z.string().email("Email invalide"),
    password: z
      .string()
      .min(8, "Au moins 8 caractères")
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
        "Doit contenir une majuscule, une minuscule et un chiffre",
      ),
    confirmPassword: z.string(),
    ville: z.string().optional(),
    phone: z.string().optional(),
    acceptConditions: z.boolean().refine((v) => v, {
      message: "Vous devez accepter les conditions d'adhésion",
    }),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: "Les mots de passe ne correspondent pas",
    path: ["confirmPassword"],
  });

type RegisterFormValues = z.infer<typeof registerSchema>;

// ── Avantages sidebar ───────────────────────────────────────────────────────

const AVANTAGES = [
  { icon: AcademicCapIcon, title: "Ressources exclusives", desc: "Accès prioritaire aux bourses et concours réservés aux membres." },
  { icon: TrophyIcon,       title: "Réseau AMAME",          desc: "Rejoignez une communauté d'étudiants maliens d'excellence." },
  { icon: GlobeAltIcon,     title: "Accompagnement",        desc: "Soutien de nos conseillers pour votre orientation académique." },
  { icon: UserGroupIcon,    title: "Événements membres",    desc: "Séminaires, ateliers et rencontres organisés par l'AMAME." },
];

// ── Composant principal ─────────────────────────────────────────────────────

export default function Adhesion() {
  const { user, isAuthenticated, isUserLoading } = useAuth();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  // Statut adhésion pour utilisateurs déjà connectés
  const { data: adhesionStatus, isLoading: isLoadingStatus } = useGetAdhesionStatus({
    enabled: isAuthenticated,
  });

  // Mutation pour le formulaire public (inscription + adhésion)
  const registerMutation = useRegisterAndSubmitAdhesion();

  // Motivation pour utilisateurs déjà connectés (USER sans adhésion active)
  const [motivation, setMotivation] = useState("");
  const submitMutation = useSubmitAdhesion();

  const form = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      nom: "", prenom: "", email: "", password: "", confirmPassword: "",
      ville: "", phone: "", acceptConditions: false,
    },
  });

  // ── Soumission du formulaire public ──────────────────────────────────────

  const onSubmit = async (data: RegisterFormValues) => {
    try {
      await registerMutation.mutateAsync({
        nom: data.nom,
        prenom: data.prenom,
        email: data.email,
        password: data.password,
        ville: data.ville || undefined,
        phone: data.phone || undefined,
        acceptConditions: data.acceptConditions,
      });
      setSubmitted(true);
    } catch (err: any) {
      const msg = err?.response?.data?.message || "Une erreur est survenue.";
      toast({ title: "Erreur", description: msg, variant: "destructive" });
    }
  };

  // ── Soumission pour utilisateur connecté (motivation) ────────────────────

  const handleSubmitMotivation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (motivation.trim().length < 10) {
      toast({ title: "Message trop court", description: "Écrivez au moins 10 caractères.", variant: "destructive" });
      return;
    }
    try {
      await submitMutation.mutateAsync({ motivation: motivation.trim() });
      toast({ title: "Demande envoyée !", description: "Votre demande est en cours d'examen." });
    } catch (err: any) {
      const msg = err?.response?.data?.message || "Une erreur est survenue.";
      toast({ title: "Erreur", description: msg, variant: "destructive" });
    }
  };

  // ── Rendu du bloc droit selon contexte ────────────────────────────────────

  const renderContent = () => {
    // Loading
    if (isUserLoading || isLoadingStatus) {
      return (
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin h-8 w-8 border-2 border-amame-green border-t-transparent rounded-full" />
        </div>
      );
    }

    // Déjà approuvé (MEMBER)
    if (user?.role === "MEMBER") {
      return (
        <div className="text-center py-14">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-amame-green-subtle rounded-full mb-6">
            <CheckCircleSolid className="h-12 w-12 text-amame-green" />
          </div>
          <h2 className="font-nunito font-bold text-2xl text-amame-charcoal mb-3">Vous êtes membre AMAME !</h2>
          <p className="text-amame-muted mb-6 max-w-sm mx-auto text-sm leading-relaxed">
            Votre adhésion a été approuvée. Accédez à votre espace membre.
          </p>
          <Link to="/membre/dashboard"
            className="inline-flex items-center gap-2 px-6 py-3 bg-amame-green text-white font-semibold rounded-xl hover:bg-amame-green-dark transition-colors shadow-green">
            <UserGroupIcon className="h-5 w-5" />
            Mon espace membre
          </Link>
        </div>
      );
    }

    // Demande en attente
    if (adhesionStatus?.status === "PENDING") {
      return (
        <div className="text-center py-14">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-yellow-50 rounded-2xl mb-5">
            <ClockIcon className="h-8 w-8 text-yellow-500" />
          </div>
          <h2 className="font-nunito font-bold text-xl text-amame-charcoal mb-3">Demande en cours d'examen</h2>
          <p className="text-amame-muted text-sm mb-4 max-w-sm mx-auto leading-relaxed">
            Votre demande d'adhésion a bien été reçue. Notre équipe vous répondra par email.
          </p>
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold border bg-yellow-50 text-yellow-700 border-yellow-200">
            <ClockIcon className="h-3.5 w-3.5" />
            {ADHESION_STATUS_LABELS.PENDING}
          </div>
          {adhesionStatus.createdAt && (
            <p className="text-xs text-amame-muted mt-3">
              Soumise le {new Date(adhesionStatus.createdAt).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}
            </p>
          )}
        </div>
      );
    }

    // Succès après soumission du formulaire public
    if (submitted) {
      return (
        <div className="text-center py-14">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-amame-green-subtle rounded-full mb-6">
            <CheckCircleSolid className="h-12 w-12 text-amame-green" />
          </div>
          <h2 className="font-nunito font-bold text-2xl text-amame-charcoal mb-3">Demande envoyée !</h2>
          <p className="text-amame-muted mb-2 max-w-sm mx-auto text-sm leading-relaxed">
            Votre demande d'adhésion a bien été soumise. Vous recevrez un email dès qu'elle sera traitée.
          </p>
          <p className="text-amame-muted max-w-sm mx-auto text-sm mb-8">
            En attendant, vous pouvez vous connecter avec l'adresse email et le mot de passe que vous venez de définir.
          </p>
          <Link to="/login"
            className="inline-flex items-center gap-2 px-6 py-3 bg-amame-green text-white font-semibold rounded-xl hover:bg-amame-green-dark transition-colors shadow-green">
            Se connecter
          </Link>
        </div>
      );
    }

    // Demande rejetée (peut repostuler via motivation)
    if (adhesionStatus?.status === "REJECTED" && isAuthenticated) {
      return (
        <div className="space-y-5">
          <div className="p-4 bg-red-50 border border-red-200 rounded-2xl flex gap-3">
            <XCircleIcon className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-red-700 mb-1">Demande précédente rejetée</p>
              {adhesionStatus.rejectionReason && (
                <p className="text-sm text-red-600 mb-1">{adhesionStatus.rejectionReason}</p>
              )}
              <p className="text-xs text-red-500">Vous pouvez soumettre une nouvelle demande.</p>
            </div>
          </div>
          {renderMotivationForm()}
        </div>
      );
    }

    // Utilisateur connecté (USER) sans adhésion active
    if (isAuthenticated && user?.role === "USER") {
      return renderMotivationForm();
    }

    // Non connecté → formulaire d'inscription principal
    return renderRegisterForm();
  };

  // ── Formulaire d'inscription public ─────────────────────────────────────

  const renderRegisterForm = () => (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormField control={form.control} name="prenom" render={({ field }) => (
            <FormItem>
              <FormLabel className="text-sm font-semibold text-amame-charcoal">Prénom <span className="text-red-500">*</span></FormLabel>
              <FormControl>
                <Input {...field} placeholder="Ex : Amadou"
                  className="border-amame-border rounded-xl focus-visible:ring-amame-green focus-visible:border-amame-green" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )} />
          <FormField control={form.control} name="nom" render={({ field }) => (
            <FormItem>
              <FormLabel className="text-sm font-semibold text-amame-charcoal">Nom <span className="text-red-500">*</span></FormLabel>
              <FormControl>
                <Input {...field} placeholder="Ex : Traoré"
                  className="border-amame-border rounded-xl focus-visible:ring-amame-green focus-visible:border-amame-green" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )} />
        </div>

        <FormField control={form.control} name="email" render={({ field }) => (
          <FormItem>
            <FormLabel className="text-sm font-semibold text-amame-charcoal">Email <span className="text-red-500">*</span></FormLabel>
            <FormControl>
              <Input {...field} type="email" placeholder="votre@email.com"
                className="border-amame-border rounded-xl focus-visible:ring-amame-green focus-visible:border-amame-green" />
            </FormControl>
            <FormMessage />
          </FormItem>
        )} />

        <FormField control={form.control} name="password" render={({ field }) => (
          <FormItem>
            <FormLabel className="text-sm font-semibold text-amame-charcoal">Mot de passe <span className="text-red-500">*</span></FormLabel>
            <FormControl>
              <div className="relative">
                <Input {...field} type={showPassword ? "text" : "password"}
                  placeholder="Min. 8 caractères"
                  className="border-amame-border rounded-xl focus-visible:ring-amame-green focus-visible:border-amame-green pr-10" />
                <button type="button" onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-amame-muted hover:text-amame-charcoal transition-colors">
                  {showPassword ? <EyeSlashIcon className="h-4 w-4" /> : <EyeIcon className="h-4 w-4" />}
                </button>
              </div>
            </FormControl>
            <FormMessage />
          </FormItem>
        )} />

        <FormField control={form.control} name="confirmPassword" render={({ field }) => (
          <FormItem>
            <FormLabel className="text-sm font-semibold text-amame-charcoal">Confirmer le mot de passe <span className="text-red-500">*</span></FormLabel>
            <FormControl>
              <div className="relative">
                <Input {...field} type={showConfirm ? "text" : "password"}
                  placeholder="Répétez le mot de passe"
                  className="border-amame-border rounded-xl focus-visible:ring-amame-green focus-visible:border-amame-green pr-10" />
                <button type="button" onClick={() => setShowConfirm(!showConfirm)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-amame-muted hover:text-amame-charcoal transition-colors">
                  {showConfirm ? <EyeSlashIcon className="h-4 w-4" /> : <EyeIcon className="h-4 w-4" />}
                </button>
              </div>
            </FormControl>
            <FormMessage />
          </FormItem>
        )} />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormField control={form.control} name="ville" render={({ field }) => (
            <FormItem>
              <FormLabel className="text-sm font-semibold text-amame-charcoal">Ville <span className="text-amame-muted font-normal text-xs">(optionnel)</span></FormLabel>
              <FormControl>
                <Input {...field} placeholder="Ex : Bamako"
                  className="border-amame-border rounded-xl focus-visible:ring-amame-green focus-visible:border-amame-green" />
              </FormControl>
            </FormItem>
          )} />
          <FormField control={form.control} name="phone" render={({ field }) => (
            <FormItem>
              <FormLabel className="text-sm font-semibold text-amame-charcoal">Téléphone <span className="text-amame-muted font-normal text-xs">(optionnel)</span></FormLabel>
              <FormControl>
                <Input {...field} placeholder="Ex : +223 70 000 000"
                  className="border-amame-border rounded-xl focus-visible:ring-amame-green focus-visible:border-amame-green" />
              </FormControl>
            </FormItem>
          )} />
        </div>

        {/* Conditions d'adhésion */}
        <FormField control={form.control} name="acceptConditions" render={({ field }) => (
          <FormItem>
            <div className="flex items-start gap-3 p-4 bg-amame-green-subtle/40 border border-amame-green/20 rounded-xl">
              <FormControl>
                <Checkbox
                  checked={field.value}
                  onCheckedChange={field.onChange}
                  className="mt-0.5 data-[state=checked]:bg-amame-green data-[state=checked]:border-amame-green"
                />
              </FormControl>
              <div className="text-sm text-amame-slate leading-relaxed">
                J'accepte les{" "}
                <button type="button"
                  className="text-amame-green underline underline-offset-2 hover:text-amame-green-dark font-medium">
                  conditions d'adhésion
                </button>{" "}
                et la{" "}
                <button type="button"
                  className="text-amame-green underline underline-offset-2 hover:text-amame-green-dark font-medium">
                  politique de confidentialité
                </button>{" "}
                de l'AMAME.
              </div>
            </div>
            <FormMessage />
          </FormItem>
        )} />

        <button type="submit" disabled={registerMutation.isPending}
          className="w-full py-3 px-5 bg-amame-green text-white font-semibold rounded-xl hover:bg-amame-green-dark transition-colors shadow-green disabled:opacity-50 disabled:cursor-not-allowed text-sm">
          {registerMutation.isPending ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
              </svg>
              Envoi en cours...
            </span>
          ) : "Soumettre ma demande d'adhésion"}
        </button>

        <p className="text-center text-xs text-amame-muted">
          Déjà inscrit ?{" "}
          <Link to="/login" className="text-amame-green hover:text-amame-green-dark font-semibold underline underline-offset-2">
            Se connecter
          </Link>
        </p>
      </form>
    </Form>
  );

  // ── Formulaire de motivation (utilisateur connecté) ──────────────────────

  const renderMotivationForm = () => (
    <form onSubmit={handleSubmitMotivation} className="space-y-4">
      <div className="p-4 bg-amame-green-subtle/50 border border-amame-green/15 rounded-xl flex items-start gap-3">
        <CheckCircleIcon className="h-5 w-5 text-amame-green shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-semibold text-amame-green-dark">Bonjour {user?.prenom} !</p>
          <p className="text-xs text-amame-muted mt-0.5">
            Vous avez déjà un compte. Partagez brièvement votre motivation pour rejoindre l'AMAME.
          </p>
        </div>
      </div>
      <div>
        <label htmlFor="motivation" className="block text-sm font-semibold text-amame-charcoal mb-1.5">
          Message de motivation <span className="text-red-500">*</span>
        </label>
        <textarea id="motivation" rows={5} required value={motivation}
          onChange={(e) => setMotivation(e.target.value)}
          placeholder="Expliquez pourquoi vous souhaitez rejoindre l'AMAME..."
          className="w-full border border-amame-border rounded-xl py-3 px-4 text-sm text-amame-charcoal focus:outline-none focus:ring-1 focus:ring-amame-green focus:border-amame-green transition-colors bg-white resize-none placeholder-amame-muted/50" />
        <span className={`text-xs mt-1 block ${motivation.length < 10 ? "text-red-500" : "text-amame-muted"}`}>
          {motivation.length} caractère{motivation.length > 1 ? "s" : ""}
        </span>
      </div>
      <button type="submit" disabled={submitMutation.isPending || motivation.trim().length < 10}
        className="w-full py-3 px-5 bg-amame-green text-white font-semibold rounded-xl hover:bg-amame-green-dark transition-colors shadow-green disabled:opacity-50 disabled:cursor-not-allowed text-sm">
        {submitMutation.isPending ? "Envoi..." : "Soumettre ma demande"}
      </button>
    </form>
  );

  // ── Rendu page ───────────────────────────────────────────────────────────

  return (
    <>
      <SEO
        title="Adhérer à l'AMAME"
        description="Rejoignez la communauté AMAME et accédez à des ressources exclusives pour les étudiants maliens."
        path="/adhesion"
      />
      <Navbar />
      <div className="min-h-screen bg-amame-surface">

        {/* Hero */}
        <div
          className="relative overflow-hidden py-16 sm:py-24 hero-bg-image"
          style={{ backgroundImage: "url(/images/heroes/hero-adhesion.png)" }}
        >
          {/* Overlay vert allégé — image visible en texture, texte blanc lisible */}
          <div className="absolute inset-0 bg-gradient-to-br from-amame-green-darker/72 via-amame-green-dark/58 to-amame-green/42 pointer-events-none" />
          {/* Vignette basse pour transition douce avec le contenu */}
          <div className="absolute bottom-0 inset-x-0 h-16 bg-gradient-to-t from-amame-surface to-transparent pointer-events-none" />

          <div className="relative z-10 container mx-auto px-4 sm:px-6 lg:px-8 text-center max-w-2xl">
            <div className="inline-flex items-center gap-2 bg-white/15 backdrop-blur-sm text-white text-xs font-semibold px-4 py-2 rounded-full mb-5 border border-white/20">
              <UserGroupIcon className="h-4 w-4" />
              Communauté AMAME
            </div>
            <h1 className="font-nunito font-black text-3xl sm:text-5xl text-white mb-4 leading-tight drop-shadow-sm">
              Adhérer à l'AMAME
            </h1>
            <p className="text-green-100/90 text-base sm:text-lg leading-relaxed max-w-xl mx-auto">
              Rejoignez l'Association Malienne pour l'Avancement du Mérite Éducatif
              et profitez d'un réseau unique d'excellence.
            </p>
          </div>
        </div>

        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-10 max-w-5xl">
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">

            {/* ── Avantages sidebar ── */}
            <div className="lg:col-span-2 space-y-4">
              <h2 className="font-nunito font-bold text-lg text-amame-charcoal mb-5">
                Pourquoi adhérer ?
              </h2>
              {AVANTAGES.map(({ icon: Icon, title, desc }) => (
                <div key={title} className="flex gap-3 p-4 bg-white rounded-2xl border border-amame-border shadow-card">
                  <div className="w-9 h-9 bg-amame-green-subtle rounded-xl flex items-center justify-center shrink-0">
                    <Icon className="h-5 w-5 text-amame-green" />
                  </div>
                  <div>
                    <p className="font-semibold text-sm text-amame-charcoal mb-0.5">{title}</p>
                    <p className="text-xs text-amame-muted leading-relaxed">{desc}</p>
                  </div>
                </div>
              ))}

              {/* Processus */}
              <div className="p-4 bg-amame-gold-subtle border border-amame-gold/20 rounded-2xl">
                <p className="font-semibold text-sm text-amame-charcoal mb-3">Processus d'adhésion</p>
                {[
                  "Remplissez le formulaire",
                  "Examen par notre équipe (≤ 7 jours)",
                  "Email de confirmation",
                  "Accès à l'espace membre",
                ].map((step, i) => (
                  <div key={i} className="flex items-start gap-2.5 mb-2 last:mb-0">
                    <span className="w-5 h-5 rounded-full bg-amame-gold text-white text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                      {i + 1}
                    </span>
                    <span className="text-xs text-amame-slate leading-snug">{step}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* ── Formulaire / Statut ── */}
            <div className="lg:col-span-3">
              <div className="bg-white rounded-2xl border border-amame-border shadow-card p-6 sm:p-8">
                <h2 className="font-nunito font-bold text-xl text-amame-charcoal mb-6">
                  {!isAuthenticated ? "Créer mon compte & adhérer" : "Ma demande d'adhésion"}
                </h2>
                {renderContent()}
              </div>
            </div>

          </div>
        </div>
      </div>
      <Footer />
    </>
  );
}
