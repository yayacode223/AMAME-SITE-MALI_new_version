import { useNavigate, Link, Navigate, useLocation, useSearchParams } from "react-router-dom";
import { PhotoBackdrop, BackdropHeader, BackdropCard, BackdropCardTitle } from "@/components/PhotoBackdrop";
import { Helmet } from "react-helmet-async";
import { useAuth } from "@/context/AuthContext";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useEffect, useState } from "react";
import { Button } from "../components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "../components/ui/form";
import { Input } from "../components/ui/input";
import { toast } from "@/hooks/use-toast";
import { Eye, EyeOff, LogIn, Loader2, Clock, Lock } from "lucide-react";
import { clearSessionEnded, REASON_PARAM, REDIRECT_PARAM, safeRedirectPath } from "@/utils/authRedirect";
import { applyFieldErrors, ERROR_MESSAGES, toUserError } from "@/utils/apiError";
import FormAlert from "@/components/FormAlert";

const loginSchema = z.object({
  email: z.string().email({
    message: "Veuillez entrer une adresse email valide.",
  }),
  password: z.string().min(8, {
    message: "Le mot de passe doit contenir au moins 8 caractères.",
  }),
});

// Composant pour l'input de mot de passe avec toggle
const PasswordInput = ({ field, placeholder, disabled, ...props }) => {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="relative">
      <Input
        type={showPassword ? "text" : "password"}
        placeholder={placeholder}
        disabled={disabled}
        {...field}
        className="pr-10 h-12"
        {...props}
      />
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
        onClick={() => setShowPassword(!showPassword)}
        disabled={disabled}
      >
        {showPassword ? (
          <EyeOff className="h-4 w-4 text-gray-500" />
        ) : (
          <Eye className="h-4 w-4 text-gray-500" />
        )}
      </Button>
    </div>
  );
};

/** Bandeau affiché quand on arrive ici sans l'avoir choisi (rapport 05, P2). */
const REASON_NOTICES = {
  acces: { Icon: Lock, text: "Connectez-vous pour accéder à cette page.", tone: "border-green-200 bg-amame-green-subtle text-amame-green-dark" },
  session: { Icon: Clock, text: "Votre session a expiré. Reconnectez-vous pour continuer.", tone: "border-amber-200 bg-amber-50 text-amber-800" },
} as const;

const Login = () => {
  const { login, isLoggingIn, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  // Page à retrouver après la connexion : seulement un chemin du site, sinon l'accueil.
  const target = safeRedirectPath(searchParams.get(REDIRECT_PARAM)) ?? "/";
  const reason = searchParams.get(REASON_PARAM);
  const notice = reason === "acces" || reason === "session" ? REASON_NOTICES[reason] : null;
  // E-mail transmis par la page Adhésion (« Cet e-mail est déjà utilisé. Connectez-vous… »).
  const location = useLocation();
  const prefilledEmail = (location.state as { email?: string } | null)?.email ?? "";
  const [formError, setFormError] = useState<string | null>(null);

  // La raison est déjà dans l'adresse : l'indicateur de session terminée a servi.
  useEffect(() => {
    clearSessionEnded();
  }, []);

  const form = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: prefilledEmail,
      password: "",
    },
  });

  // Déjà connecté (lien gardé, bouton Retour) : directement à la page demandée.
  if (isAuthenticated && !isLoggingIn) {
    return <Navigate to={target} replace />;
  }

  async function onSubmit(values: z.infer<typeof loginSchema>) {
    setFormError(null);
    try {
      await login({
        email: values.email,
        password: values.password,
      });
      toast({
        title: "Connexion réussie 🎉",
        description: "Vous êtes maintenant connecté à votre compte.",
      });
      // replace : le bouton Retour ne ramène pas sur le formulaire de connexion.
      navigate(target, { replace: true });
    } catch (err) {
      // Identifiants refusés (401) seulement : une panne ou une coupure réseau ont leur propre message.
      const error = toUserError(err);
      applyFieldErrors(form.setError, error.fieldErrors, ["email", "password"] as const);
      setFormError(error.status === 401 ? ERROR_MESSAGES.invalidCredentials : error.message);
    }
  }

  return (
    <>
      <Helmet>
        <title>Connexion - AMAME</title>
        <meta
          name="description"
          content="Connectez-vous à votre compte AMAME pour accéder à votre espace membre et aux ressources exclusives."
        />
      </Helmet>

      {/* Photo en fond, carte de connexion au centre, comme Mot de passe oublié (docs/06, R8) */}
      <PhotoBackdrop image="heroes/hero-eleves" className="flex min-h-screen items-center py-8">
        <div className="page-container w-full">
          <div className="mx-auto max-w-md">
            <BackdropHeader to="/" label="Retour au site" />

            <BackdropCard>
              <BackdropCardTitle icon={<LogIn className="h-6 w-6" />} title="Bon retour !">
                Connectez-vous à votre espace AMAME.
              </BackdropCardTitle>

              <div className="px-5 pb-6 pt-5 sm:px-8 sm:pb-8">
                {notice && (
                  <div role="status" className={`mb-5 flex items-start gap-3 rounded-xl border px-4 py-3 text-sm font-medium ${notice.tone}`}>
                    <notice.Icon className="h-4 w-4 shrink-0 mt-0.5" aria-hidden="true" />
                    <p>{notice.text}</p>
                  </div>
                )}

                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">

                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-semibold text-amame-charcoal">
                            Adresse email
                          </FormLabel>
                          <FormControl>
                            <Input
                              placeholder="exemple@gmail.com"
                              type="email"
                              autoComplete="email"
                              disabled={isLoggingIn}
                              {...field}
                              className="h-12 border-amame-border focus:ring-2 focus:ring-amame-green focus:border-amame-green transition-all"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <div className="flex items-center justify-between mb-1.5">
                            <FormLabel className="text-sm font-semibold text-amame-charcoal">
                              Mot de passe
                            </FormLabel>
                            {/* Vert foncé : le vert de la marque ne fait que 3,3:1 sur blanc */}
                            <Link
                              to="/forgot-password"
                              className="text-xs text-amame-green-dark hover:text-amame-green-deep font-semibold transition-colors"
                            >
                              Mot de passe oublié ?
                            </Link>
                          </div>
                          <FormControl>
                            <PasswordInput
                              field={field}
                              placeholder="••••••••"
                              disabled={isLoggingIn}
                              autoComplete="current-password"
                              className="transition-all duration-200 focus:ring-2 focus:ring-amame-green focus:border-amame-green"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormAlert message={formError} />

                    <Button
                      type="submit"
                      disabled={isLoggingIn}
                      className="w-full h-12 bg-amame-green-dark hover:bg-amame-green-deep text-white font-semibold text-base rounded-xl transition-all duration-200 hover:shadow-lg shadow-green"
                    >
                      {isLoggingIn ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Connexion en cours...
                        </>
                      ) : (
                        <>
                          <LogIn className="mr-2 h-4 w-4" />
                          Se connecter
                        </>
                      )}
                    </Button>

                  </form>
                </Form>

                <div className="mt-6 pt-5 border-t border-gray-100 text-center">
                  <p className="text-sm text-amame-muted">
                    Pas encore membre ?{" "}
                    <Link
                      to="/adhesion"
                      className="font-semibold text-amame-green-dark hover:text-amame-green-deep transition-colors"
                    >
                      Adhérer à l'AMAME
                    </Link>
                  </p>
                </div>
              </div>
            </BackdropCard>
          </div>
        </div>
      </PhotoBackdrop>
    </>
  );
};

export default Login;
