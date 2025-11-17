import { useLocation } from "react-router-dom";
import { useEffect } from "react";

const Forbidden = () => {
  const location = useLocation();

  useEffect(() => {
    console.error(
      "403 Error: User attempted to access forbidden route:",
      location.pathname
    );
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-4">Accès Interdit</h1>
        <p className="text-xl text-gray-600 mb-4">Vous n'avez pas la permission d'accéder à cette page.</p>
        <a href="/" className="text-blue-500 hover:text-blue-700 underline">
          Retour à l'accueil
        </a>
      </div>
    </div>
  );
};

export default Forbidden;
