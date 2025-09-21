
import React from 'react';

interface FilieresHeroProps {
  title: string;
  description: string;
}

const FilieresHero = ({ title, description }: FilieresHeroProps) => {
  return (
    <section className="bg-amame-green text-white py-12 px-4">
      <div className="container mx-auto">
        <h1 className="text-3xl md:text-4xl font-bold mb-4">{title}</h1>
        <p className="text-xl opacity-90 max-w-3xl">
          {description}
        </p>
      </div>
    </section>
  );
};

export default FilieresHero;
