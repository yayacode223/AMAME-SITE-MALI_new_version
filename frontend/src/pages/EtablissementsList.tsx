import React, { useState, useEffect } from "react";

const mockEtablissements = [
  {
    id: 1,
    nom: "Université des Sciences Sociales et de Gestion de Bamako (USSG-B)",
    type: "Établissement public",
    ville: "Bamako",
    image: "/logos/ussgb.png",
  },
  {
    id: 2,
    nom: "Ecole Normale d’Enseignement Technique et Professionnel",
    type: "Établissement public",
    ville: "Bamako",
    image: "/logos/bamadanet.png",
  },
  // Ajoute d'autres établissements ici...
];

export default function EtablissementsList() {
  const [search, setSearch] = useState("");
  const [filtered, setFiltered] = useState(mockEtablissements);

  useEffect(() => {
    setFiltered(
      mockEtablissements.filter((e) =>
        e.nom.toLowerCase().includes(search.toLowerCase())
      )
    );
  }, [search]);

  return (
    <div className="p-4 max-w-7xl mx-auto">
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
        <input
          type="text"
          placeholder="Que recherchez-vous ?"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="border border-gray-300 rounded px-3 py-2 md:col-span-2"
        />
        <select  className="border border-gray-300 rounded px-3 py-2">
          <option value="">Tous les domaines</option>
        </select>
        <select className="border border-gray-300 rounded px-3 py-2">
          <option value="">Tous les cours</option>
        </select>
        <select className="border border-gray-300 rounded px-3 py-2">
          <option value="">Tous les diplômes</option>
        </select>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {filtered.map((etab) => (
          <div
            key={etab.id}
            className="rounded-2xl overflow-hidden shadow-md border border-gray-200 bg-white hover:scale-105 transition-transform"
          >
            <div className="h-full flex flex-col justify-between">
              <img
                src={etab.image}
                alt={etab.nom}
                className="w-full h-32 object-contain bg-gray-50 p-2"
              />
              <div className="p-4">
                <h3 className="text-lg font-semibold text-gray-800 mb-1">
                  {etab.nom}
                </h3>
                <p className="text-sm text-gray-500 mb-1">{etab.type}</p>
                <div className="flex items-center text-sm text-gray-500">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth="1.5"
                    stroke="currentColor"
                    className="w-4 h-4 mr-1"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M19.5 10.5c0 7.5-7.5 12-7.5 12s-7.5-4.5-7.5-12a7.5 7.5 0 1115 0z"
                    />
                  </svg>
                  {etab.ville}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
