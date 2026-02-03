import React from "react";
import { useNavigate, Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { useAuth } from "@/context/AuthContext";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useState } from "react";
import { Button } from "../components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
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
import { Eye, EyeOff, LogIn, Loader2, ArrowLeft } from "lucide-react";

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

      <div className="bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 py-2">
        <div className="container mx-auto px-4 sm:px-6 lg:px-6">
          {/* En-tête */}
          <div className="text-center mb-6">
            {/* Bouton Retour et Logo */}
            <div className="flex justify-between items-center mb-4">
              <Button variant="ghost" asChild className="text-sm">
                <Link to="/">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Retour à l'accueil
                </Link>
              </Button>
              
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-white rounded-xl shadow-sm border border-gray-100 flex items-center justify-center">
                <img
                  src="/amame-uploads/24ceb186-cbc8-4d01-99bd-635d9bd2df31.png"
                  alt="AMAME Logo"
                  className="w-6 h-6 sm:w-8 sm:h-8"
                />
              </div>
            </div>

            {/* Titre et description */}
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-2 sm:mb-3">
              Connectez-vous à l'<span className="text-purple-600">AMAME</span>
            </h1>
            <p className="text-sm sm:text-lg text-gray-600 max-w-2xl mx-auto px-2">
              Accédez à votre espace membre et aux ressources exclusives
            </p>
          </div>

          <div className="max-w-md mx-auto">
            {/* Carte de connexion */}
            <Card className="shadow-xl border-0 rounded-2xl overflow-hidden">
              <div className="bg-gradient-to-r from-purple-600 to-purple-700 h-2 w-full"></div>
              <CardHeader className="text-center">
                <div className="mx-auto w-12 bg-purple-100 rounded-full flex items-center justify-center mb-4">
                  <LogIn className="h-6 w-6 text-purple-600" />
                </div>
                <CardTitle className="text-2xl font-bold text-gray-900">
                  Connexion
                </CardTitle>
                <CardDescription className="text-gray-600">
                  Entrez vos identifiants pour accéder à votre compte
                </CardDescription>
              </CardHeader>
              
              <CardContent>
                <Form {...form}>
                  <form
                    onSubmit={form.handleSubmit(onSubmit)}
                    className="space-y-6"
                  >
                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-gray-700 font-medium">
                            Adresse Email
                          </FormLabel>
                          <FormControl>
                            <Input
                              placeholder="exemple@gmail.com"
                              type="email"
                              autoComplete="email"
                              disabled={isLoggingIn}
                              {...field}
                              className="h-12 transition-all duration-200 focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
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
                          <div className="flex items-center justify-between">
                            <FormLabel className="text-gray-700 font-medium">
                              Mot de passe
                            </FormLabel>
                            <Link
                              to="/forgot-password"
                              className="text-sm text-purple-600 hover:text-purple-700 font-medium transition-colors"
                            >
                              Mot de passe oublié ?
                            </Link>
                          </div>
                          <FormControl>
                            <PasswordInput 
                              field={field}
                              placeholder="••••••••"
                              disabled={isLoggingIn}
                              className="transition-all duration-200 focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <Button 
                      type="submit" 
                      disabled={isLoggingIn}
                      className="w-full h-12 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white font-semibold text-base rounded-lg transition-all duration-200 hover:shadow-lg transform hover:-translate-y-0.5"
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
              </CardContent>

              <CardFooter className="flex flex-col border-t border-gray-100 pt-2">
                <div className="text-center space-y-4">
                  <p className="text-sm text-gray-600">
                    Vous n'avez pas de compte ?{" "}
                    <Link
                      to="/register"
                      className="font-semibold text-purple-600 hover:text-purple-700 transition-colors"
                    >
                      Créer un compte
                    </Link>
                  </p>                    
                </div>
              </CardFooter>
            </Card>
          </div>
        </div>
      </div>
    </>
  );
};

export default Login;