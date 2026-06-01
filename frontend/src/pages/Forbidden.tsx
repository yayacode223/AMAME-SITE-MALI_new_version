import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import { ArrowLeft, ShieldOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

const Forbidden = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("403 Error: User attempted to access forbidden route:", location.pathname);
  }, [location.pathname]);

  return (
    <>
      <Navbar />
      <div className="min-h-[70vh] flex items-center justify-center bg-amame-surface px-4">
        <div className="text-center max-w-md">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-red-50 rounded-2xl mb-6 mx-auto">
            <ShieldOff className="h-10 w-10 text-red-500" />
          </div>
          <h1 className="font-nunito font-black text-6xl text-amame-charcoal mb-3">403</h1>
          <h2 className="font-nunito font-bold text-xl text-amame-charcoal mb-3">Accès interdit</h2>
          <p className="text-amame-muted mb-8 leading-relaxed">
            Vous n'avez pas la permission d'accéder à cette page.
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

export default Forbidden;
