import React, { useState } from "react";
import { Link } from "react-router-dom";
import { PlusIcon, MagnifyingGlassIcon } from "@heroicons/react/24/outline";
import DataTable from "@/components/admin/DataTable";
import {
  useGetAllFilieres,
  useDeleteFiliere,
} from "@/service/orientationService";
import {
  FiliereSummaryResponse,
  DomaineFiliereType,
} from "@/types/orientationType";

const FilieresManagement: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDomaine, setSelectedDomaine] = useState<
    DomaineFiliereType | ""
  >("");

  const { data: filieres, isLoading } = useGetAllFilieres();
  const deleteFiliereMutation = useDeleteFiliere();

  const filteredFilieres =
    (filieres?.content || []).filter(
      (filiere) =>
        (filiere.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
          filiere.descriptionCourte
            .toLowerCase()
            .includes(searchTerm.toLowerCase())) &&
        (selectedDomaine === "" || filiere.domaine === selectedDomaine),
    );

  const getDomaineLabel = (domaine: DomaineFiliereType) => {
    const domaines: Record<DomaineFiliereType, string> = {
      ALL: "Tous domaines",
      SCIENCES_ET_TECHNOLOGIES: "Sciences & Technologies",
      SCIENCES_DE_LA_SANTE: "Sciences de la Santé",
      SCIENCES_ECONOMIQUES_ET_GESTION: "Sciences Économiques & Gestion",
      DROIT_ET_SCIENCES_POLITIQUES: "Droit & Sciences Politiques",
      LETTRES_ET_SCIENCES_HUMAINES: "Lettres & Sciences Humaines",
      ARTS_ET_COMMUNICATION: "Arts & Communication",
    };
    return domaines[domaine];
  };

  const getDifficulteLabel = (difficulte: string) => {
    const difficultes: Record<string, string> = {
      TRES_ELEVEE: "Très élevée",
      ELEVEE: "Élevée",
      MOYENNE: "Moyenne",
      VARIABLE: "Variable",
    };
    return difficultes[difficulte] || difficulte;
  };

  const columns = [
    { key: "nom", label: "Nom de la filière" },
    {
      key: "domaine",
      label: "Domaine",
      render: (value: DomaineFiliereType) => getDomaineLabel(value),
    },
    {
      key: "difficulte",
      label: "Difficulté",
      render: (value: string) => (
        <span
          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
            value === "TRES_ELEVEE"
              ? "bg-red-100 text-red-800"
              : value === "ELEVEE"
                ? "bg-orange-100 text-orange-800"
                : value === "MOYENNE"
                  ? "bg-yellow-100 text-yellow-800"
                  : "bg-blue-100 text-blue-800"
          }`}
        >
          {getDifficulteLabel(value)}
        </span>
      ),
    },
    { key: "dureeEtudes", label: "Durée" },
    {
      key: "debouches",
      label: "Débouchés",
      render: (value: string[]) =>
        value.slice(0, 2).join(", ") + (value.length > 2 ? "..." : ""),
    },
  ];

  const handleDelete = (filiere: FiliereSummaryResponse) => {
    deleteFiliereMutation.mutate(filiere.id);
  };

  const handleEdit = (filiere: FiliereSummaryResponse) => {
    window.location.href = `/admin/filieres/edit/${filiere.id}`;
  };

  const handleView = (filiere: FiliereSummaryResponse) => {
    window.open(`/orientation/${filiere.id}`, "_blank");
  };

  return (
    <div>
      {/* En-tête */}
      <div className="sm:flex sm:items-center sm:justify-between mb-6">
        <div>
          <h1 className="font-nunito font-bold text-2xl text-amame-charcoal">Filières</h1>
          <p className="mt-1 text-sm text-amame-muted">
            {filieres?.totalElements ?? 0} filière{(filieres?.totalElements ?? 0) > 1 ? "s" : ""} disponibles
          </p>
        </div>
        <div className="mt-4 sm:mt-0">
          <Link
            to="/admin/filieres/new"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white bg-amame-green hover:bg-amame-green-dark transition-colors shadow-green"
          >
            <PlusIcon className="h-4 w-4" />
            Nouvelle filière
          </Link>
        </div>
      </div>

      {/* Recherche + filtre domaine */}
      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <div className="relative flex-1 max-w-sm">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-amame-muted pointer-events-none" />
          <input
            type="text"
            placeholder="Rechercher une filière..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 pr-4 py-2 w-full text-sm border border-amame-border rounded-xl focus:outline-none focus:ring-1 focus:ring-amame-green focus:border-amame-green placeholder-amame-muted/60 bg-white"
          />
        </div>
        <select
          value={selectedDomaine}
          onChange={(e) => setSelectedDomaine(e.target.value as DomaineFiliereType | "")}
          className="py-2 pl-3 pr-8 text-sm border border-amame-border rounded-xl focus:outline-none focus:ring-1 focus:ring-amame-green focus:border-amame-green bg-white text-amame-charcoal"
        >
          <option value="">Tous les domaines</option>
          <option value="SCIENCES_ET_TECHNOLOGIES">Sciences & Technologies</option>
          <option value="SCIENCES_DE_LA_SANTE">Sciences de la Santé</option>
          <option value="SCIENCES_ECONOMIQUES_ET_GESTION">Sciences Éco & Gestion</option>
          <option value="DROIT_ET_SCIENCES_POLITIQUES">Droit & Sciences Politiques</option>
          <option value="LETTRES_ET_SCIENCES_HUMAINES">Lettres & Sciences Humaines</option>
          <option value="ARTS_ET_COMMUNICATION">Arts & Communication</option>
        </select>
      </div>

      <DataTable
        columns={columns}
        data={filteredFilieres}
        onEdit={handleEdit}
        onDelete={handleDelete}
        deleteConfirmMessage={(row) => `La filière "${row.nom}" sera définitivement supprimée.`}
        onView={handleView}
        isLoading={isLoading}
      />
    </div>
  );
};

export default FilieresManagement;
