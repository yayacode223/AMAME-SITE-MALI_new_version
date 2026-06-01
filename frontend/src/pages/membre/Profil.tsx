import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAuth } from "@/context/AuthContext";
import { useUpdateProfile, UpdateProfilePayload } from "@/service/monEspaceService";
import { toast } from "@/hooks/use-toast";
import { UserIcon, Loader2, CheckCircle } from "lucide-react";

const schema = z.object({
  nom:          z.string().min(2, "Au moins 2 caractères"),
  prenom:       z.string().min(2, "Au moins 2 caractères"),
  phone:        z.string().optional(),
  ville:        z.string().optional(),
  adresse:      z.string().optional(),
  pays:         z.string().optional(),
  birthDate:    z.string().optional(),
  sexe:         z.enum(["HOMME", "FEMME"]).optional(),
  niveauEtude:  z.string().optional(),
  codePostal:   z.number().optional(),
});

type FormValues = z.infer<typeof schema>;

const NIVEAUX = [
  { value: "PRIMAIRE",      label: "Primaire" },
  { value: "SECONDAIRE",    label: "Secondaire" },
  { value: "BACCALAUREAT",  label: "Baccalauréat" },
  { value: "LICENCE",       label: "Licence" },
  { value: "MASTER",        label: "Master" },
  { value: "DOCTORAT",      label: "Doctorat" },
  { value: "AUTRE",         label: "Autre" },
];

function Field({ label, children, hint }: { label: string; children: React.ReactNode; hint?: string }) {
  return (
    <div>
      <label className="block text-sm font-semibold text-amame-charcoal mb-1.5">{label}</label>
      {children}
      {hint && <p className="text-xs text-amame-muted mt-1">{hint}</p>}
    </div>
  );
}

const inputCls = "w-full border border-amame-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-amame-green focus:border-amame-green bg-white disabled:bg-gray-50 disabled:text-amame-muted";

export default function Profil() {
  const { user } = useAuth();
  const mutation = useUpdateProfile();

  const { register, handleSubmit, reset, formState: { errors, isDirty } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      nom:         user?.nom        ?? "",
      prenom:      user?.prenom     ?? "",
      phone:       user?.phone      ?? "",
      ville:       user?.ville      ?? "",
      adresse:     user?.adresse    ?? "",
      pays:        user?.pays       ?? "",
      birthDate:   user?.birthDate  ?? "",
      sexe:        (user?.sexe as "HOMME" | "FEMME") ?? undefined,
      niveauEtude: user?.niveauEtude ?? "",
      codePostal:  user?.codePostal  ?? undefined,
    },
  });

  // Resync si user change (ex: après refresh token)
  useEffect(() => {
    if (!user) return;
    reset({
      nom:         user.nom        ?? "",
      prenom:      user.prenom     ?? "",
      phone:       user.phone      ?? "",
      ville:       user.ville      ?? "",
      adresse:     user.adresse    ?? "",
      pays:        user.pays       ?? "",
      birthDate:   user.birthDate  ?? "",
      sexe:        (user.sexe as "HOMME" | "FEMME") ?? undefined,
      niveauEtude: user.niveauEtude ?? "",
      codePostal:  user.codePostal  ?? undefined,
    });
  }, [user, reset]);

  const onSubmit = async (data: FormValues) => {
    try {
      const payload: UpdateProfilePayload = {
        nom:    data.nom,
        prenom: data.prenom,
        phone:       data.phone       || undefined,
        ville:       data.ville       || undefined,
        adresse:     data.adresse     || undefined,
        pays:        data.pays        || undefined,
        birthDate:   data.birthDate   || undefined,
        sexe:        data.sexe,
        niveauEtude: data.niveauEtude || undefined,
        codePostal:  data.codePostal,
      };
      await mutation.mutateAsync(payload);
      toast({ title: "Profil mis à jour", description: "Vos informations ont été enregistrées." });
    } catch {
      toast({ title: "Erreur", description: "Impossible de mettre à jour le profil.", variant: "destructive" });
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-nunito font-bold text-xl sm:text-2xl text-amame-charcoal">Mon profil</h1>
        <p className="text-sm text-amame-muted mt-1">Mettez à jour vos informations personnelles.</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* ── Identité ── */}
        <div className="bg-white rounded-2xl border border-amame-border shadow-card p-6">
          <div className="flex items-center gap-2 mb-5">
            <div className="w-8 h-8 bg-amame-green-subtle rounded-lg flex items-center justify-center">
              <UserIcon className="h-4 w-4 text-amame-green" />
            </div>
            <h2 className="font-nunito font-bold text-base text-amame-charcoal">Identité</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Prénom *">
              <input {...register("prenom")} className={inputCls} placeholder="Votre prénom" />
              {errors.prenom && <p className="text-xs text-red-500 mt-1">{errors.prenom.message}</p>}
            </Field>

            <Field label="Nom *">
              <input {...register("nom")} className={inputCls} placeholder="Votre nom" />
              {errors.nom && <p className="text-xs text-red-500 mt-1">{errors.nom.message}</p>}
            </Field>

            <Field label="Email" hint="L'email ne peut pas être modifié ici.">
              <input value={user?.email ?? ""} disabled className={inputCls} />
            </Field>

            <Field label="Téléphone">
              <input {...register("phone")} className={inputCls} placeholder="+223 70 000 000" />
            </Field>

            <Field label="Date de naissance">
              <input {...register("birthDate")} type="date" className={inputCls} />
            </Field>

            <Field label="Sexe">
              <select {...register("sexe")} title="Sexe" className={inputCls}>
                <option value="">— Sélectionner —</option>
                <option value="HOMME">Homme</option>
                <option value="FEMME">Femme</option>
              </select>
            </Field>

            <Field label="Niveau d'études">
              <select {...register("niveauEtude")} title="Niveau d'études" className={inputCls}>
                <option value="">— Sélectionner —</option>
                {NIVEAUX.map(n => (
                  <option key={n.value} value={n.value}>{n.label}</option>
                ))}
              </select>
            </Field>
          </div>
        </div>

        {/* ── Adresse ── */}
        <div className="bg-white rounded-2xl border border-amame-border shadow-card p-6">
          <h2 className="font-nunito font-bold text-base text-amame-charcoal mb-5">Adresse</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Ville">
              <input {...register("ville")} className={inputCls} placeholder="Ex : Bamako" />
            </Field>

            <Field label="Pays">
              <input {...register("pays")} className={inputCls} placeholder="Ex : Mali" />
            </Field>

            <Field label="Adresse complète">
              <input {...register("adresse")} className={inputCls} placeholder="Quartier, rue..." />
            </Field>

            <Field label="Code postal">
              <input
                {...register("codePostal", { valueAsNumber: true })}
                type="number"
                className={inputCls}
                placeholder="Ex : 10000"
              />
            </Field>
          </div>
        </div>

        {/* ── Actions ── */}
        <div className="flex items-center justify-end gap-3">
          {mutation.isSuccess && (
            <span className="flex items-center gap-1.5 text-sm text-amame-green">
              <CheckCircle className="h-4 w-4" />
              Enregistré
            </span>
          )}
          <button
            type="submit"
            disabled={mutation.isPending || !isDirty}
            className="px-6 py-2.5 bg-amame-green hover:bg-amame-green-dark text-white font-semibold rounded-xl transition-colors shadow-green disabled:opacity-50 disabled:cursor-not-allowed text-sm flex items-center gap-2"
          >
            {mutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            {mutation.isPending ? "Enregistrement..." : "Sauvegarder"}
          </button>
        </div>
      </form>
    </div>
  );
}
