import { useParams, Link } from 'react-router-dom';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
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
  Briefcase
} from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import {useGetFiliereById} from '../service/orientationService';
import {DifficulteType} from '@/types/orientationType';

export function OrientationDetail() {
  const { id } = useParams();
  //Recuperer la filiere par id
  const { data: filiereData, isLoading } = useGetFiliereById(Number(id));
  

  if (!filiereData && !isLoading) {
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

  if(isLoading){
    return <div>Chargement en cours ...</div>;
  }

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-blue-50">
        {/* Header */}
        <section className="bg-white border-b">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <Button variant="ghost" asChild className="mb-6">
              <Link to="/orientation">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Retour à l'orientation
              </Link>
            </Button>
            
            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between">
              <div className="flex items-center mb-4 lg:mb-0">
                <div className="text-5xl mr-4">{filiereData.icone}</div>
                <div>
                  <h1 className="text-3xl md:text-4xl font-bold text-gray-900">
                    {filiereData.nom}
                  </h1>
                  <p className="text-xl text-gray-600 mt-2">
                    {filiereData.descriptionLongue.slice(0, 150)}...
                  </p>
                </div>
              </div>
              
              <Badge className={`text-lg px-4 py-2 ${
                filiereData.difficulte === DifficulteType.TRES_ELEVEE ? 'bg-red-100 text-red-800' :
                filiereData.difficulte === DifficulteType.ELEVEE ? 'bg-orange-100 text-orange-800' :
                'bg-green-100 text-green-800'
              }`}>
                Difficulté : {filiereData.difficulte === DifficulteType.TRES_ELEVEE ? 'Très élevée' :
                filiereData.difficulte === DifficulteType.ELEVEE ? 'Élevée' :
                'Moyenne'}
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
                <Card className="p-6">
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
                      <span className="font-semibold">{filiereData.dureeEtudes}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600 flex items-center">
                        <TrendingUp className="mr-2 h-4 w-4" />
                        Demande
                      </span>
                      <span className="font-semibold">{filiereData.demande}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600 flex items-center">
                        <DollarSign className="mr-2 h-4 w-4" />
                        Taux d'emploi
                      </span>
                      <span className="font-semibold text-green-600">{filiereData.tauxEmploi}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600 flex items-center">
                        <Users className="mr-2 h-4 w-4" />
                        Salaire début
                      </span>
                      <span className="font-semibold">{filiereData.salaireDebut}</span>
                    </div>
                  </div>
                </Card>

                {/* Universities */}
                <Card className="p-6">
                  <h3 className="font-bold text-lg text-gray-900 mb-4 flex items-center">
                    <MapPin className="mr-2 h-5 w-5 text-blue-600" />
                    Établissements Recommandés
                  </h3>
                  <ul className="space-y-2">
                    {filiereData.universites.map((universite, index) => (
                      <li key={index} className="flex items-center text-gray-700">
                        <Star className="mr-2 h-4 w-4 text-yellow-500" />
                        {universite}
                      </li>
                    ))}
                  </ul>
                </Card>

                {/* Prerequisites */}
                <Card className="p-6">
                  <h3 className="font-bold text-lg text-gray-900 mb-4 flex items-center">
                    <BookOpen className="mr-2 h-5 w-5 text-green-600" />
                    Prérequis
                  </h3>
                  <ul className="space-y-2">
                    {filiereData.prerequis.map((prerequis, index) => (
                      <li key={index} className="flex items-center text-gray-700">
                        <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
                        {prerequis}
                      </li>
                    ))}
                  </ul>
                </Card>
              </div>

              {/* Main Content */}
              <div className="lg:col-span-2 space-y-8">
                {/* Description */}
                <Card className="p-6">
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">
                    Description de la Filière
                  </h2>
                  <p className="text-gray-700 leading-relaxed">
                    {filiereData.descriptionLongue}
                  </p>
                </Card>

                {/* Career Opportunities */}
                <Card className="p-6">
                  <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
                    <Briefcase className="mr-2 h-6 w-6 text-purple-600" />
                    Débouchés Professionnels
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {filiereData.debouches.map((debouche, index) => (
                      <div key={index} className="flex items-center p-3 bg-gray-50 rounded-lg">
                        <div className="w-3 h-3 bg-purple-500 rounded-full mr-3"></div>
                        <span className="font-medium text-gray-800">{debouche}</span>
                      </div>
                    ))}
                  </div>
                </Card>

                {/* Skills & Competencies */}
                <Card className="p-6">
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">
                    Compétences Développées
                  </h2>
                  <div className="flex flex-wrap gap-3">
                    {filiereData.competences.map((competence, index) => (
                      <Badge key={index} variant="secondary" className="text-sm py-2 px-4">
                        {competence}
                      </Badge>
                    ))}
                  </div>
                </Card>

                {/* Salary & Prospects */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card className="p-6">
                    <h3 className="font-bold text-lg text-gray-900 mb-4">
                      Évolution de Carrière
                    </h3>
                    <div className="space-y-4">
                      <div>
                        <p className="text-gray-600 text-sm">Début de carrière</p>
                        <p className="font-semibold text-lg">{filiereData.salaireDebut}</p>
                      </div>
                      <div>
                        <p className="text-gray-600 text-sm">Avec expérience</p>
                        <p className="font-semibold text-lg text-green-600">{filiereData.salaireExperience}</p>
                      </div>
                    </div>
                  </Card>

                  <Card className="p-6">
                    <h3 className="font-bold text-lg text-gray-900 mb-4">
                      Perspectives
                    </h3>
                    <p className="text-gray-700 text-sm leading-relaxed">
                      {filiereData.perspectives}
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