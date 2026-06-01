import { useNavigate, Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { useAuth } from "@/context/AuthContext";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useState } from "react";
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
import { Eye, EyeOff, LogIn, Loader2, ArrowLeft, Star } from "lucide-react";

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

const Login = () => {
  const { login, isLoggingIn } = useAuth();
  const navigate = useNavigate();

  const form = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  async function onSubmit(values: z.infer<typeof loginSchema>) {
    try {
      await login({
        email: values.email,
        password: values.password,
      });
      toast({
        title: "Connexion réussie 🎉",
        description: "Vous êtes maintenant connecté à votre compte.",
      });
      navigate("/");
    } catch (error) {
      console.error("Login error:", error);
      toast({
        variant: "destructive",
        title: "Erreur de connexion",
        description: "Email ou mot de passe incorrect.",
      });
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

      <div className="min-h-screen flex flex-col lg:flex-row">

        {/* ── Panneau gauche : image hero + branding (desktop) ───────────── */}
        <div className="hidden lg:flex lg:w-[55%] xl:w-[60%] relative overflow-hidden flex-col bg-[url('/images/heroes/hero-homepage.png')] bg-cover bg-no-repeat [background-position:center_right_10%]">
          {/* Overlay vert — allégé pour laisser l'image transparaître tout en gardant le texte blanc lisible */}
          <div className="absolute inset-0 bg-gradient-to-br from-amame-green-darker/78 via-amame-green-dark/65 to-amame-green/42 pointer-events-none" />

          <div className="relative z-10 flex flex-col justify-between h-full p-10 xl:p-14">

            {/* Logo + retour */}
            <div className="flex items-center justify-between">
              <Link to="/" className="flex items-center gap-2.5 group">
                <img
                  src="/amame-uploads/amame-logo.webp"
                  alt="AMAME"
                  className="h-10 w-10 rounded-full object-cover ring-2 ring-white/25 group-hover:ring-white/50 transition-all"
                />
                <span className="font-nunito font-bold text-xl text-white">AMAME</span>
              </Link>
              <Link
                to="/"
                className="flex items-center gap-1.5 text-white/65 hover:text-white text-sm font-medium transition-colors"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                Retour au site
              </Link>
            </div>

            {/* Contenu central */}
            <div>
              <div className="inline-flex items-center gap-2 bg-white/15 backdrop-blur-sm text-white text-xs font-semibold px-4 py-2 rounded-full mb-7 border border-white/20">
                <Star className="h-3.5 w-3.5 text-amame-gold fill-amame-gold" />
                Excellence Académique au Mali depuis 2023
              </div>

              <h1 className="font-nunito font-black text-4xl xl:text-5xl text-white leading-[1.15] mb-5">
                Votre Passerelle
                <span className="block text-amame-gold mt-1">vers l'Excellence</span>
              </h1>

              <p className="text-white/75 text-base xl:text-lg leading-relaxed max-w-md">
                Accédez à votre espace membre et profitez de toutes les ressources,
                bourses et opportunités disponibles pour les étudiants maliens.
              </p>

              {/* Stats */}
              <div className="flex gap-8 mt-10 pt-8 border-t border-white/20">
                {[
                  { value: "500+", label: "Étudiants accompagnés" },
                  { value: "200+", label: "Bourses référencées" },
                  { value: "100%", label: "Gratuit & bénévole" },
                ].map(({ value, label }) => (
                  <div key={label}>
                    <p className="font-nunito font-black text-2xl text-white">{value}</p>
                    <p className="text-white/55 text-xs mt-0.5 leading-tight">{label}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Pied */}
            <p className="text-white/35 text-xs">
              © {new Date().getFullYear()} AMAME. Tous droits réservés.
            </p>
          </div>
        </div>

        {/* ── Panneau droit : formulaire ──────────────────────────────────── */}
        <div className="flex-1 flex flex-col bg-white">

          {/* Bandeau mobile : image + logo */}
          <div className="lg:hidden relative h-36 overflow-hidden shrink-0 bg-[url('/images/heroes/hero-homepage.png')] bg-cover bg-center">
            <div className="absolute inset-0 bg-gradient-to-br from-amame-green-darker/72 to-amame-green/50" />
            <div className="relative z-10 flex items-center justify-between px-5 pt-5">
              <Link to="/" className="flex items-center gap-1.5 text-white/75 hover:text-white text-sm transition-colors">
                <ArrowLeft className="h-4 w-4" />
                Accueil
              </Link>
              <div className="flex items-center gap-2">
                <img src="/amame-uploads/amame-logo.webp" alt="AMAME" className="h-7 w-7 rounded-full ring-2 ring-white/30 object-cover" />
                <span className="font-nunito font-bold text-white text-sm">AMAME</span>
              </div>
            </div>
            <div className="relative z-10 px-5 pt-3">
              <p className="font-nunito font-black text-2xl text-white leading-tight">Bon retour !</p>
              <p className="text-white/70 text-xs mt-0.5">Connectez-vous à votre espace</p>
            </div>
          </div>

          {/* Zone formulaire */}
          <div className="flex-1 flex items-center justify-center px-6 sm:px-10 py-10 lg:py-0">
            <div className="w-full max-w-[400px]">

              {/* Header desktop */}
              <div className="hidden lg:block mb-10">
                <h2 className="font-nunito font-black text-3xl text-amame-charcoal mb-2">
                  Bon retour !
                </h2>
                <p className="text-amame-muted text-sm">
                  Entrez vos identifiants pour accéder à votre compte
                </p>
              </div>

              {/* Formulaire */}
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">

                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-semibold text-amame-charcoal">
                          Adresse Email
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
                          <Link
                            to="/forgot-password"
                            className="text-xs text-amame-green hover:text-amame-green-dark font-semibold transition-colors"
                          >
                            Mot de passe oublié ?
                          </Link>
                        </div>
                        <FormControl>
                          <PasswordInput
                            field={field}
                            placeholder="••••••••"
                            disabled={isLoggingIn}
                            className="transition-all duration-200 focus:ring-2 focus:ring-amame-green focus:border-amame-green"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Button
                    type="submit"
                    disabled={isLoggingIn}
                    className="w-full h-12 bg-amame-green hover:bg-amame-green-dark text-white font-semibold text-base rounded-xl transition-all duration-200 hover:shadow-lg shadow-green mt-2"
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

              {/* Footer form */}
              <div className="mt-6 pt-5 border-t border-gray-100 text-center">
                <p className="text-sm text-amame-muted">
                  Pas encore membre ?{" "}
                  <Link
                    to="/adhesion"
                    className="font-semibold text-amame-green hover:text-amame-green-dark transition-colors"
                  >
                    Adhérer à l'AMAME
                  </Link>
                </p>
              </div>

            </div>
          </div>
        </div>

      </div>
    </>
  );
};

export default Login;
