
import FiliereCard from '../FiliereCard';
import { useNavigate } from 'react-router-dom';
import { EtablissementResponse } from '@/service/etablissementService';
import { useGetEtablissement } from '@/service/etablissementService';

// interface FiliereData {
//   id?: string;
//   title?: string;
//   titre?: string;
//   level?: string;
//   niveau?: string;
//   description?: string;
//   subjects?: string[];
//   careers?: string[];
//   debouches?: string;
// }

interface FilieresTabContentProps {
  filieresData?: EtablissementResponse[] | [];
  fallbackData: EtablissementResponse[] | [];
}

const FilieresTabContent = ({ filieresData, fallbackData }: FilieresTabContentProps) => {
  // const navigate = useNavigate();

  // const handleViewDetails = (id?: string) => {
  //   if (id) {
  //     navigate(`/filieres/${id}`);
  //   } else {
  //     console.log("No ID available for this filière");
  //   }
  // };

  const { isLoading} = useGetEtablissement();
   
  if(isLoading) return (
    <div>Chargement en cours .....</div>
  )
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {filieresData && filieresData.length > 0 ? 
        filieresData.map((filiere: EtablissementResponse, index: number) => (
          <FiliereCard
            key={filiere.id || index}
            id={filiere.id}
            nom={filiere.nom  || ""}
            lieu={filiere.lieu  || ""}
            typeEtablissement={filiere.typeEtablissement || "Aucune Etablissement disponible."}
            urlDetailEtablissement={filiere.urlDetailEtablissement}
            urlLogo={filiere.urlLogo}
            // onViewDetails={() => handleViewDetails(filiere.id)}
          />
        )) : 
        fallbackData.map((filiere: EtablissementResponse, index: number) => (
          <FiliereCard
            key={index}
            id={filiere.id}
            nom={filiere.nom || ""}
            lieu={filiere.lieu || ""}
            typeEtablissement={filiere.typeEtablissement || ""}
            urlDetailEtablissement={filiere.urlDetailEtablissement}
            urlLogo={filiere.urlLogo}
            // subjects={filiere.subjects || []}
            // careers={filiere.careers || []}
            // onViewDetails={() => console.log("View details for fallback data")}
          />
        ))
      }
    </div>
  );
};

export default FilieresTabContent;
