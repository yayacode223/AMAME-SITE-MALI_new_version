import React, { useState } from "react";
import { MagnifyingGlassIcon, CheckIcon, XMarkIcon } from "@heroicons/react/24/outline";
import { ClockIcon, CheckCircleIcon, XCircleIcon } from "@heroicons/react/24/outline";
import Pagination from "@/components/Pagination";
import ConfirmDialog from "@/components/admin/ConfirmDialog";
import {
  useGetAllAdhesions,
  useApproveAdhesion,
  useRejectAdhesion,
  useDeleteAdhesion,
} from "@/service/adhesionService";
import { AdhesionDto, AdhesionStatus, ADHESION_STATUS_LABELS, ADHESION_STATUS_STYLES } from "@/types/adhesionType";
import { toast } from "@/hooks/use-toast";
import {
  AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle,
  AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction,
} from "@/components/ui/alert-dialog";

const STATUS_TABS: { label: string; value: AdhesionStatus | undefined; icon: React.ElementType }[] = [
  { label: "Toutes",       value: undefined,    icon: MagnifyingGlassIcon },
  { label: "En attente",   value: "PENDING",    icon: ClockIcon },
  { label: "Approuvées",   value: "APPROVED",   icon: CheckCircleIcon },
  { label: "Rejetées",     value: "REJECTED",   icon: XCircleIcon },
];

