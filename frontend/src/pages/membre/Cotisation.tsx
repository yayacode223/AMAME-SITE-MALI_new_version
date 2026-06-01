import { useMyCotisations, COTISATION_STATUS_LABELS, COTISATION_STATUS_STYLES } from "@/service/monEspaceService";
import { CreditCardIcon, CheckCircleIcon, ClockIcon, ExclamationCircleIcon } from "@heroicons/react/24/outline";
import { CheckCircleIcon as CheckCircleSolid } from "@heroicons/react/24/solid";

const MONTANT_ANNUEL = 5_000;
const ANNEE = new Date().getFullYear();

function StatusIcon({ status }: { status: string }) {
  if (status === "PAID")    return <CheckCircleSolid className="h-5 w-5 text-amame-green" />;
  if (status === "OVERDUE") return <ExclamationCircleIcon className="h-5 w-5 text-red-500" />;
  return <ClockIcon className="h-5 w-5 text-yellow-500" />;
}

export default function Cotisation() {
  const { data: cotisations = [], isLoading } = useMyCotisations();

  const cotisationCourante = cotisations.find(c => c.annee === ANNEE);
  const historique          = cotisations.filter(c => c.annee !== ANNEE);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-nunito font-bold text-xl sm:text-2xl text-amame-charcoal">Cotisation annuelle</h1>
        <p className="text-sm text-amame-muted mt-1">La cotisation annuelle est de {MONTANT_ANNUEL.toLocaleString("fr-FR")} FCFA.</p>
      </div>

      {/* ── Carte cotisation en cours ── */}
      <div className={`rounded-2xl border p-6 ${cotisationCourante?.status === "PAID" ? "bg-amame-green-subtle border-amame-green/20" : "bg-white border-amame-border shadow-card"}`}>
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${cotisationCourante?.status === "PAID" ? "bg-amame-green text-white" : "bg-gray-100"}`}>
              <CreditCardIcon className="h-6 w-6" />
            </div>
            <div>
              <p className="font-nunito font-bold text-base text-amame-charcoal">Cotisation {ANNEE}</p>
              <p className="text-sm text-amame-muted">{MONTANT_ANNUEL.toLocaleString("fr-FR")} FCFA</p>
            </div>
          </div>
          {cotisationCourante ? (
            <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border ${COTISATION_STATUS_STYLES[cotisationCourante.status]}`}>
              <StatusIcon status={cotisationCourante.status} />
              {COTISATION_STATUS_LABELS[cotisationCourante.status]}
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-gray-50 text-gray-500 border border-gray-200">
              Non enregistrée
            </span>
          )}
        </div>

        {cotisationCourante?.status === "PAID" && (
          <div className="mt-4 flex items-center gap-2 text-amame-green-dark text-sm">
            <CheckCircleIcon className="h-4 w-4 shrink-0" />
            <span>
              Payée le {new Date(cotisationCourante.datePaiement!).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}
              {cotisationCourante.referencePaiement && ` — Réf : ${cotisationCourante.referencePaiement}`}
            </span>
          </div>
        )}
      </div>

      {/* ── Comment payer ── */}
      {(!cotisationCourante || cotisationCourante.status !== "PAID") && (
        <div className="bg-amame-gold-subtle border border-amame-gold/20 rounded-2xl p-6">
          <h2 className="font-nunito font-bold text-base text-amame-charcoal mb-3">Comment régler votre cotisation ?</h2>
          <ol className="space-y-3">
            {[
              { step: 1, text: `Effectuez un virement de ${MONTANT_ANNUEL.toLocaleString("fr-FR")} FCFA via Orange Money ou votre banque.` },
              { step: 2, text: "Numéro de contact AMAME : +223 69 78 08 41" },
              { step: 3, text: "Mentionnez votre nom complet et l'année de cotisation en objet." },
              { step: 4, text: "Envoyez la preuve de paiement à contact@amame.ml — notre équipe validera votre cotisation sous 48h." },
            ].map(({ step, text }) => (
              <li key={step} className="flex items-start gap-3">
                <span className="w-6 h-6 rounded-full bg-amame-gold text-white text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">{step}</span>
                <span className="text-sm text-amame-slate leading-relaxed">{text}</span>
              </li>
            ))}
          </ol>
        </div>
      )}

      {/* ── Historique ── */}
      {historique.length > 0 && (
        <div className="bg-white rounded-2xl border border-amame-border shadow-card p-6">
          <h2 className="font-nunito font-bold text-base text-amame-charcoal mb-4">Historique</h2>
          <div className="overflow-x-auto -mx-2">
            <table className="w-full text-sm min-w-[400px]">
              <thead>
                <tr className="border-b border-amame-border">
                  <th className="text-left px-2 py-2 text-xs font-semibold text-amame-muted">Année</th>
                  <th className="text-left px-2 py-2 text-xs font-semibold text-amame-muted">Montant</th>
                  <th className="text-left px-2 py-2 text-xs font-semibold text-amame-muted">Statut</th>
                  <th className="text-left px-2 py-2 text-xs font-semibold text-amame-muted">Date paiement</th>
                </tr>
              </thead>
              <tbody>
                {historique.map((c) => (
                  <tr key={c.id} className="border-b border-gray-50 last:border-none hover:bg-gray-50/50">
                    <td className="px-2 py-3 font-semibold text-amame-charcoal">{c.annee}</td>
                    <td className="px-2 py-3 text-amame-slate">{Number(c.montant).toLocaleString("fr-FR")} FCFA</td>
                    <td className="px-2 py-3">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold border ${COTISATION_STATUS_STYLES[c.status]}`}>
                        {COTISATION_STATUS_LABELS[c.status]}
                      </span>
                    </td>
                    <td className="px-2 py-3 text-amame-muted text-xs">
                      {c.datePaiement ? new Date(c.datePaiement).toLocaleDateString("fr-FR") : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {isLoading && (
        <div className="flex items-center justify-center py-10">
          <div className="animate-spin h-6 w-6 border-2 border-amame-green border-t-transparent rounded-full" />
        </div>
      )}
    </div>
  );
}
