import React from 'react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EtablissementResponse } from '@/service/etablissementService';

// interface FiliereCardProps {
//   id?: string;
//   title: string;
//   level: string;
//   description: string;
//   subjects?: string[];
//   careers?: string[];
//   onViewDetails?: () => void;
// }

// id:number; 
//     nom : string; 
//     : string; 
//      : string; 
//     : string; 
//      : string; 

const FiliereCard = ({ id, nom,  typeEtablissement,lieu, urlDetailEtablissement, urlLogo}: EtablissementResponse) => {
  return (
    <Card className="h-full flex flex-col" key={id}>
      <CardHeader>
        <div>
          <img src={urlLogo} alt="" className='object-fill'/>
        </div>
        <CardTitle className="text-xl">{nom}</CardTitle>
        <Badge variant="outline" className="w-fit">{lieu}</Badge>
      </CardHeader>
      <CardContent className="flex-grow">
        <p className="text-sm text-gray-600 mb-4">{typeEtablissement}</p>
        {/* {subjects && subjects.length > 0 && (
          <div className="mb-4">
            <h4 className="font-medium text-sm mb-1">Matières principales:</h4>
            <div className="flex flex-wrap gap-1">
              {subjects.map((subject, index) => (
                <Badge key={index} variant="secondary" className="text-xs">{subject}</Badge>
              ))}
            </div>
          </div>
        )}
        {careers && careers.length > 0 && (
          <div>
            <h4 className="font-medium text-sm mb-1">Débouchés:</h4>
            <div className="flex flex-wrap gap-1">
              {careers.map((career, index) => (
                <Badge key={index} variant="outline" className="text-xs">{career}</Badge>
              ))}
            </div>
          </div>
        )} */}

      </CardContent>
      <CardFooter>
        <Button asChild variant="outline" className="w-full">
          <a href={urlDetailEtablissement}>Voir les détails</a>
        </Button>
      </CardFooter>
    </Card>
  );
};

export default FiliereCard;
