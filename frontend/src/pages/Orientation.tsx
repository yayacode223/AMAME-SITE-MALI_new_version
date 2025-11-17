import { useState } from "react";
import { Card } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Badge } from "../components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

import {
  Briefcase,
  TrendingUp,
  Search,
  Filter,
  Star,
  Users,
  ArrowRight,
  BookOpen,
  Target,
} from "lucide-react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { Link } from "react-router-dom";
import {
  useGetAllFilieres,
  useGetFilieresByDomaine,
  useSearchFilieresBySearchTerm,
} from "../service/orientationService";
import { DomaineFiliereType } from "@/types/orientationType";

export function Orientation() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDomain, setSelectedDomain] = useState<DomaineFiliereType>(
    DomaineFiliereType.ALL
  );

  //Recuperer toutes les filieres
  const { data: allFilieresData, isLoading: isLoadingAll } =
    useGetAllFilieres();

  //Recuperer les filieres par domaine
  const { data: FilieresDataByDomaine } =
    useGetFilieresByDomaine(selectedDomain);
  // Récupérer les filières avec recherche/filtre
  const { data: filieresDataBySearch } =
    useSearchFilieresBySearchTerm(searchTerm);

  const domains: DomaineFiliereType[] = [
    DomaineFiliereType.ALL,
    DomaineFiliereType.SCIENCES_ET_TECHNOLOGIES,
    DomaineFiliereType.SCIENCES_DE_LA_SANTE,
    DomaineFiliereType.SCIENCES_ECONOMIQUES_ET_GESTION,
    DomaineFiliereType.DROIT_ET_SCIENCES_POLITIQUES,
    DomaineFiliereType.LETTRES_ET_SCIENCES_HUMAINES,
    DomaineFiliereType.ARTS_ET_COMMUNICATION,
  ];

  const filieresDataToShow = searchTerm
    ? filieresDataBySearch
    : selectedDomain === DomaineFiliereType.ALL
    ? allFilieresData
    : FilieresDataByDomaine;

  if (isLoadingAll) {
    return (
      <div className="border-0 rounded-2xl bg-white shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden">
        <div className="p-6">
          <Skeleton className="h-7 w-3/4 mb-3 rounded-lg" />
          <Skeleton className="h-4 w-1/2 mb-4 rounded-lg" />
          <div className="flex gap-2 mb-4">
            <Skeleton className="h-6 w-20 rounded-full" />
            <Skeleton className="h-6 w-16 rounded-full" />
          </div>
          <Skeleton className="h-4 w-full mb-2 rounded-lg" />
          <Skeleton className="h-4 w-2/3 mb-4 rounded-lg" />
          <Skeleton className="h-20 w-full rounded-lg mb-4" />
          <Skeleton className="h-12 w-full rounded-xl" />
        </div>
      </div>
    );
  }

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-blue-50">
        {/* Hero Section */}
        <section className="bg-gradient-to-r from-purple-500 to-blue-500 text-white py-20">
          <div className="max-w-6xl mx-dauto px-4 sm:px-6 lg:px-8 text-center">
            <h1 className="text-4xl md:text-6xl font-bold mb-6 leading-tight">
              Guide d'<span className="text-yellow-300">Orientation</span>
            </h1>
            <p className="text-xl md:text-2xl text-blue-100 max-w-3xl mx-auto leading-relaxed">
              Trouvez la filière qui correspond à vos passions et ambitions
            </p>
            <p className="text-lg text-blue-200 mt-4 max-w-2xl mx-auto">
              Découvrez les parcours académiques, débouchés professionnels et
              conseils pour faire le bon choix
            </p>
          </div>
        </section>

        {/* Stats Section */}
        <section className="py-4 bg-white">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            {/* Guidance Card */}
            <Card className="p-8 mb-12 bg-gradient-to-br from-white to-purple-50 border-0 shadow-xl">
              <div className="text-center mb-8">
                <Target className="h-12 w-12 text-purple-600 mx-auto mb-4" />
                <h2 className="text-3xl font-bold text-gray-900 mb-4">
                  Comment Choisir Sa Filière ?
                </h2>
                <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                  Les clés pour faire un choix éclairé et épanouissant
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-6">
                  <div className="flex items-start space-x-4">
                    <div className="bg-emerald-100 p-3 rounded-xl">
                      <TrendingUp className="h-6 w-6 text-emerald-600" />
                    </div>
                    <div>
                      <h3 className="font-bold text-lg text-gray-900 mb-2">
                        Vos Intérêts et Passions
                      </h3>
                      <p className="text-gray-700">
                        Identifiez les matières et domaines qui vous
                        passionnent. Votre motivation sera votre meilleur atout
                        pour réussir et vous épanouir professionnellement.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-4">
                    <div className="bg-blue-100 p-3 rounded-xl">
                      <BookOpen className="h-6 w-6 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="font-bold text-lg text-gray-900 mb-2">
                        Compétences et Talents
                      </h3>
                      <p className="text-gray-700">
                        Évaluez vos forces naturelles et les compétences que
                        vous souhaitez développer. Choisissez une filière qui
                        valorise vos talents.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="flex items-start space-x-4">
                    <div className="bg-amber-100 p-3 rounded-xl">
                      <Briefcase className="h-6 w-6 text-amber-600" />
                    </div>
                    <div>
                      <h3 className="font-bold text-lg text-gray-900 mb-2">
                        Débouchés Professionnels
                      </h3>
                      <p className="text-gray-700">
                        Renseignez-vous sur les opportunités de carrière, le
                        marché de l'emploi et les perspectives d'évolution dans
                        les domaines qui vous intéressent.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-4">
                    <div className="bg-purple-100 p-3 rounded-xl">
                      <Users className="h-6 w-6 text-purple-600" />
                    </div>
                    <div>
                      <h3 className="font-bold text-lg text-gray-900 mb-2">
                        Témoignages et Retours
                      </h3>
                      <p className="text-gray-700">
                        Échangez avec des professionnels et des étudiants pour
                        comprendre la réalité du métier et les défis de chaque
                        filière.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </section>

        {/* Search and Filter Section */}
        <section className="py-4">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
              <div className="flex flex-col lg:flex-row gap-4 items-center">
                <div className="flex-1 w-full">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                    <Input
                      type="text"
                      placeholder="Rechercher une filière, un métier..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 h-12 text-lg border-2 border-gray-200 focus:border-purple-500 transition-colors"
                    />
                  </div>
                </div>
                <div className="w-full lg:w-64">
                  <div className="relative">
                    <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                    <select
                      aria-label="Filtrer par domaine"
                      title="Filtrer par domaine"
                      value={selectedDomain}
                      onChange={(e) =>
                        setSelectedDomain(e.target.value as DomaineFiliereType)
                      }
                      className="w-full h-12 pl-10 pr-4 border-2 border-gray-200 rounded-lg focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-colors appearance-none bg-white"
                    >
                      {domains.map((domain) => (
                        <option key={domain} value={domain}>
                          {domain === "ALL"
                            ? "Tous les domaines"
                            : domain === "SCIENCES_ET_TECHNOLOGIES"
                            ? "Sciences & Technologies"
                            : domain === "SCIENCES_DE_LA_SANTE"
                            ? "Santé"
                            : domain === "SCIENCES_ECONOMIQUES_ET_GESTION"
                            ? "Sciences Économiques & Gestion"
                            : domain === "DROIT_ET_SCIENCES_POLITIQUES"
                            ? "Droit & Sciences Politiques"
                            : domain === "LETTRES_ET_SCIENCES_HUMAINES"
                            ? "Lettres & Sciences Humaines"
                            : domain === "ARTS_ET_COMMUNICATION"
                            ? "Arts & Communication"
                            : ""}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            </div>

            {/* Filières Grid */}
            <div className="mb-8">
              <div className="flex justify-between items-center mb-8">
                <h2 className="text-3xl font-bold text-gray-900">
                  Filières Disponibles
                </h2>
                <Badge variant="secondary" className="text-lg px-4 py-2">
                  {filieresDataToShow?.length} filière
                  {filieresDataToShow?.length > 1 ? "s" : ""} trouvée
                  {filieresDataToShow?.length > 1 ? "s" : ""}
                </Badge>
              </div>

              {filieresDataToShow?.length === 0 ? (
                <Card className="p-12 text-center">
                  <div className="text-6xl mb-4">🔍</div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-4">
                    Aucune filière trouvée
                  </h3>
                  <p className="text-gray-600 mb-6">
                    Essayez de modifier vos critères de recherche ou explorez
                    toutes les filières disponibles.
                  </p>
                  <Button
                    onClick={() => {
                      setSearchTerm("");
                      setSelectedDomain(DomaineFiliereType.ALL);
                    }}
                    className="bg-purple-600 hover:bg-purple-700"
                  >
                    Voir toutes les filières
                  </Button>
                </Card>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
                  {filieresDataToShow?.map((filiere) => (
                    <Card
                      key={filiere.id}
                      className="p-6 group hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 border-0 bg-white"
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div className="text-4xl">{filiere.icone}</div>
                        <Badge
                          className={`${
                            filiere.difficulte === "TRES_ELEVEE"
                              ? "bg-red-100 text-red-800"
                              : filiere.difficulte === "ELEVEE"
                              ? "bg-orange-100 text-orange-800"
                              : "bg-green-100 text-green-800"
                          }`}
                        >
                          {filiere.difficulte === "TRES_ELEVEE"
                            ? "Très élevée"
                            : filiere.difficulte === "ELEVEE"
                            ? "Élevée"
                            : "Moyenne"}
                        </Badge>
                      </div>

                      <h3 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-purple-600 transition-colors">
                        {filiere.nom}
                      </h3>
                      <p className="text-gray-600 mb-4 leading-relaxed">
                        {filiere.descriptionCourte}
                      </p>

                      <div className="space-y-4 mb-6">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-500">Durée:</span>
                          <span className="font-medium">
                            {filiere.dureeEtudes}
                          </span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-500">Demande:</span>
                          <span className="font-medium">{filiere.demande}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-500">Salaire:</span>
                          <span className="font-medium">{filiere.salaire}</span>
                        </div>
                      </div>

                      <div className="border-t pt-4">
                        <p className="text-sm font-semibold text-gray-700 mb-3">
                          Débouchés principaux :
                        </p>
                        <div className="flex flex-wrap gap-2 mb-4">
                          {filiere.debouches
                            .slice(0, 3)
                            .map((debouche, index) => (
                              <Badge
                                key={index}
                                variant="outline"
                                className="text-xs"
                              >
                                {debouche}
                              </Badge>
                            ))}
                          {filiere.debouches.length > 3 && (
                            <Badge variant="secondary" className="text-xs">
                              +{filiere.debouches.length - 3}
                            </Badge>
                          )}
                        </div>

                        <Button
                          variant="outline"
                          className="w-full group/btn"
                          asChild
                        >
                          <Link to={`/orientation/${filiere.id}`}>
                            <span>En savoir plus</span>
                            <ArrowRight className="ml-2 h-4 w-4 group-hover/btn:translate-x-1 transition-transform" />
                          </Link>
                        </Button>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </div>
        </section>
      </div>
      <Footer />
    </>
  );
}

export default Orientation;
