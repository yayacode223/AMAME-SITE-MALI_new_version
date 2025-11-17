import React from 'react';
import { BourseSummary } from '@/service/bourseService';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from '@/components/ui/button';
import { Calendar, MapPin, Building, GraduationCap, Tag } from "lucide-react";


// Composant pour une carte individuelle
const BourseCardItem = ({
  id,
  titre,
  descriptionCourte,
  bailleur,
  paysHote,
  niveau,
  categorie,
  financementStatut,
  organisation,
  dateLimite
}: BourseSummary) => {
  
  // Fonction pour formater la date
  const formatDate = (dateString?: string) => {
    if (!dateString) return "Non spécifiée";
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  // Couleur du badge selon le statut de financement
  const getFinancementColor = (statut?: string) => {
    switch (statut?.toLowerCase()) {
      case 'complet': return 'bg-green-100 text-green-800';
      case 'partiel': return 'bg-yellow-100 text-yellow-800';
      case 'limité': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Card className="h-full flex flex-col bg-white rounded-xl shadow-sm hover:shadow-md transition-all duration-300 border border-gray-100 overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start mb-2">
          <Badge 
            variant="secondary" 
            className={`${getFinancementColor(financementStatut)} text-xs font-medium`}
          >
            {financementStatut || 'Financement'}
          </Badge>
          {categorie && (
            <Badge variant="outline" className="text-xs">
              <Tag className="w-3 h-3 mr-1" />
              {categorie}
            </Badge>
          )}
        </div>
        
        <CardTitle className="text-lg font-bold leading-tight line-clamp-2 text-gray-900">
          {titre}
        </CardTitle>
      </CardHeader>

      <CardContent className="flex-grow pb-3">
        <p className="text-sm text-gray-600 mb-4 line-clamp-3 leading-relaxed">
          {descriptionCourte}
        </p>

        <div className="space-y-2">
          {paysHote && (
            <div className="flex items-center text-sm text-gray-700">
              <MapPin className="w-4 h-4 mr-2 text-blue-600" />
              <span>{paysHote}</span>
            </div>
          )}

          {bailleur && (
            <div className="flex items-center text-sm text-gray-700">
              <Building className="w-4 h-4 mr-2 text-purple-600" />
              <span className="line-clamp-1">{bailleur}</span>
            </div>
          )}

          {niveau && (
            <div className="flex items-center text-sm text-gray-700">
              <GraduationCap className="w-4 h-4 mr-2 text-green-600" />
              <span>{niveau}</span>
            </div>
          )}

          {organisation && (
            <div className="flex items-center text-sm text-gray-700">
              <Building className="w-4 h-4 mr-2 text-orange-600" />
              <span className="line-clamp-1">{organisation}</span>
            </div>
          )}

          {dateLimite && (
            <div className="flex items-center text-sm text-gray-700 mt-3 pt-2 border-t border-gray-100">
              <Calendar className="w-4 h-4 mr-2 text-red-600" />
              <span className="font-medium">Date limite : {formatDate(dateLimite)}</span>
            </div>
          )}
        </div>
      </CardContent>

      <CardFooter className="pt-3 border-t border-gray-100">
        <Button 
          variant="default" 
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 rounded-lg transition-colors duration-200"
          asChild
        >
          <a
            href={`/bourses/${id}`}
            className="w-full text-center flex items-center justify-center"
          >
            Voir les détails
            <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </a>
        </Button>
      </CardFooter>
    </Card>
  );
};

export default BourseCardItem;