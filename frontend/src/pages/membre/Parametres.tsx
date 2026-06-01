import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useChangePassword } from "@/service/monEspaceService";
import { toast } from "@/hooks/use-toast";
import { Cog6ToothIcon } from "@heroicons/react/24/outline";
import { KeyRound, Eye, EyeOff, Loader2, CheckCircle, ShieldCheck } from "lucide-react";

const schema = z
  .object({
    currentPassword: z.string().min(1, "Mot de passe actuel obligatoire"),
    newPassword: z
      .string()
      .min(8, "Au moins 8 caractères")
      .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, "Doit contenir une majuscule, une minuscule et un chiffre"),
    confirmPassword: z.string(),
  })
  .refine((d) => d.newPassword === d.confirmPassword, {
    message: "Les mots de passe ne correspondent pas",
    path: ["confirmPassword"],
  });

type FormValues = z.infer<typeof schema>;

const inputCls = "w-full border border-amame-border rounded-xl px-4 py-2.5 text-sm pr-10 focus:outline-none focus:ring-1 focus:ring-amame-green focus:border-amame-green";

function PasswordField({
  label, name, register, error, show, onToggle,
}: {
  label: string;
  name: string;
  register: any;
  error?: string;
  show: boolean;
  onToggle: () => void;
}) {
  return (
    <div>
      <label className="block text-sm font-semibold text-amame-charcoal mb-1.5">{label}</label>
      <div className="relative">
        <input
          {...register}
          type={show ? "text" : "password"}
          placeholder="••••••••"
          className={inputCls}
        />
        <button
          type="button"
          onClick={onToggle}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
          aria-label={show ? "Masquer le mot de passe" : "Afficher le mot de passe"}
        >
          {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </div>
      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
    </div>
  );
}

export default function Parametres() {
  const [showCurrent, setShowCurrent]   = useState(false);
  const [showNew,     setShowNew]       = useState(false);
  const [showConfirm, setShowConfirm]   = useState(false);
  const [done,        setDone]          = useState(false);

  const mutation = useChangePassword();

  const { register, handleSubmit, watch, reset, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { currentPassword: "", newPassword: "", confirmPassword: "" },
  });

  const newPwd = watch("newPassword") ?? "";

  const PASSWORD_RULES = [
    { test: (v: string) => v.length >= 8,        label: "Au moins 8 caractères" },
    { test: (v: string) => /[A-Z]/.test(v),      label: "Une lettre majuscule" },
    { test: (v: string) => /[a-z]/.test(v),      label: "Une lettre minuscule" },
    { test: (v: string) => /\d/.test(v),          label: "Un chiffre" },
  ];

  const onSubmit = async (data: FormValues) => {
    try {
      await mutation.mutateAsync({ currentPassword: data.currentPassword, newPassword: data.newPassword });
      setDone(true);
      reset();
      toast({ title: "Mot de passe mis à jour", description: "Votre nouveau mot de passe est actif." });
    } catch (err: any) {
      const msg = err?.response?.data?.message ?? "Une erreur est survenue.";
      toast({ title: "Erreur", description: msg, variant: "destructive" });
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-nunito font-bold text-xl sm:text-2xl text-amame-charcoal">Paramètres</h1>
        <p className="text-sm text-amame-muted mt-1">Gérez la sécurité de votre compte.</p>
      </div>

      {/* ── Changer le mot de passe ── */}
      <div className="bg-white rounded-2xl border border-amame-border shadow-card p-6">
        <div className="flex items-center gap-2 mb-5">
          <div className="w-8 h-8 bg-amame-green-subtle rounded-lg flex items-center justify-center">
            <KeyRound className="h-4 w-4 text-amame-green" />
          </div>
          <h2 className="font-nunito font-bold text-base text-amame-charcoal">Changer le mot de passe</h2>
        </div>

        {done ? (
          <div className="flex items-start gap-3 p-4 bg-amame-green-subtle/60 border border-amame-green/20 rounded-xl">
            <CheckCircle className="h-5 w-5 text-amame-green shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-amame-green-dark">Mot de passe mis à jour !</p>
              <button
                type="button"
                onClick={() => setDone(false)}
                className="text-xs text-amame-green underline underline-offset-2 mt-1"
              >
                Modifier à nouveau
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 max-w-md">
            <PasswordField
              label="Mot de passe actuel"
              name="currentPassword"
              register={register("currentPassword")}
              error={errors.currentPassword?.message}
              show={showCurrent}
              onToggle={() => setShowCurrent(v => !v)}
            />

            <PasswordField
              label="Nouveau mot de passe"
              name="newPassword"
              register={register("newPassword")}
              error={errors.newPassword?.message}
              show={showNew}
              onToggle={() => setShowNew(v => !v)}
            />

            {/* Règles visuelles */}
            <div className="bg-gray-50 rounded-xl p-3 space-y-1.5">
              {PASSWORD_RULES.map(({ test, label }) => {
                const ok = test(newPwd);
                return (
                  <p key={label} className={`text-xs flex items-center gap-2 ${ok ? "text-amame-green" : "text-gray-400"}`}>
                    <span className={`inline-block w-1.5 h-1.5 rounded-full shrink-0 ${ok ? "bg-amame-green" : "bg-gray-300"}`} />
                    {label}
                  </p>
                );
              })}
            </div>

            <PasswordField
              label="Confirmer le nouveau mot de passe"
              name="confirmPassword"
              register={register("confirmPassword")}
              error={errors.confirmPassword?.message}
              show={showConfirm}
              onToggle={() => setShowConfirm(v => !v)}
            />

            <button
              type="submit"
              disabled={mutation.isPending}
              className="w-full py-2.5 bg-amame-green hover:bg-amame-green-dark text-white font-semibold rounded-xl transition-colors shadow-green disabled:opacity-50 text-sm flex items-center justify-center gap-2"
            >
              {mutation.isPending
                ? <><Loader2 className="h-4 w-4 animate-spin" /> Mise à jour...</>
                : <><KeyRound className="h-4 w-4" /> Mettre à jour</>
              }
            </button>
          </form>
        )}
      </div>

      {/* ── Sécurité ── */}
      <div className="bg-white rounded-2xl border border-amame-border shadow-card p-6">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center">
            <ShieldCheck className="h-4 w-4 text-blue-600" />
          </div>
          <h2 className="font-nunito font-bold text-base text-amame-charcoal">Conseils de sécurité</h2>
        </div>
        <ul className="space-y-2">
          {[
            "Utilisez un mot de passe unique pour votre compte AMAME.",
            "Ne partagez jamais votre mot de passe avec quelqu'un d'autre.",
            "Changez votre mot de passe régulièrement (tous les 6 mois).",
            "Si vous suspectez un accès non autorisé, changez immédiatement votre mot de passe.",
          ].map((tip, i) => (
            <li key={i} className="flex items-start gap-2.5 text-sm text-amame-slate">
              <span className="w-1.5 h-1.5 rounded-full bg-amame-green mt-2 shrink-0" />
              {tip}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
