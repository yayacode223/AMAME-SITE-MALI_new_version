import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMyDons, useSubmitDon } from "@/service/monEspaceService";
import { toast } from "@/hooks/use-toast";
import { HeartIcon, CheckCircleIcon } from "@heroicons/react/24/outline";
import { HeartIcon as HeartSolid } from "@heroicons/react/24/solid";
import { Loader2 } from "lucide-react";

const MONTANTS_RAPIDES = [1_000, 2_500, 5_000, 10_000, 25_000];

const schema = z.object({
  montant: z.number({ invalid_type_error: "Montant invalide" }).min(500, "Le don minimum est de 500 FCFA"),
  message: z.string().max(300, "Maximum 300 caractères").optional(),
});

type FormValues = z.infer<typeof schema>;

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });
}

export default function Don() {
  const { data: dons = [], isLoading } = useMyDons();
  const submitMutation = useSubmitDon();
  const [success, setSuccess] = useState(false);

  const { register, handleSubmit, setValue, watch, reset, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { montant: undefined, message: "" },
  });

  const montantWatch = watch("montant");

  const onSubmit = async (data: FormValues) => {
    try {
      await submitMutation.mutateAsync({ montant: data.montant, message: data.message || undefined });
      setSuccess(true);
      reset();
      toast({ title: "Merci pour votre don !", description: "Votre générosité soutient la mission de l'AMAME." });
    } catch {
      toast({ title: "Erreur", description: "Une erreur est survenue. Veuillez réessayer.", variant: "destructive" });
    }
  };

  const totalDons = dons.reduce((s, d) => s + Number(d.montant), 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-nunito font-bold text-xl sm:text-2xl text-amame-charcoal">Faire un Don</h1>
        <p className="text-sm text-amame-muted mt-1">Soutenez la mission de l'AMAME et contribuez à l'avancement du mérite éducatif.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* ── Formulaire don ── */}
        <div className="lg:col-span-3 bg-white rounded-2xl border border-amame-border shadow-card p-6">
          {success ? (
            <div className="text-center py-8">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-red-50 rounded-full mb-4">
                <HeartSolid className="h-8 w-8 text-red-500" />
              </div>
              <h2 className="font-nunito font-bold text-xl text-amame-charcoal mb-2">Merci pour votre don !</h2>
              <p className="text-sm text-amame-muted mb-6">Votre contribution est enregistrée. Nous vous contacterons pour confirmer la réception.</p>
              <button
                onClick={() => setSuccess(false)}
                className="text-sm text-amame-green font-semibold underline underline-offset-2 hover:text-amame-green-dark"
              >
                Faire un autre don
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              <h2 className="font-nunito font-bold text-base text-amame-charcoal">Nouveau don</h2>

              {/* Montants rapides */}
              <div>
                <p className="text-sm font-semibold text-amame-charcoal mb-2">Choisir un montant (FCFA)</p>
                <div className="flex flex-wrap gap-2 mb-3">
                  {MONTANTS_RAPIDES.map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setValue("montant", m, { shouldValidate: true })}
                      className={`px-3 py-1.5 rounded-lg text-sm font-semibold border transition-all ${
                        montantWatch === m
                          ? "bg-amame-green text-white border-amame-green"
                          : "bg-white text-amame-charcoal border-amame-border hover:border-amame-green hover:text-amame-green"
                      }`}
                    >
                      {m.toLocaleString("fr-FR")}
                    </button>
                  ))}
                </div>
                <div>
                  <input
                    type="number"
                    min={500}
                    placeholder="Autre montant (min. 500)"
                    {...register("montant", { valueAsNumber: true })}
                    className="w-full border border-amame-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-amame-green focus:border-amame-green"
                  />
                  {errors.montant && <p className="text-xs text-red-500 mt-1">{errors.montant.message}</p>}
                </div>
              </div>

              {/* Message */}
              <div>
                <label className="block text-sm font-semibold text-amame-charcoal mb-1.5">
                  Message <span className="text-amame-muted font-normal text-xs">(optionnel)</span>
                </label>
                <textarea
                  {...register("message")}
                  rows={3}
                  placeholder="Un message pour accompagner votre don..."
                  className="w-full border border-amame-border rounded-xl px-4 py-2.5 text-sm resize-none focus:outline-none focus:ring-1 focus:ring-amame-green focus:border-amame-green"
                />
                {errors.message && <p className="text-xs text-red-500 mt-1">{errors.message.message}</p>}
              </div>

              <button
                type="submit"
                disabled={submitMutation.isPending}
                className="w-full py-3 bg-amame-green hover:bg-amame-green-dark text-white font-semibold rounded-xl transition-colors shadow-green disabled:opacity-50 text-sm flex items-center justify-center gap-2"
              >
                {submitMutation.isPending ? (
                  <><Loader2 className="h-4 w-4 animate-spin" /> Envoi...</>
                ) : (
                  <><HeartIcon className="h-4 w-4" /> Soumettre mon don</>
                )}
              </button>
              <p className="text-xs text-amame-muted text-center">Notre équipe vous contactera pour confirmer la réception du paiement.</p>
            </form>
          )}
        </div>

        {/* ── Sidebar info + historique ── */}
        <div className="lg:col-span-2 space-y-4">
          {/* Impact */}
          <div className="bg-gradient-to-br from-amame-green-darker to-amame-green rounded-2xl p-5 text-white">
            <HeartSolid className="h-7 w-7 text-amame-gold mb-3" />
            <p className="font-nunito font-bold text-base mb-1">Votre impact</p>
            <p className="text-green-100/80 text-xs leading-relaxed">
              Vos dons financent les activités de l'AMAME : bourses, événements, ressources académiques et accompagnement des étudiants.
            </p>
            {totalDons > 0 && (
              <div className="mt-4 pt-3 border-t border-white/20">
                <p className="text-xs text-green-100/70">Total de vos contributions</p>
                <p className="font-nunito font-black text-xl mt-0.5">{totalDons.toLocaleString("fr-FR")} FCFA</p>
              </div>
            )}
          </div>

          {/* Historique */}
          {dons.length > 0 && (
            <div className="bg-white rounded-2xl border border-amame-border shadow-card p-5">
              <h2 className="font-nunito font-bold text-sm text-amame-charcoal mb-3">Mes dons</h2>
              <div className="space-y-2.5">
                {dons.map((d) => (
                  <div key={d.id} className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-7 h-7 rounded-lg bg-red-50 flex items-center justify-center shrink-0">
                        <HeartSolid className="h-3.5 w-3.5 text-red-400" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-amame-charcoal">{Number(d.montant).toLocaleString("fr-FR")} FCFA</p>
                        {d.message && <p className="text-[11px] text-amame-muted truncate">{d.message}</p>}
                      </div>
                    </div>
                    <span className="text-[11px] text-amame-muted shrink-0">{formatDate(d.dateDon)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {isLoading && (
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin h-6 w-6 border-2 border-amame-green border-t-transparent rounded-full" />
        </div>
      )}
    </div>
  );
}
