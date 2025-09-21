
import React from 'react';
import { Button } from "@/components/ui/button";
import { Link } from 'react-router-dom';

const Hero = () => {
  return (
    <div className="bg-gradient-to-r from-amame-blue to-blue-900 text-white py-16 md:py-20 lg:py-24">
      <div className="container mx-auto px-4 flex flex-col lg:flex-row items-center">
        <div className="lg:w-1/2 lg:pr-12 mb-10 lg:mb-0">
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-6">
            Association Malienne d'Appui aux Meilleurs Élèves
          </h1>
          <p className="text-lg md:text-xl opacity-90 mb-8">
            Accompagner les élèves et étudiants maliens vers l'excellence académique à travers l'information, l'orientation et le soutien éducatif.
          </p>
          <div className="flex flex-wrap gap-4">
            <Button size="lg" className="bg-amame-green hover:bg-amame-green/90 text-white">
              <Link to="/concours">Découvrir les Concours</Link>
            </Button>
            <Button size="lg" variant="outline" className="bg-white text-amame-blue hover:bg-white/90">
              <Link to="/bourses">Explorer les Bourses</Link>
            </Button>
          </div>
        </div>
        <div className="lg:w-1/2 flex justify-center">
          <div className="relative">
            <div className="absolute inset-0 bg-amame-orange rounded-full blur-3xl opacity-20"></div>
            <img 
              src="/lovable-uploads/24ceb186-cbc8-4d01-99bd-635d9bd2df31.png" 
              alt="AMAME Logo" 
              className="relative z-10 w-72 h-72 object-contain"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Hero;
