import React, { useState } from "react";
import {
  EyeIcon,
  PencilSquareIcon,
  TrashIcon,
  TableCellsIcon,
} from "@heroicons/react/24/outline";
import { useAuth } from "@/context/AuthContext";
import ConfirmDialog from "@/components/admin/ConfirmDialog";

interface Column {
  key: string;
  label: string;
  render?: (value: any, row: any) => React.ReactNode;
}

interface DataTableProps {
  columns: Column[];
  data: any[];
  onEdit?: (item: any) => void;
  onDelete?: (item: any) => void;
  onView?: (item: any) => void;
  isLoading?: boolean;
  protectSelf?: boolean;
  /** Génère le message de description dans la modale de confirmation */
  deleteConfirmMessage?: (row: any) => string;
  /** Personnalise le titre de la modale (défaut : "Confirmer la suppression") */
  deleteConfirmTitle?: string;
}

const DataTable: React.FC<DataTableProps> = ({
  columns,
  data,
  onEdit,
  onDelete,
  onView,
  isLoading = false,
  protectSelf = false,
  deleteConfirmMessage,
  deleteConfirmTitle,
}) => {
  const { user } = useAuth();
  const [itemToDelete, setItemToDelete] = useState<any | null>(null);

  const adminRoles = ["SUPERADMIN", "ADMIN", "EDITOR"];
  const canEdit = (row: any) =>
    !!onEdit && (adminRoles.includes(user?.role) || row.id === user?.id);
  const canDelete = (row: any) =>
    !!onDelete &&
    ["SUPERADMIN", "ADMIN"].includes(user?.role) &&
    (!protectSelf || row.id !== user?.id);

  const hasActions = !!onView || !!onEdit || !!onDelete;

  const handleConfirmDelete = () => {
    if (itemToDelete) {
      onDelete!(itemToDelete);
    }
    setItemToDelete(null);
  };

  const getDescription = (row: any) => {
    if (deleteConfirmMessage) return deleteConfirmMessage(row);
    const name = row.titre || row.nom || row.prenom || null;
    return name
      ? `"${name}" sera définitivement supprimé(e). Cette action est irréversible.`
      : "Cet élément sera définitivement supprimé. Cette action est irréversible.";
  };

  /* ── Skeleton ──────────────────────────────────────────────────────────── */
  if (isLoading) {
    return (
      <div className="bg-white rounded-xl border border-amame-border shadow-card overflow-hidden">
        {[...Array(5)].map((_, i) => (
          <div key={i} className={`px-5 py-4 animate-pulse ${i < 4 ? "border-b border-amame-border" : ""}`}>
            <div className="flex items-center gap-4">
              <div className="h-4 bg-gray-100 rounded-lg w-1/4" />
              <div className="h-4 bg-gray-100 rounded-lg w-1/3" />
              <div className="h-4 bg-gray-100 rounded-lg w-1/5" />
              <div className="ml-auto flex gap-1.5">
                <div className="h-7 w-7 bg-gray-100 rounded-lg" />
                <div className="h-7 w-7 bg-gray-100 rounded-lg" />
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <>
      <div className="bg-white rounded-xl border border-amame-border shadow-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-amame-border">
            {/* En-tête */}
            <thead>
              <tr className="bg-gray-50/70">
                {columns.map((col) => (
                  <th key={col.key}
                    className="px-5 py-3 text-left text-xs font-semibold text-amame-muted uppercase tracking-wider whitespace-nowrap">
                    {col.label}
                  </th>
                ))}
                {hasActions && (
                  <th className="px-4 py-3 text-right text-xs font-semibold text-amame-muted uppercase tracking-wider whitespace-nowrap w-28">
                    Actions
                  </th>
                )}
              </tr>
            </thead>

            {/* Corps */}
            <tbody className="divide-y divide-amame-border bg-white">
              {data.map((row, i) => (
                <tr key={i} className="hover:bg-gray-50/50 transition-colors duration-100">
                  {columns.map((col) => (
                    <td key={col.key} className="px-5 py-3.5 text-sm text-amame-charcoal">
                      {col.render
                        ? col.render(row[col.key], row)
                        : (row[col.key] ?? <span className="text-amame-muted">—</span>)}
                    </td>
                  ))}

                  {hasActions && (
                    <td className="px-4 py-3.5 text-right">
                      <div className="flex justify-end items-center gap-0.5">
                        {onView && (
                          <button type="button" onClick={() => onView(row)} title="Voir"
                            className="p-1.5 rounded-lg text-amame-muted hover:text-blue-600 hover:bg-blue-50 transition-colors">
                            <EyeIcon className="h-4 w-4" />
                          </button>
                        )}
                        {canEdit(row) && (
                          <button type="button" onClick={() => onEdit!(row)} title="Modifier"
                            className="p-1.5 rounded-lg text-amame-muted hover:text-amame-green hover:bg-amame-green-subtle transition-colors">
                            <PencilSquareIcon className="h-4 w-4" />
                          </button>
                        )}
                        {canDelete(row) && (
                          <button type="button" onClick={() => setItemToDelete(row)} title="Supprimer"
                            className="p-1.5 rounded-lg text-amame-muted hover:text-red-600 hover:bg-red-50 transition-colors">
                            <TrashIcon className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* État vide */}
        {data.length === 0 && (
          <div className="text-center py-14 px-6">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-gray-100 rounded-xl mb-4">
              <TableCellsIcon className="h-6 w-6 text-amame-muted" />
            </div>
            <p className="text-sm font-semibold text-amame-charcoal mb-1">Aucune donnée disponible</p>
            <p className="text-xs text-amame-muted">Les éléments apparaîtront ici une fois ajoutés.</p>
          </div>
        )}
      </div>

      {/* Modale de confirmation */}
      <ConfirmDialog
        open={itemToDelete !== null}
        title={deleteConfirmTitle ?? "Confirmer la suppression"}
        description={itemToDelete ? getDescription(itemToDelete) : undefined}
        onConfirm={handleConfirmDelete}
        onClose={() => setItemToDelete(null)}
      />
    </>
  );
};

export default DataTable;
