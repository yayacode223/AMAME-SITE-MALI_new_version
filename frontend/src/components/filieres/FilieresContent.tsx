import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import FilieresTabContent from './FilieresTabContent';
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import {EtablissementResponse} from "@/service/etablissementService"; 

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


interface FilieresContentProps {
  isLoading: boolean;
  etablissement : EtablissementResponse[] | [],
  filieres?: {
    secondary: EtablissementResponse[];
    superior: EtablissementResponse[];
  };

  secondaryFilieres: EtablissementResponse[];
  superiorFilieres: EtablissementResponse[];

}

const FilieresContent = ({
  isLoading,
  filieres,
  secondaryFilieres,
  superiorFilieres
}: FilieresContentProps) => {
  return (
    <section className="py-12 px-4">
      <div className="container mx-auto">
        <Tabs defaultValue="secondary" className="mb-8">
          <TabsList className="grid w-full max-w-md mx-auto grid-cols-2">
            <TabsTrigger value="secondary">Séries du Secondaire</TabsTrigger>
            <TabsTrigger value="superior">Filières Supérieures</TabsTrigger>
          </TabsList>
          <TabsContent value="secondary" className="mt-8">
            {isLoading ?(
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[...Array(4)].map((_, index) => (
                  <SkeletonCard key={index} />
                ))}
              </div>
            ) : (
              <FilieresTabContent 
                filieresData={filieres?.secondary} 
                fallbackData={secondaryFilieres} 
              />
            )}
          </TabsContent>
          <TabsContent value="superior" className="mt-8">
            {isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[...Array(6)].map((_, index) => (
                  <SkeletonCard key={index} />
                ))}
              </div>
            ) : (
              <FilieresTabContent 
                filieresData={filieres?.superior} 
                fallbackData={superiorFilieres} 
              />
            )}
          </TabsContent>
        </Tabs>
      </div>
    </section>
  );
};

const SkeletonCard = () => (
  <Card>
    <CardHeader>
      <Skeleton className="h-7 w-3/4 mb-2" />
      <Skeleton className="h-5 w-1/4" />
    </CardHeader>
    <CardContent>
      <Skeleton className="h-24 w-full mb-4" />
      <Skeleton className="h-4 w-full mb-2" />
      <Skeleton className="h-4 w-full mb-2" />
      <Skeleton className="h-4 w-3/4" />
    </CardContent>
  </Card>
);

export default FilieresContent;