const AdhesionsManagement: React.FC = () => {
  const [page, setPage] = useState(0);
  const [statusFilter, setStatusFilter] = useState<AdhesionStatus | undefined>(undefined);
  const [searchTerm, setSearchTerm] = useState("");

  // Reject modal
  const [rejectTarget, setRejectTarget] = useState<AdhesionDto | null>(null);
  const [rejectReason, setRejectReason] = useState("");

  // Delete confirm
  const [deleteTarget, setDeleteTarget] = useState<AdhesionDto | null>(null);

  const { data: adhesionsPage, isLoading } = useGetAllAdhesions({ page, size: 10, status: statusFilter });
  const approveMutation = useApproveAdhesion();
  const rejectMutation = useRejectAdhesion();
  const deleteMutation = useDeleteAdhesion();

  const filtered = (adhesionsPage?.content || []).filter((a) =>
    `${a.userPrenom} ${a.userNom} ${a.userEmail}`.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleApprove = async (adhesion: AdhesionDto) => {
    try {
      await approveMutation.mutateAsync(adhesion.id);
      toast({ title: "Adhésion approuvée", description: `${adhesion.userPrenom} ${adhesion.userNom} est maintenant membre.` });
    } catch {
      toast({ title: "Erreur", description: "Impossible d'approuver cette adhésion.", variant: "destructive" });
    }
  };

  const handleReject = async () => {
    if (!rejectTarget) return;
    try {
      await rejectMutation.mutateAsync({ id: rejectTarget.id, reason: rejectReason.trim() || undefined });
      toast({ title: "Adhésion rejetée", description: `La demande de ${rejectTarget.userPrenom} ${rejectTarget.userNom} a été rejetée.` });
      setRejectTarget(null);
      setRejectReason("");
    } catch {
      toast({ title: "Erreur", description: "Impossible de rejeter cette adhésion.", variant: "destructive" });
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteMutation.mutateAsync(deleteTarget.id);
      toast({ title: "Supprimé", description: "La demande d'adhésion a été supprimée." });
      setDeleteTarget(null);
    } catch {
      toast({ title: "Erreur", description: "Impossible de supprimer.", variant: "destructive" });
    }
  };

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" });

  return (
    <div>
      {/* En-tête */}
      <div className="sm:flex sm:items-center sm:justify-between mb-6">
        <div>
          <h1 className="font-nunito font-bold text-2xl text-amame-charcoal">Adhésions</h1>
          <p className="mt-1 text-sm text-amame-muted">
            {adhesionsPage?.totalElements ?? 0} demande{(adhesionsPage?.totalElements ?? 0) > 1 ? "s" : ""} au total
          </p>
        </div>
      </div>

      {/* Tabs statut */}
      <div className="flex gap-2 mb-5 flex-wrap">
        {STATUS_TABS.map(({ label, value, icon: Icon }) => (
          <button
            key={label}
            type="button"
            onClick={() => { setStatusFilter(value); setPage(0); }}
            className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold border transition-all duration-200 ${
              statusFilter === value
                ? "bg-amame-green text-white border-amame-green shadow-green"
                : "bg-white text-amame-slate border-amame-border hover:border-amame-green hover:text-amame-green"
            }`}
          >
            <Icon className="h-3.5 w-3.5" />
            {label}
          </button>
        ))}
      </div>

      {/* Recherche */}
      <div className="mb-5">
        <div className="relative max-w-sm">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-amame-muted pointer-events-none" />
          <input
            type="text"
            placeholder="Rechercher par nom ou email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 pr-4 py-2 w-full text-sm border border-amame-border rounded-xl focus:outline-none focus:ring-1 focus:ring-amame-green focus:border-amame-green placeholder-amame-muted/60 bg-white"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-amame-border shadow-card overflow-hidden">
        {isLoading ? (
          <div className="space-y-0">
            {[...Array(5)].map((_, i) => (
              <div key={i} className={`px-5 py-4 animate-pulse ${i < 4 ? "border-b border-amame-border" : ""}`}>
                <div className="flex items-center gap-4">
                  <div className="h-4 bg-gray-100 rounded w-1/4" />
                  <div className="h-4 bg-gray-100 rounded w-1/3" />
                  <div className="ml-auto flex gap-2">
                    <div className="h-7 w-20 bg-gray-100 rounded-lg" />
                    <div className="h-7 w-20 bg-gray-100 rounded-lg" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-14 px-6">
            <ClockIcon className="h-10 w-10 text-amame-muted mx-auto mb-3" />
            <p className="text-sm font-semibold text-amame-charcoal">Aucune demande trouvée</p>
            <p className="text-xs text-amame-muted mt-1">Les demandes apparaîtront ici.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-amame-border">
              <thead>
                <tr className="bg-gray-50/70">
                  {["Demandeur", "Email", "Motivation", "Statut", "Date", "Actions"].map((h) => (
                    <th key={h} className="px-5 py-3 text-left text-xs font-semibold text-amame-muted uppercase tracking-wider whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-amame-border bg-white">
                {filtered.map((a) => (
                  <tr key={a.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-5 py-3.5 text-sm font-medium text-amame-charcoal whitespace-nowrap">
                      {a.userPrenom} {a.userNom}
                    </td>
                    <td className="px-5 py-3.5 text-sm text-amame-muted">{a.userEmail}</td>
                    <td className="px-5 py-3.5 text-sm text-amame-muted max-w-xs">
                      <p className="line-clamp-1" title={a.motivation}>{a.motivation}</p>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${ADHESION_STATUS_STYLES[a.status]}`}>
                        {a.status === "PENDING"   && <ClockIcon className="h-3 w-3" />}
                        {a.status === "APPROVED"  && <CheckCircleIcon className="h-3 w-3" />}
                        {a.status === "REJECTED"  && <XCircleIcon className="h-3 w-3" />}
                        {ADHESION_STATUS_LABELS[a.status]}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-sm text-amame-muted whitespace-nowrap">
                      {formatDate(a.createdAt)}
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-1">
                        {a.status === "PENDING" && (
                          <>
                            <button
                              type="button"
                              onClick={() => handleApprove(a)}
                              disabled={approveMutation.isPending}
                              title="Approuver"
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-amame-green-subtle text-amame-green hover:bg-amame-green hover:text-white transition-colors border border-amame-green/20"
                            >
                              <CheckIcon className="h-3.5 w-3.5" />
                              Approuver
                            </button>
                            <button
                              type="button"
                              onClick={() => { setRejectTarget(a); setRejectReason(""); }}
                              title="Rejeter"
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-red-50 text-red-600 hover:bg-red-100 transition-colors border border-red-200"
                            >
                              <XMarkIcon className="h-3.5 w-3.5" />
                              Rejeter
                            </button>
                          </>
                        )}
                        {a.status !== "PENDING" && (
                          <button
                            type="button"
                            onClick={() => setDeleteTarget(a)}
                            title="Supprimer"
                            className="p-1.5 rounded-lg text-amame-muted hover:text-red-600 hover:bg-red-50 transition-colors"
                          >
                            <XMarkIcon className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {adhesionsPage && (
        <Pagination
          totalPages={adhesionsPage.totalPages}
          currentPage={adhesionsPage.currentPage}
          hasNext={adhesionsPage.hasNext}
          hasPrevious={adhesionsPage.hasPrevious}
          onPageChange={setPage}
        />
      )}

      {/* Modal rejet avec raison */}
      <AlertDialog open={!!rejectTarget} onOpenChange={(o) => !o && setRejectTarget(null)}>
        <AlertDialogContent className="max-w-md rounded-2xl border border-amame-border p-0 overflow-hidden">
          <div className="px-6 pt-6 pb-2">
            <AlertDialogHeader>
              <div className="w-11 h-11 bg-red-50 rounded-xl flex items-center justify-center mb-4">
                <XCircleIcon className="h-5 w-5 text-red-500" />
              </div>
              <AlertDialogTitle className="font-nunito font-bold text-base text-amame-charcoal text-left">
                Rejeter la demande
              </AlertDialogTitle>
              <AlertDialogDescription className="text-sm text-amame-muted text-left mt-1">
                Demande de <strong>{rejectTarget?.userPrenom} {rejectTarget?.userNom}</strong>.
                Vous pouvez indiquer une raison (optionnel).
              </AlertDialogDescription>
            </AlertDialogHeader>
            <textarea
              rows={3}
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Raison du rejet (optionnel)..."
              className="w-full mt-4 border border-amame-border rounded-xl py-2.5 px-3 text-sm text-amame-charcoal focus:outline-none focus:ring-1 focus:ring-red-400 focus:border-red-400 transition-colors resize-none"
            />
          </div>
          <AlertDialogFooter className="px-6 py-4 bg-gray-50/70 border-t border-amame-border gap-2 flex-row sm:flex-row sm:justify-end">
            <AlertDialogCancel onClick={() => setRejectTarget(null)}
              className="flex-1 sm:flex-none rounded-xl text-sm font-semibold border-amame-border h-9">
              Annuler
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => { e.preventDefault(); handleReject(); }}
              disabled={rejectMutation.isPending}
              className="flex-1 sm:flex-none rounded-xl text-sm font-semibold bg-red-500 hover:bg-red-600 text-white border border-transparent h-9 disabled:opacity-60">
              {rejectMutation.isPending ? "Rejet..." : "Confirmer le rejet"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Modal suppression */}
      <ConfirmDialog
        open={!!deleteTarget}
        title="Supprimer la demande"
        description={deleteTarget ? `La demande de "${deleteTarget.userPrenom} ${deleteTarget.userNom}" sera définitivement supprimée.` : undefined}
        onConfirm={handleDelete}
        onClose={() => setDeleteTarget(null)}
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
};

export default AdhesionsManagement;
