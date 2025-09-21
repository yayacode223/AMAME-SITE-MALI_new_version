import BourseCard from "../BourseCard";
import { Skeleton } from "@/components/ui/skeleton";
import { BourseResponse } from "@/service/bourseService";

// interface Bourse {
//   id?: string;
//   titre?: string;
//   title?: string;
//   provider: string;
//   country: string;
//   level: string;
//   deadline: string;
//   description: string;
//   benefits?: string[];
// }

interface BoursesContentProps {
  isLoading: boolean;
  filteredBourses: BourseResponse[];
}

const BoursesContent = ({
  isLoading,
  filteredBourses,
}: BoursesContentProps) => {
  return (
    <section className="py-12 px-4">
      <div className="container mx-auto">
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, index) => (
              <div
                key={index}
                className="border rounded-lg bg-white shadow-sm overflow-hidden"
              >
                <div className="p-6">
                  <Skeleton className="h-6 w-3/4 mb-1" />
                  <Skeleton className="h-4 w-1/2 mb-4" />
                  <Skeleton className="h-4 w-2/3 mb-2" />
                  <Skeleton className="h-4 w-2/3 mb-2" />
                  <Skeleton className="h-4 w-2/3 mb-4" />
                  <Skeleton className="h-20 w-full" />
                </div>
                <div className="px-6 pb-6">
                  <Skeleton className="h-10 w-full" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.isArray(filteredBourses) &&
              filteredBourses.map((bourse, index) => (
                <BourseCard
                  key={bourse.id || index}
                  id={bourse.id}
                  titre={bourse.titre || ""}
                  // provider={bourse.titre}
                  // country={bourse.titre}
                  // level={bourse.titre}
                  // deadline={bourse.titre}
                  description_complete={
                    bourse.description_complete?.length > 100
                      ? bourse.description_complete.slice(0, 100) + "..."
                      : bourse.description_complete || ""
                  }
                  urlSource={bourse?.urlSource}
                  urlDrapeau={bourse?.urlDrapeau}
                  paysOffrant={
                    bourse?.paysOffrant ? bourse?.paysOffrant : "Non specifie"
                  }
                  // benefits={bourse.titre}
                />
              ))}
          </div>
        )}

        {filteredBourses.length === 0 && !isLoading && (
          <div className="text-center py-10">
            <h3 className="text-xl font-semibold text-gray-700">
              Aucune bourse ne correspond à votre recherche
            </h3>
            <p className="text-gray-500 mt-2">
              Veuillez essayer avec d'autres critères de recherche
            </p>
          </div>
        )}
      </div>
    </section>
  );
};

export default BoursesContent;
