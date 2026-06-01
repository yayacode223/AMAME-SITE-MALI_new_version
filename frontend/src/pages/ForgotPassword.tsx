import { useState } from "react";
import { Link } from "react-router-dom";
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
import { useForgotPassword } from "@/service/passwordResetService";
import { ArrowLeft, Mail, Loader2, CheckCircle, AlertCircle } from "lucide-react";

const schema = z.object({
  email: z.string().email("Veuillez entrer une adresse email valide."),
});

type FormValues = z.infer<typeof schema>;

export default function ForgotPassword() {
  const [successEmail, setSuccessEmail] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const mutation = useForgotPassword();

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { email: "" },
  });

  const onSubmit = async ({ email }: FormValues) => {
    setErrorMsg(null);
    try {
      await mutation.mutateAsync(email);
      setSuccessEmail(email);
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ||
        "Une erreur est survenue. Veuillez réessayer.";
      setErrorMsg(msg);
    }
  };

  return (
    <>
      <Helmet>
        <title>Mot de passe oublié — AMAME</title>
      </Helmet>

      <div className="min-h-screen flex items-center py-8 relative overflow-hidden bg-[url('/images/heroes/hero-homepage.png')] bg-cover bg-center">
        <div className="absolute inset-0 bg-gradient-to-br from-amame-green-darker/90 via-amame-green-dark/82 to-amame-green/65 pointer-events-none" />
        <div className="container mx-auto px-4 sm:px-6 lg:px-6 relative z-10">

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

              {successEmail ? (
                /* ── État succès ── */
                <div className="p-8 text-center">
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-amame-green-subtle rounded-full mb-5">
                    <CheckCircle className="h-8 w-8 text-amame-green" />
                  </div>
                  <h2 className="font-nunito font-black text-xl text-amame-charcoal mb-3">
                    Email envoyé !
                  </h2>
                  <p className="text-sm text-amame-muted leading-relaxed mb-2">
                    Un lien de réinitialisation a été envoyé à
                  </p>
                  <p className="font-semibold text-amame-charcoal text-sm mb-5 break-all">
                    {successEmail}
                  </p>
                  <div className="bg-amame-green-subtle/60 border border-amame-green/20 rounded-xl p-4 text-left mb-6">
                    <ul className="space-y-1.5 text-xs text-amame-slate">
                      <li className="flex items-start gap-2">
                        <span className="text-amame-green font-bold mt-0.5">•</span>
                        Vérifiez votre boîte de réception (et les spams).
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-amame-green font-bold mt-0.5">•</span>
                        Le lien est valable <strong>1 heure</strong>.
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-amame-green font-bold mt-0.5">•</span>
                        Si vous ne le recevez pas, vous pouvez refaire la demande.
                      </li>
                    </ul>
                  </div>
                  <button
                    onClick={() => { setSuccessEmail(null); form.reset(); }}
                    className="text-sm text-amame-green hover:text-amame-green-dark font-medium underline underline-offset-2 transition-colors"
                  >
                    Refaire une demande
                  </button>
                </div>
              ) : (
                /* ── Formulaire ── */
                <>
                  <CardHeader className="text-center pb-2">
                    <div className="mx-auto w-12 h-12 bg-amame-green-subtle rounded-full flex items-center justify-center mb-4">
                      <Mail className="h-6 w-6 text-amame-green" />
                    </div>
                    <CardTitle className="text-2xl font-bold text-gray-900">
                      Mot de passe oublié ?
                    </CardTitle>
                    <CardDescription className="text-gray-600 text-sm leading-relaxed mt-1">
                      Entrez votre adresse email et nous vous enverrons
                      un lien pour réinitialiser votre mot de passe.
                    </CardDescription>
                  </CardHeader>

                  <CardContent className="pt-4">
                    {/* Message d'erreur */}
                    {errorMsg && (
                      <div className="flex items-start gap-3 p-3.5 mb-5 bg-red-50 border border-red-200 rounded-xl">
                        <AlertCircle className="h-4 w-4 text-red-500 shrink-0 mt-0.5" />
                        <p className="text-sm text-red-700">{errorMsg}</p>
                      </div>
                    )}

                    <Form {...form}>
                      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
                        <FormField
                          control={form.control}
                          name="email"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-gray-700 font-medium">
                                Adresse email
                              </FormLabel>
                              <FormControl>
                                <Input
                                  type="email"
                                  placeholder="exemple@gmail.com"
                                  autoComplete="email"
                                  disabled={mutation.isPending}
                                  {...field}
                                  className="h-12 focus:ring-2 focus:ring-amame-green focus:border-amame-green"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <Button
                          type="submit"
                          disabled={mutation.isPending}
                          className="w-full h-12 bg-amame-green hover:bg-amame-green-dark text-white font-semibold rounded-lg transition-all hover:shadow-lg"
                        >
                          {mutation.isPending ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Envoi en cours...
                            </>
                          ) : (
                            <>
                              <Mail className="mr-2 h-4 w-4" />
                              Envoyer le lien
                            </>
                          )}
                        </Button>

                        <p className="text-center text-sm text-gray-600">
                          Vous vous souvenez de votre mot de passe ?{" "}
                          <Link
                            to="/login"
                            className="font-semibold text-amame-green hover:text-amame-green-dark transition-colors"
                          >
                            Se connecter
                          </Link>
                        </p>
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
