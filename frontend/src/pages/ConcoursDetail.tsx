// ConcoursDetail.tsx - VERSION LÉGÈREMENT OPTIMISÉE
import { useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Calendar, 
  MapPin, 
  GraduationCap, 
  Target, 
  Globe, 
  FileText, 
  ArrowLeft,
  Clock,
  ExternalLink,
  Download
} from 'lucide-react';
import { useConcoursDetail } from '@/service/concoursService';

const ConcoursDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: concours, isLoading, error } = useConcoursDetail(Number(id));

  // Utiliser useMemo pour éviter les recalculs
  const formattedOpenDate = useMemo(() => {
    if (!concours?.dateOuverture) return '';
    try {
      return format(new Date(concours.dateOuverture), 'dd MMMM yyyy', { locale: fr });
    } catch {
      return concours.dateOuverture;
    }
  }, [concours?.dateOuverture]);

  const formattedLimitDate = useMemo(() => {
    if (!concours?.dateLimite) return '';
    try {
      return format(new Date(concours.dateLimite), 'dd MMMM yyyy', { locale: fr });
    } catch {
      return concours.dateLimite;
    }
  }, [concours?.dateLimite]);

  // Obtenir le statut du concours avec useMemo
  const statusInfo = useMemo(() => {
    if (!concours) return null;
    
    const now = new Date();
    const dateLimite = new Date(concours.dateLimite);
    const dateOuverture = new Date(concours.dateOuverture);

    if (now < dateOuverture) {
      return { status: 'soon', label: 'Bientôt', color: 'bg-blue-100 text-blue-800' };
    } else if (now <= dateLimite) {
      return { status: 'open', label: 'En cours', color: 'bg-green-100 text-green-800' };
    } else {
      return { status: 'closed', label: 'Terminé', color: 'bg-red-100 text-red-800' };
    }
  }, [concours]);

  // Ouvrir le fichier dans un nouvel onglet
  const handleOpenFile = () => {
    if (concours?.filePath) {
      // Si c'est une URL complète
      if (concours.filePath.startsWith('http')) {
        window.open(concours.filePath, '_blank');
      } else {
        // Si c'est un chemin relatif, on construit l'URL complète
        const baseUrl = process.env.REACT_APP_API_URL || '';
        const fullUrl = `${baseUrl}${concours.filePath.startsWith('/') ? '' : '/'}${concours.filePath}`;
        window.open(fullUrl, '_blank');
      }
    }
  };

  // Télécharger le fichier
  const handleDownloadFile = async () => {
    if (concours?.filePath) {
      try {
        let fileUrl = concours.filePath;
        
        // Construire l'URL complète si nécessaire
        if (!concours.filePath.startsWith('http')) {
          const baseUrl = process.env.REACT_APP_API_URL || '';
          fileUrl = `${baseUrl}${concours.filePath.startsWith('/') ? '' : '/'}${concours.filePath}`;
        }

        // Créer un lien de téléchargement
        const link = document.createElement('a');
        link.href = fileUrl;
        link.setAttribute('download', `${concours.nom.replace(/\s+/g, '_')}_document.pdf`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } catch (error) {
        console.error('Erreur lors du téléchargement:', error);
        // Fallback: ouvrir dans un nouvel onglet
        handleOpenFile();
      }
    }
  };

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-blue-50">
        <Navbar />
        <div className="flex flex-col items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Concours non trouvé</h1>
            <p className="text-gray-600 mb-8">Le concours que vous recherchez n'existe pas ou a été supprimé.</p>
            <Button onClick={() => navigate('/concours')}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Retour aux concours
            </Button>
          </div>
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
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <Button
            variant="ghost"
            onClick={() => navigate('/concours')}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="h-4 w-4" />
            Retour aux concours
          </Button>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-8 lg:py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {isLoading ? (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Sidebar Skeleton */}
              <div className="lg:col-span-1">
                <div className="bg-white rounded-2xl shadow-lg p-6">
                  <Skeleton className="h-6 w-32 mb-4 rounded-full" />
                  <div className="space-y-4 mb-6">
                    <Skeleton className="h-5 w-24 rounded-lg" />
                    <Skeleton className="h-4 w-36 rounded-lg" />
                    <Skeleton className="h-5 w-24 rounded-lg" />
                    <Skeleton className="h-4 w-36 rounded-lg" />
                  </div>
                  <Skeleton className="h-12 w-full mb-3 rounded-xl" />
                  <Skeleton className="h-12 w-full rounded-xl" />
                </div>
              </div>
              
              {/* Content Skeleton */}
              <div className="lg:col-span-2">
                <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
                  <Skeleton className="h-8 w-48 mb-3 rounded-full" />
                  <Skeleton className="h-10 w-3/4 mb-4 rounded-lg" />
                  <Skeleton className="h-5 w-full mb-2 rounded-lg" />
                  <Skeleton className="h-5 w-2/3 rounded-lg" />
                </div>
                <Skeleton className="h-64 w-full rounded-2xl mb-8" />
                <Skeleton className="h-32 w-full rounded-2xl" />
              </div>
            </div>
          ) : concours ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="grid grid-cols-1 lg:grid-cols-3 gap-8"
            >
              {/* Sidebar - Informations importantes */}
              <div className="lg:col-span-1">
                <div className="bg-white rounded-2xl shadow-lg p-6 lg:p-8 sticky top-6">
                  {/* Statut */}
                  {statusInfo && (
                    <div className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-semibold mb-6 ${statusInfo.color}`}>
                      <Clock className="h-4 w-4 mr-2" />
                      {statusInfo.label}
                    </div>
                  )}

                  {/* Dates importantes */}
                  <div className="space-y-4 mb-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Dates importantes</h3>
                    
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                        <Calendar className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Date début de Concours </p>
                        <p className="font-semibold text-gray-900">{formattedOpenDate}</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                        <Clock className="h-5 w-5 text-red-600" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Clôture des inscriptions</p>
                        <p className="font-semibold text-gray-900">{formattedLimitDate}</p>
                      </div>
                    </div>
                  </div>

                  {/* Informations complémentaires */}
                  <div className="space-y-4 mb-8">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Informations</h3>
                    
                    <div className="flex items-center gap-3">
                      <MapPin className="h-5 w-5 text-gray-400" />
                      <div>
                        <p className="text-sm text-gray-600">Pays</p>
                        <p className="font-medium text-gray-900">{concours.pays}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <GraduationCap className="h-5 w-5 text-gray-400" />
                      <div>
                        <p className="text-sm text-gray-600">Niveau</p>
                        <Badge variant="secondary" className="mt-1">
                          {concours.niveau}
                        </Badge>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <Target className="h-5 w-5 text-gray-400" />
                      <div>
                        <p className="text-sm text-gray-600">Statut</p>
                        <Badge 
                          variant={concours.status === 'NATIONAL' ? 'default' : 'outline'} 
                          className="mt-1"
                        >
                          {concours.status}
                        </Badge>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="space-y-3">
                    {concours.lienOfficiel && (
                      <Button 
                        className="w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold py-3 rounded-xl transition-all hover:scale-[1.02] active:scale-[0.98]"
                        onClick={() => window.open(concours.lienOfficiel, '_blank')}
                      >
                        <Globe className="mr-2 h-5 w-5" />
                        Site officiel
                        <ExternalLink className="ml-2 h-4 w-4" />
                      </Button>
                    )}

                    {concours.filePath && (
                      <>
                        <Button 
                          variant="outline"
                          className="w-full border-2 border-blue-200 text-blue-700 hover:bg-blue-50 font-semibold py-3 rounded-xl transition-all hover:scale-[1.02] active:scale-[0.98]"
                          onClick={handleOpenFile}
                        >
                          <FileText className="mr-2 h-5 w-5" />
                          Voir le document
                        </Button>

                        <Button 
                          variant="outline"
                          className="w-full border-2 border-green-200 text-green-700 hover:bg-green-50 font-semibold py-3 rounded-xl transition-all hover:scale-[1.02] active:scale-[0.98]"
                          onClick={handleDownloadFile}
                        >
                          <Download className="mr-2 h-5 w-5" />
                          Télécharger
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Main Content */}
              <div className="lg:col-span-2">
                {/* En-tête */}
                <div className="bg-white rounded-2xl shadow-lg p-6 lg:p-8 mb-8">
                  <div className="flex flex-wrap items-center gap-3 mb-4">
                    {statusInfo && (
                      <Badge className={`text-sm ${statusInfo.color}`}>
                        {statusInfo.label}
                      </Badge>
                    )}
                    <Badge variant="outline" className="text-sm">
                      {concours.niveau}
                    </Badge>
                    <Badge 
                      variant={concours.status === 'NATIONAL' ? 'default' : 'outline'} 
                      className="text-sm"
                    >
                      {concours.status}
                    </Badge>
                  </div>

                  <h1 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
                    {concours.nom}
                  </h1>

                  <p className="text-xl text-gray-600 leading-relaxed">
                    {concours.description}
                  </p>
                </div>

                {/* Détails supplémentaires */}
                <div className="bg-white rounded-2xl shadow-lg p-6 lg:p-8">
                  <h2 className="text-2xl font-bold text-gray-900 mb-6">Détails du concours</h2>
                  
                  <div className="prose prose-lg max-w-none text-gray-700">
                    <p className="mb-6">
                      Ce concours {concours.status === 'NATIONAL' ? 'national' : 'international'} 
                      s'adresse aux étudiants de niveau <strong>{concours.niveau.toLowerCase()}</strong> 
                      et se déroule en <strong>{concours.pays}</strong>.
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                      <div className="bg-gray-50 rounded-xl p-4">
                        <h3 className="font-semibold text-gray-900 mb-2">Période d'inscription</h3>
                        <p className="text-gray-600">
                          Du <strong>{formattedOpenDate}</strong> au{' '}
                          <strong>{formattedLimitDate}</strong>
                        </p>
                      </div>

                      <div className="bg-gray-50 rounded-xl p-4">
                        <h3 className="font-semibold text-gray-900 mb-2">Localisation</h3>
                        <p className="text-gray-600">
                          <strong>{concours.pays}</strong> - {concours.status}
                        </p>
                      </div>
                    </div>

                    <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
                      <h3 className="font-semibold text-blue-900 mb-3">Comment postuler ?</h3>
                      <ul className="space-y-2 text-blue-800">
                        <li>• Consultez le site officiel pour connaître les modalités exactes</li>
                        <li>• Préparez les documents requis à l'avance</li>
                        <li>• Respectez scrupuleusement la date limite d'inscription</li>
                        {concours.filePath && (
                          <li>• Téléchargez la documentation complète pour plus de détails</li>
                        )}
                      </ul>
                    </div>
                  </div>
                </div>

                {/* Alertes importantes */}
                <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-6 mt-8">
                  <h3 className="font-semibold text-yellow-900 mb-2">⚠️ Important</h3>
                  <p className="text-yellow-800">
                    Les informations présentées sur cette page sont fournies à titre indicatif. 
                    Nous vous recommandons de toujours vérifier les informations directement 
                    sur le <strong>site officiel du concours</strong> pour vous assurer de 
                    leur exactitude et connaître les dernières mises à jour.
                  </p>
                </div>
              </div>
            </motion.div>
          ) : null}
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default ConcoursDetail;