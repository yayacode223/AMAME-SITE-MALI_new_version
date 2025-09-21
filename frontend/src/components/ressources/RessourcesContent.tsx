
import React from 'react';
import { Skeleton } from "@/components/ui/skeleton";
import ResourceCard from '../ResourceCard';
import type { Resource } from '@/hooks/useRessources';

interface RessourcesContentProps {
  isLoading: boolean;
  filteredResources: Resource[];
}

const RessourcesContent = ({ isLoading, filteredResources }: RessourcesContentProps) => {
  return (
    <section className="py-8 px-4">
      <div className="container mx-auto">
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, index) => (
              <div key={index} className="border rounded-lg bg-white shadow-sm overflow-hidden">
                <div className="p-6">
                  <div className="flex justify-between items-center mb-4">
                    <Skeleton className="h-6 w-6" />
                    <Skeleton className="h-5 w-20" />
                  </div>
                  <Skeleton className="h-6 w-3/4 mb-2" />
                  <Skeleton className="h-4 w-1/3 mb-4" />
                  <Skeleton className="h-20 w-full mb-4" />
                  <Skeleton className="h-4 w-1/4" />
                </div>
                <div className="px-6 pb-6">
                  <Skeleton className="h-10 w-full mb-2" />
                  <Skeleton className="h-10 w-full" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredResources.map((resource, index) => (
              <ResourceCard 
                key={resource.id || String(index)}
                id={resource.id}
                title={resource.titre || resource.title || ''}
                type={resource.type}
                description={resource.description}
                fileSize={resource.file_size || resource.fileSize}
                category={resource.category}
              />
            ))}
          </div>
        )}

        {filteredResources.length === 0 && !isLoading && (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">
              Aucune ressource ne correspond à votre recherche.
            </p>
          </div>
        )}
      </div>
    </section>
  );
};

export default RessourcesContent;
