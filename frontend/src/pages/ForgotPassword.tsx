import { useState } from "react";
import { PhotoBackdrop, BackdropHeader, BackdropCard, BackdropCardTitle } from "@/components/PhotoBackdrop";
import { Link, useLocation } from "react-router-dom";
import { userMessage } from "@/utils/apiError";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Helmet } from "react-helmet-async";
import { Button } from "@/components/ui/button";
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
import { Mail, Loader2, CheckCircle, AlertCircle } from "lucide-react";

const schema = z.object({
  email: z.string().email("Veuillez entrer une adresse email valide."),
});

type FormValues = z.infer<typeof schema>;

export default function ForgotPassword() {
  const [successEmail, setSuccessEmail] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const mutation = useForgotPassword();

  // E-mail transmis par la page Adhésion (« Cet e-mail est déjà utilisé… Mot de passe oublié ? »).
  const prefilledEmail = (useLocation().state as { email?: string } | null)?.email ?? "";

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { email: prefilledEmail },
  });

  const onSubmit = async ({ email }: FormValues) => {
    setErrorMsg(null);
    try {
      await mutation.mutateAsync(email);
      setSuccessEmail(email);
    } catch (err) {
      setErrorMsg(userMessage(err)); // réseau, 429, panne : message clair (rapport 05, P3a)
    }
  };

  return (
    <>
      <Helmet>
        <title>Mot de passe oublié — AMAME</title>
      </Helmet>

      {/* Photo naturelle en fond, carte au centre ; même mise en page que la connexion (docs/06, R5, R8) */}
      <PhotoBackdrop image="heroes/hero-about" className="flex min-h-screen items-center py-8">
        <div className="page-container w-full">
          <div className="mx-auto max-w-md">
            <BackdropHeader to="/login" label="Retour à la connexion" />

            <BackdropCard>
              {successEmail ? (
                /* ── État succès ── */
                <div className="px-5 py-8 text-center sm:px-8">
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-amame-green-subtle rounded-full mb-5">
                    <CheckCircle className="h-8 w-8 text-amame-green" />
                  </div>
                  <h1 className="font-nunito font-black text-xl text-amame-charcoal mb-3">
                    Email envoyé !
                  </h1>
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
                    className="text-sm text-amame-green-dark hover:text-amame-green-deep font-medium underline underline-offset-2 transition-colors"
                  >
                    Refaire une demande
                  </button>
                </div>
              ) : (
                /* ── Formulaire ── */
                <>
                  <BackdropCardTitle icon={<Mail className="h-6 w-6" />} title="Mot de passe oublié ?">
                    Entrez votre adresse email et nous vous enverrons
                    un lien pour réinitialiser votre mot de passe.
                  </BackdropCardTitle>

                  <div className="px-5 pb-6 pt-5 sm:px-8 sm:pb-8">
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
                          className="w-full h-12 bg-amame-green-dark hover:bg-amame-green-deep text-white font-semibold rounded-lg transition-all hover:shadow-lg"
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
                            className="font-semibold text-amame-green-dark hover:text-amame-green-deep transition-colors"
                          >
                            Se connecter
                          </Link>
                        </p>
                      </form>
                    </Form>
                  </div>
                </>
              )}
            </BackdropCard>
          </div>
        </div>
      </PhotoBackdrop>
    </>
  );
}
