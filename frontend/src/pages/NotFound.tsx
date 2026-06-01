import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import { ArrowLeft, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <>
      <Navbar />
      <div className="min-h-[70vh] flex items-center justify-center bg-amame-surface px-4">
        <div className="text-center max-w-md">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-amame-green-subtle rounded-2xl mb-6 mx-auto">
            <Search className="h-10 w-10 text-amame-green" />
          </div>
          <h1 className="font-nunito font-black text-6xl text-amame-charcoal mb-3">404</h1>
          <h2 className="font-nunito font-bold text-xl text-amame-charcoal mb-3">Page non trouvée</h2>
          <p className="text-amame-muted mb-8 leading-relaxed">
            La page que vous recherchez n'existe pas ou a été déplacée.
          </p>
          <Button asChild className="bg-amame-green hover:bg-amame-green-dark text-white font-semibold rounded-xl gap-2">
            <Link to="/"><ArrowLeft className="h-4 w-4" />Retour à l'accueil</Link>
          </Button>
        </div>
      </div>
      <Footer />
    </>
  );
};

export default NotFound;
