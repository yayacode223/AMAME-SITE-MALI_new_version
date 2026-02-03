// BourseDetail.tsx - VERSION LÉGÈREMENT OPTIMISÉE
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Calendar, MapPin, GraduationCap, Building, ExternalLink, Eye, Clock } from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { useGetBourseDetail } from '@/service/bourseService';
import { useMemo } from 'react';

const BoursesDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: bourse, isLoading, error } = useGetBourseDetail(Number(id));

  // Utiliser useMemo pour éviter les recalculs
  const formattedDate = useMemo(() => {
    if (!bourse?.dateLimite) return 'Non spécifiée';
    return new Date(bourse.dateLimite).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  }, [bourse?.dateLimite]);

  const isDeadlineApproaching = useMemo(() => {
    if (!bourse?.dateLimite) return false;
    const deadline = new Date(bourse.dateLimite);
    const today = new Date();
    const diffTime = deadline.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays <= 30 && diffDays > 0;
  }, [bourse?.dateLimite]);

  const isDeadlinePassed = useMemo(() => {
    if (!bourse?.dateLimite) return false;
    const deadline = new Date(bourse.dateLimite);
    const today = new Date();
    return deadline < today;
  }, [bourse?.dateLimite]);

  const handleGoBack = () => {
    navigate(-1);
  };

  const handleVisitWebsite = () => {
    if (bourse?.urlSource) {
      window.open(bourse.urlSource, '_blank', 'noopener,noreferrer');
    }
  };

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-blue-50">
        <Navbar />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="inline-flex items-center justify-center w-16 h-16 bg-red-100 rounded-full mb-6">
              <Eye className="h-8 w-8 text-red-600" />
            </div>
            <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-4">
              Bourse non trouvée
            </h1>
            <p className="text-gray-600 mb-8 max-w-md mx-auto">
              La bourse que vous recherchez n'existe pas ou a été supprimée.
            </p>
            <Button onClick={handleGoBack} className="bg-purple-600 hover:bg-purple-700">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Retour aux bourses
            </Button>
          </motion.div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-blue-50">
      <Navbar />
      
      {/* Header Navigation */}
      <section className="bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-4">
            <Button
              variant="ghost"
              onClick={handleGoBack}
              className="text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Retour aux bourses
            </Button>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-8 lg:py-12">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <AnimatePresence mode="wait">
            {isLoading ? (
              <motion.div
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
              >
                {/* Skeleton optimisé avec moins d'éléments */}
                <div className="grid lg:grid-cols-3 gap-8">
                  {/* Content Side */}
                  <div className="lg:col-span-2 space-y-6">
                    <div className="bg-white rounded-2xl p-6 lg:p-8 border border-gray-100">
                      <Skeleton className="h-8 w-3/4 mb-4 rounded-lg" />
                      <Skeleton className="h-6 w-1/2 mb-6 rounded-lg" />
                      <div className="flex flex-wrap gap-2 mb-6">
                        <Skeleton className="h-6 w-20 rounded-full" />
                        <Skeleton className="h-6 w-24 rounded-full" />
                        <Skeleton className="h-6 w-16 rounded-full" />
                      </div>
                      <Skeleton className="h-6 w-full mb-2 rounded-lg" />
                      <Skeleton className="h-6 w-2/3 rounded-lg" />
                    </div>
                    
                    <div className="bg-white rounded-2xl p-6 lg:p-8 border border-gray-100">
                      <Skeleton className="h-7 w-32 mb-4 rounded-lg" />
                      <Skeleton className="h-24 w-full rounded-lg" />
                    </div>
                  </div>
                  
                  {/* Sidebar */}
                  <div className="space-y-6">
                    <Skeleton className="h-48 w-full rounded-xl" />
                    <Skeleton className="h-32 w-full rounded-xl" />
                  </div>
                </div>
              </motion.div>
            ) : bourse ? (
              <motion.div
                key="content"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="grid lg:grid-cols-3 gap-8"
              >
                {/* Main Content */}
                <div className="lg:col-span-2 space-y-8">
                  {/* Header */}
                  <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 lg:p-8">
                    <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4 mb-6">
                      <div>
                        <h1 className="text-2xl lg:text-4xl font-bold text-gray-900 mb-4 leading-tight">
                          {bourse.titre}
                        </h1>
                        <p className="text-lg text-gray-600 leading-relaxed">
                          {bourse.descriptionCourte}
                        </p>
                      </div>
                    </div>

                    {/* Badges */}
                    <div className="flex flex-wrap gap-2 mb-6">
                      {bourse.niveau && (
                        <Badge variant="secondary" className="bg-blue-100 text-blue-700 hover:bg-blue-200 px-3 py-1">
                          <GraduationCap className="h-3 w-3 mr-1" />
                          {bourse.niveau}
                        </Badge>
                      )}
                      {bourse.paysHote && (
                        <Badge variant="secondary" className="bg-green-100 text-green-700 hover:bg-green-200 px-3 py-1">
                          <MapPin className="h-3 w-3 mr-1" />
                          {bourse.paysHote}
                        </Badge>
                      )}
                      {bourse.categorie && (
                        <Badge variant="secondary" className="bg-purple-100 text-purple-700 hover:bg-purple-200 px-3 py-1">
                          {bourse.categorie}
                        </Badge>
                      )}
                      {bourse.financementStatut && (
                        <Badge variant="secondary" className="bg-emerald-100 text-emerald-700 hover:bg-emerald-200 px-3 py-1">
                          {bourse.financementStatut}
                        </Badge>
                      )}
                    </div>

                    {/* Deadline Alert */}
                    {bourse.dateLimite && (
                      <div className={`rounded-xl p-4 mb-6 ${
                        isDeadlinePassed
                          ? 'bg-red-50 border border-red-200'
                          : isDeadlineApproaching
                          ? 'bg-orange-50 border border-orange-200'
                          : 'bg-blue-50 border border-blue-200'
                      }`}>
                        <div className="flex items-center gap-3">
                          <Clock className={`h-5 w-5 ${
                            isDeadlinePassed
                              ? 'text-red-600'
                              : isDeadlineApproaching
                              ? 'text-orange-600'
                              : 'text-blue-600'
                          }`} />
                          <div>
                            <p className={`font-semibold ${
                              isDeadlinePassed
                                ? 'text-red-800'
                                : isDeadlineApproaching
                                ? 'text-orange-800'
                                : 'text-blue-800'
                            }`}>
                              {isDeadlinePassed
                                ? 'Date limite dépassée'
                                : isDeadlineApproaching
                                ? 'Date limite approche'
                                : 'Date limite de candidature'
                              }
                            </p>
                            <p className={`text-sm ${
                              isDeadlinePassed
                                ? 'text-red-600'
                                : isDeadlineApproaching
                                ? 'text-orange-600'
                                : 'text-blue-600'
                            }`}>
                              {formattedDate}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Detailed Description */}
                  <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 lg:p-8">
                    <h2 className="text-xl lg:text-2xl font-bold text-gray-900 mb-6">
                      Description détaillée
                    </h2>
                    <div className="prose prose-lg max-w-none text-gray-700 leading-relaxed">
                      {bourse.descriptionLongue ? (
                        <p className="whitespace-pre-line">{bourse.descriptionLongue}</p>
                      ) : (
                        <p className="text-gray-500 italic">
                          Aucune description détaillée n'est disponible pour cette bourse.
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Organization Info */}
                  {(bourse.organisation || bourse.bailleur) && (
                    <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 lg:p-8">
                      <h2 className="text-xl lg:text-2xl font-bold text-gray-900 mb-6">
                        Organisation
                      </h2>
                      <div className="flex items-start gap-4">
                        <div className="flex items-center justify-center w-12 h-12 bg-purple-100 rounded-xl flex-shrink-0">
                          <Building className="h-6 w-6 text-purple-600" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900 text-lg mb-2">
                            {bourse.organisation || bourse.bailleur}
                          </h3>
                          {bourse.bailleur && bourse.organisation && (
                            <p className="text-gray-600">
                              Bailleur: {bourse.bailleur}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Sidebar */}
                <div className="space-y-6">
                  {/* Quick Actions */}
                  <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-4">
                    <div className="space-y-4">
                      <Button
                        onClick={handleVisitWebsite}
                        disabled={!bourse.urlSource}
                        className="w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold py-3 rounded-xl transition-all hover:scale-[1.02] active:scale-[0.98]"
                      >
                        <ExternalLink className="mr-2 h-4 w-4" />
                        Lien vers le site source
                      </Button>
                    </div>

                    {/* Stats */}
                    <div className="mt-6 pt-6 border-t border-gray-200 space-y-4">
                      {bourse.datePublication && (
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-600">Publiée le</span>
                          <span className="font-medium text-gray-900">
                            {new Date(bourse.datePublication).toLocaleDateString('fr-FR', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric'
                            })}
                          </span>
                        </div>
                      )}
                      
                      {bourse.nombresVues !== undefined && (
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-600">Vues</span>
                          <span className="font-medium text-gray-900">
                            {bourse.nombresVues.toLocaleString()}
                          </span>
                        </div>
                      )}
                      
                      {bourse.financement && (
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-600">Financement</span>
                          <span className="font-medium text-gray-900">
                            {bourse.financement}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Eligibility */}
                  {(bourse.paysEligible || bourse.regionEligible) && (
                    <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
                      <h3 className="font-semibold text-gray-900 mb-4">
                        Éligibilité
                      </h3>
                      <div className="space-y-3">
                        {bourse.paysEligible && (
                          <div className="flex items-center gap-3">
                            <MapPin className="h-4 w-4 text-green-600 flex-shrink-0" />
                            <div>
                              <p className="text-sm font-medium text-gray-900">Pays éligibles</p>
                              <p className="text-sm text-gray-600">{bourse.paysEligible}</p>
                            </div>
                          </div>
                        )}
                        {bourse.regionEligible && (
                          <div className="flex items-center gap-3">
                            <MapPin className="h-4 w-4 text-blue-600 flex-shrink-0" />
                            <div>
                              <p className="text-sm font-medium text-gray-900">Régions éligibles</p>
                              <p className="text-sm text-gray-600">{bourse.regionEligible}</p>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            ) : null}
          </AnimatePresence>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default BoursesDetail;