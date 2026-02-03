// OrientationDetail.tsx - VERSION OPTIMISÉE
import { useParams, Link } from "react-router-dom";
import { Card } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ArrowLeft,
  Clock,
  TrendingUp,
  Users,
  DollarSign,
  BookOpen,
  MapPin,
  Star,
  Target,
  Briefcase,
  GraduationCap,
} from "lucide-react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { useGetFiliereById } from "../service/orientationService";
import { DifficulteType } from "@/types/orientationType";

const url = import.meta.env.BASE; 

export function OrientationDetail() {
  const { id } = useParams();
  const { data: filiereData, isLoading } = useGetFiliereById(Number(id));

  if (isLoading) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen bg-gradient-to-b from-slate-50 to-blue-50">
          {/* Header skeleton */}
          <section className="bg-white border-b">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
              <Skeleton className="h-10 w-32 mb-6 rounded-lg" />
              <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between">
                <div className="flex items-center gap-4 mb-4 lg:mb-0">
                  <Skeleton className="w-16 h-16 rounded-md" />
                  <div>
                    <Skeleton className="h-8 w-48 mb-2 rounded-lg" />
                    <Skeleton className="h-5 w-64 rounded-lg" />
                  </div>
                </div>
                <Skeleton className="h-10 w-32 rounded-full" />
              </div>
            </div>
          </section>

          {/* Content skeleton */}
          <section className="py-12">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Sidebar skeleton */}
                <div className="lg:col-span-1 space-y-6">
                  <Skeleton className="h-64 w-full rounded-xl" />
                  <Skeleton className="h-56 w-full rounded-xl" />
                  <Skeleton className="h-48 w-full rounded-xl" />
                </div>
                
                {/* Main content skeleton */}
                <div className="lg:col-span-2 space-y-8">
                  <Skeleton className="h-40 w-full rounded-xl" />
                  <Skeleton className="h-48 w-full rounded-xl" />
                  <Skeleton className="h-32 w-full rounded-xl" />
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Skeleton className="h-40 w-full rounded-xl" />
                    <Skeleton className="h-40 w-full rounded-xl" />
                  </div>
                </div>
              </div>
            </div>
          </section>
        </div>
        <Footer />
      </>
    );
  }

  if (!filiereData) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen bg-gradient-to-b from-slate-50 to-blue-50 flex items-center justify-center">
          <Card className="p-8 text-center max-w-md">
            <div className="text-6xl mb-4">😕</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Filière non trouvée
            </h2>
            <p className="text-gray-600 mb-6">
              La filière que vous recherchez n'existe pas ou a été déplacée.
            </p>
            <Button asChild>
              <Link to="/orientation">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Retour à l'orientation
              </Link>
            </Button>
          </Card>
        </div>
        <Footer />
      </>
    );
  }

  const getDifficultyColor = () => {
    switch (filiereData.difficulte) {
      case DifficulteType.TRES_ELEVEE:
        return "bg-red-100 text-red-800 hover:bg-red-200";
      case DifficulteType.ELEVEE:
        return "bg-orange-100 text-orange-800 hover:bg-orange-200";
      default:
        return "bg-green-100 text-green-800 hover:bg-green-200";
    }
  };

  const getDifficultyText = () => {
    switch (filiereData.difficulte) {
      case DifficulteType.TRES_ELEVEE:
        return "Très élevée";
      case DifficulteType.ELEVEE:
        return "Élevée";
      default:
        return "Moyenne";
    }
  };

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-blue-50">
        {/* Header */}
        <section className="bg-white border-b">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <Button 
              variant="ghost" 
              asChild 
              className="mb-6 hover:bg-gray-100 transition-colors"
            >
              <Link to="/orientation">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Retour à l'orientation
              </Link>
            </Button>

            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
              <div className="flex items-start gap-4">
                {filiereData.filePath ? (
                  <div className="flex-shrink-0">
                    <img
                      className="w-16 h-16 object-cover rounded-lg shadow-md"
                      src={`${url}/${filiereData.filePath}`}
                      alt={filiereData.nom}
                      loading="lazy"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                        const fallback = document.createElement('div');
                        fallback.className = 'w-16 h-16 bg-gradient-to-br from-purple-500 to-blue-500 rounded-lg flex items-center justify-center';
                        fallback.innerHTML = '<GraduationCap class="h-8 w-8 text-white" />';
                        e.currentTarget.parentNode?.appendChild(fallback);
                      }}
                    />
                  </div>
                ) : (
                  <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-blue-500 rounded-lg flex items-center justify-center flex-shrink-0">
                    <GraduationCap className="h-8 w-8 text-white" />
                  </div>
                )}
                <div>
                  <h1 className="text-3xl md:text-4xl font-bold text-gray-900">
                    {filiereData.nom}
                  </h1>
                  <p className="text-lg text-gray-600 mt-3 leading-relaxed">
                    {filiereData.descriptionLongue?.slice(0, 180) || "Description de la filière..."}
                  </p>
                </div>
              </div>

              <Badge
                className={`text-lg px-4 py-2 font-medium ${getDifficultyColor()} transition-colors`}
              >
                Difficulté : {getDifficultyText()}
              </Badge>
            </div>
          </div>
        </section>

        {/* Main Content */}
        <section className="py-12">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Sidebar */}
              <div className="lg:col-span-1 space-y-6">
                {/* Quick Stats */}
                <Card className="p-6 border-0 shadow-lg">
                  <h3 className="font-bold text-lg text-gray-900 mb-4 flex items-center">
                    <Target className="mr-2 h-5 w-5 text-purple-600" />
                    Aperçu Rapide
                  </h3>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600 flex items-center">
                        <Clock className="mr-2 h-4 w-4" />
                        Durée
                      </span>
                      <span className="font-semibold text-gray-900">
                        {filiereData.dureeEtudes || "Non spécifiée"}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600 flex items-center">
                        <TrendingUp className="mr-2 h-4 w-4" />
                        Demande
                      </span>
                      <span className="font-semibold text-gray-900">
                        {filiereData.demande || "Non spécifiée"}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600 flex items-center">
                        <DollarSign className="mr-2 h-4 w-4" />
                        Taux d'emploi
                      </span>
                      <span className="font-semibold text-green-600">
                        {filiereData.tauxEmploi || "Non spécifié"}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600 flex items-center">
                        <Users className="mr-2 h-4 w-4" />
                        Salaire début
                      </span>
                      <span className="font-semibold text-gray-900">
                        {filiereData.salaireDebut || "Non spécifié"}
                      </span>
                    </div>
                  </div>
                </Card>

                {/* Universities */}
                {filiereData.universites && filiereData.universites.length > 0 && (
                  <Card className="p-6 border-0 shadow-lg">
                    <h3 className="font-bold text-lg text-gray-900 mb-4 flex items-center">
                      <MapPin className="mr-2 h-5 w-5 text-blue-600" />
                      Établissements Recommandés
                    </h3>
                    <ul className="space-y-3">
                      {filiereData.universites.slice(0, 5).map((universite, index) => (
                        <li
                          key={index}
                          className="flex items-center text-gray-700 group"
                        >
                          <Star className="mr-3 h-4 w-4 text-yellow-500 group-hover:text-yellow-600 transition-colors" />
                          <span className="group-hover:text-blue-600 transition-colors">
                            {universite}
                          </span>
                        </li>
                      ))}
                      {filiereData.universites.length > 5 && (
                        <li className="text-sm text-gray-500 italic">
                          + {filiereData.universites.length - 5} autres établissements
                        </li>
                      )}
                    </ul>
                  </Card>
                )}

                {/* Prerequisites */}
                {filiereData.prerequis && filiereData.prerequis.length > 0 && (
                  <Card className="p-6 border-0 shadow-lg">
                    <h3 className="font-bold text-lg text-gray-900 mb-4 flex items-center">
                      <BookOpen className="mr-2 h-5 w-5 text-green-600" />
                      Prérequis
                    </h3>
                    <ul className="space-y-3">
                      {filiereData.prerequis.slice(0, 6).map((prerequis, index) => (
                        <li
                          key={index}
                          className="flex items-start text-gray-700"
                        >
                          <div className="w-2 h-2 bg-green-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                          <span>{prerequis}</span>
                        </li>
                      ))}
                      {filiereData.prerequis.length > 6 && (
                        <li className="text-sm text-gray-500 italic">
                          + {filiereData.prerequis.length - 6} autres prérequis
                        </li>
                      )}
                    </ul>
                  </Card>
                )}
              </div>

              {/* Main Content */}
              <div className="lg:col-span-2 space-y-8">
                {/* Description */}
                <Card className="p-6 lg:p-8 border-0 shadow-lg">
                  <h2 className="text-2xl font-bold text-gray-900 mb-6">
                    Description de la Filière
                  </h2>
                  <p className="text-gray-700 leading-relaxed text-lg">
                    {filiereData.descriptionLongue || "Aucune description détaillée disponible."}
                  </p>
                </Card>

                {/* Career Opportunities */}
                {filiereData.debouches && filiereData.debouches.length > 0 && (
                  <Card className="p-6 lg:p-8 border-0 shadow-lg">
                    <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
                      <Briefcase className="mr-3 h-6 w-6 text-purple-600" />
                      Débouchés Professionnels
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {filiereData.debouches.map((debouche, index) => (
                        <div
                          key={index}
                          className="flex items-center p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors group"
                        >
                          <div className="w-3 h-3 bg-purple-500 rounded-full mr-4 group-hover:bg-purple-600 transition-colors"></div>
                          <span className="font-medium text-gray-800 group-hover:text-purple-700 transition-colors">
                            {debouche}
                          </span>
                        </div>
                      ))}
                    </div>
                  </Card>
                )}

                {/* Skills & Competencies */}
                {filiereData.competences && filiereData.competences.length > 0 && (
                  <Card className="p-6 lg:p-8 border-0 shadow-lg">
                    <h2 className="text-2xl font-bold text-gray-900 mb-6">
                      Compétences Développées
                    </h2>
                    <div className="flex flex-wrap gap-3">
                      {filiereData.competences.map((competence, index) => (
                        <Badge
                          key={index}
                          variant="secondary"
                          className="text-sm py-2 px-4 bg-blue-50 text-blue-700 hover:bg-blue-100 border-blue-200"
                        >
                          {competence}
                        </Badge>
                      ))}
                    </div>
                  </Card>
                )}

                {/* Salary & Prospects */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card className="p-6 border-0 shadow-lg">
                    <h3 className="font-bold text-lg text-gray-900 mb-4">
                      Évolution de Carrière
                    </h3>
                    <div className="space-y-6">
                      <div>
                        <p className="text-gray-600 text-sm mb-1">
                          Début de carrière
                        </p>
                        <p className="font-semibold text-2xl text-gray-900">
                          {filiereData.salaireDebut || "Non spécifié"}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-600 text-sm mb-1">
                          Avec expérience
                        </p>
                        <p className="font-semibold text-2xl text-green-600">
                          {filiereData.salaireExperience || "Non spécifié"}
                        </p>
                      </div>
                    </div>
                  </Card>

                  <Card className="p-6 border-0 shadow-lg">
                    <h3 className="font-bold text-lg text-gray-900 mb-4">
                      Perspectives d'Avenir
                    </h3>
                    <p className="text-gray-700 leading-relaxed">
                      {filiereData.perspectives || "Les perspectives pour cette filière sont prometteuses avec une demande croissante sur le marché de l'emploi."}
                    </p>
                  </Card>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
      <Footer />
    </>
  );
}

export default OrientationDetail;