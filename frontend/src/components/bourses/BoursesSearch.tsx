
import React from 'react';
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface BoursesSearchProps {
  filter: string;
  setFilter: (filter: string) => void;
  searchTerm: string;
  setSearchTerm: (searchTerm: string) => void;
}

const BoursesSearch = ({ 
  filter, 
  setFilter, 
  searchTerm, 
  setSearchTerm 
}: BoursesSearchProps) => {
  return (
    <section className="bg-white py-8 px-4 border-b">
      <div className="container mx-auto">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="relative md:w-1/3">
            <input
              type="text"
              placeholder="Rechercher une bourse..."
              className="w-full px-4 py-2 border border-gray-300 rounded-md"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <svg
              className="absolute right-3 top-2.5 h-5 w-5 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </div>

          <div className="flex flex-col md:flex-row gap-4 items-center">
            <div className="w-full md:w-auto">
              <Select value={filter} onValueChange={setFilter}>
                <SelectTrigger className="w-full md:w-[200px]">
                  <SelectValue placeholder="Niveau d'études" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Tous">Tous les niveaux</SelectItem>
                  <SelectItem value="Licence">Licence</SelectItem>
                  <SelectItem value="Master">Master</SelectItem>
                  <SelectItem value="Doctorat">Doctorat</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button className="w-full md:w-auto bg-amame-green hover:bg-amame-green/90">
              Guide des bourses
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default BoursesSearch;
