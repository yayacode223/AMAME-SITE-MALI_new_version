import { useState } from "react";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Helmet } from "react-helmet-async";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useResetPassword } from "@/service/passwordResetService";
import { ArrowLeft, KeyRound, Eye, EyeOff, Loader2, CheckCircle, AlertCircle } from "lucide-react";

const schema = z
  .object({
    newPassword: z
      .string()
      .min(8, "Au moins 8 caractères")
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
        "Doit contenir une majuscule, une minuscule et un chiffre",
      ),
    confirmPassword: z.string(),
  })
  .refine((d) => d.newPassword === d.confirmPassword, {
    message: "Les mots de passe ne correspondent pas",
    path: ["confirmPassword"],
  });

type FormValues = z.infer<typeof schema>;

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get("token");

  const [showPassword, setShowPassword]   = useState(false);
  const [showConfirm, setShowConfirm]     = useState(false);
  const [success, setSuccess]             = useState(false);
  const [errorMsg, setErrorMsg]           = useState<string | null>(null);

  const mutation = useResetPassword();

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { newPassword: "", confirmPassword: "" },
  });

  const onSubmit = async ({ newPassword }: FormValues) => {
    if (!token) return;
    setErrorMsg(null);
    try {
      await mutation.mutateAsync({ token, newPassword });
      setSuccess(true);
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ||
        "Une erreur est survenue. Veuillez réessayer.";
      setErrorMsg(msg);
    }
  };

  // ── Token absent dans l'URL ───────────────────────────────────────────────
  if (!token) {
    return (
      <div className="min-h-screen bg-amame-surface flex items-center justify-center px-4">
        <Card className="shadow-xl border-0 rounded-2xl overflow-hidden max-w-md w-full">
          <div className="bg-gradient-to-r from-red-500 to-red-600 h-1.5 w-full" />
          <div className="p-8 text-center">
            <div className="inline-flex items-center justify-center w-14 h-14 bg-red-50 rounded-full mb-4">
              <AlertCircle className="h-7 w-7 text-red-500" />
            </div>
            <h2 className="font-nunito font-bold text-xl text-amame-charcoal mb-2">
              Lien invalide
            </h2>
            <p className="text-sm text-amame-muted mb-6">
              Ce lien de réinitialisation est invalide ou incomplet.
            </p>
            <Button asChild className="bg-amame-green hover:bg-amame-green-dark text-white rounded-xl">
              <Link to="/forgot-password">Faire une nouvelle demande</Link>
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>Nouveau mot de passe — AMAME</title>
      </Helmet>

      <div className="min-h-screen bg-amame-surface flex items-center py-8">
        <div className="container mx-auto px-4 sm:px-6 lg:px-6">

          {/* En-tête */}
          <div className="flex justify-between items-center mb-8 max-w-md mx-auto">
            <Button variant="ghost" asChild className="text-sm">
              <Link to="/login">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Retour à la connexion
              </Link>
            </Button>
            <div className="w-10 h-10 bg-white rounded-xl shadow-sm border border-gray-100 flex items-center justify-center">
              <img src="/amame-uploads/amame-logo.webp" alt="AMAME" className="w-7 h-7" />
            </div>
          </div>

          <div className="max-w-md mx-auto">
            <Card className="shadow-xl border-0 rounded-2xl overflow-hidden">
              <div className="bg-gradient-to-r from-amame-green to-amame-green-dark h-1.5 w-full" />

              {success ? (
                /* ── État succès ── */
                <div className="p-8 text-center">
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-amame-green-subtle rounded-full mb-5">
                    <CheckCircle className="h-8 w-8 text-amame-green" />
                  </div>
                  <h2 className="font-nunito font-black text-xl text-amame-charcoal mb-3">
                    Mot de passe mis à jour !
                  </h2>
                  <p className="text-sm text-amame-muted leading-relaxed mb-7">
                    Votre mot de passe a été réinitialisé avec succès.
                    Vous pouvez maintenant vous connecter avec votre nouveau mot de passe.
                  </p>
                  <Button
                    onClick={() => navigate("/login")}
                    className="bg-amame-green hover:bg-amame-green-dark text-white font-semibold rounded-xl px-8 shadow-green"
                  >
                    Se connecter
                  </Button>
                </div>
              ) : (
                /* ── Formulaire ── */
                <>
                  <CardHeader className="text-center pb-2">
                    <div className="mx-auto w-12 h-12 bg-amame-green-subtle rounded-full flex items-center justify-center mb-4">
                      <KeyRound className="h-6 w-6 text-amame-green" />
                    </div>
                    <CardTitle className="text-2xl font-bold text-gray-900">
                      Nouveau mot de passe
                    </CardTitle>
                    <CardDescription className="text-gray-600 text-sm mt-1">
                      Choisissez un mot de passe sécurisé pour votre compte.
                    </CardDescription>
                  </CardHeader>

                  <CardContent className="pt-4">
                    {/* Erreur backend */}
                    {errorMsg && (
                      <div className="flex items-start gap-3 p-3.5 mb-5 bg-red-50 border border-red-200 rounded-xl">
                        <AlertCircle className="h-4 w-4 text-red-500 shrink-0 mt-0.5" />
                        <div>
                          <p className="text-sm text-red-700">{errorMsg}</p>
                          {(errorMsg.includes("expiré") || errorMsg.includes("utilisé")) && (
                            <Link
                              to="/forgot-password"
                              className="text-xs text-red-600 underline underline-offset-2 font-medium mt-1 inline-block"
                            >
                              Faire une nouvelle demande →
                            </Link>
                          )}
                        </div>
                      </div>
                    )}

                    <Form {...form}>
                      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
                        <FormField
                          control={form.control}
                          name="newPassword"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-gray-700 font-medium">
                                Nouveau mot de passe
                              </FormLabel>
                              <FormControl>
                                <div className="relative">
                                  <Input
                                    type={showPassword ? "text" : "password"}
                                    placeholder="Min. 8 caractères"
                                    disabled={mutation.isPending}
                                    {...field}
                                    className="h-12 pr-10 focus:ring-2 focus:ring-amame-green focus:border-amame-green"
                                  />
                                  <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                                  >
                                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                  </button>
                                </div>
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="confirmPassword"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-gray-700 font-medium">
                                Confirmer le mot de passe
                              </FormLabel>
                              <FormControl>
                                <div className="relative">
                                  <Input
                                    type={showConfirm ? "text" : "password"}
                                    placeholder="Répétez le mot de passe"
                                    disabled={mutation.isPending}
                                    {...field}
                                    className="h-12 pr-10 focus:ring-2 focus:ring-amame-green focus:border-amame-green"
                                  />
                                  <button
                                    type="button"
                                    onClick={() => setShowConfirm(!showConfirm)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                                  >
                                    {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                  </button>
                                </div>
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        {/* Règles mot de passe */}
                        <div className="bg-gray-50 rounded-xl p-3 space-y-1">
                          {[
                            { rule: /^.{8,}$/, label: "Au moins 8 caractères" },
                            { rule: /[A-Z]/, label: "Une lettre majuscule" },
                            { rule: /[a-z]/, label: "Une lettre minuscule" },
                            { rule: /\d/, label: "Un chiffre" },
                          ].map(({ rule, label }) => {
                            const ok = rule.test(form.watch("newPassword") || "");
                            return (
                              <p key={label} className={`text-xs flex items-center gap-2 ${ok ? "text-amame-green" : "text-gray-400"}`}>
                                <span className={`inline-block w-1.5 h-1.5 rounded-full ${ok ? "bg-amame-green" : "bg-gray-300"}`} />
                                {label}
                              </p>
                            );
                          })}
                        </div>

                        <Button
                          type="submit"
                          disabled={mutation.isPending}
                          className="w-full h-12 bg-amame-green hover:bg-amame-green-dark text-white font-semibold rounded-lg transition-all hover:shadow-lg"
                        >
                          {mutation.isPending ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Mise à jour...
                            </>
                          ) : (
                            <>
                              <KeyRound className="mr-2 h-4 w-4" />
                              Enregistrer le mot de passe
                            </>
                          )}
                        </Button>
                      </form>
                    </Form>
                  </CardContent>
                </>
              )}
            </Card>
          </div>
        </div>
      </div>
    </>
  );
}
