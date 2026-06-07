import { Users, Mail } from "lucide-react";
import SEO from "../components/SEO";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import PageHero from "../components/PageHero";
import { Skeleton } from "@/components/ui/skeleton";
import { motion } from "framer-motion";
import { useGetMembres } from "@/service/membreService";

const PROD_URL = "https://amame.ml";

const MembreCard = ({ membre, index }: { membre: any; index: number }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.5, delay: index * 0.07 }}
  >
    <div className="bg-white rounded-2xl border border-amame-border shadow-card hover:shadow-card-hover hover:-translate-y-1 transition-all duration-300 overflow-hidden flex flex-col h-full group">
      {/* Header — photo pleine largeur */}
      <div className="relative w-full h-52 overflow-hidden bg-amame-green-subtle">
        {membre.filePath ? (
          <img
            src={`${PROD_URL}/${membre.filePath}`}
            alt={`${membre.prenom} ${membre.nom}`}
            className="w-full h-full object-cover object-center transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
            onError={e => { e.currentTarget.style.display = "none"; }}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-amame-green-subtle to-amame-green/10">
            <span className="font-nunito font-black text-4xl text-amame-green/70">
              {membre.prenom?.[0]}{membre.nom?.[0]}
            </span>
          </div>
        )}
      </div>

      {/* Body — nom + poste + bio */}
      <div className="flex flex-col flex-grow p-5 text-center">
        <h3 className="font-nunito font-bold text-base text-amame-charcoal mb-0.5">
          {membre.prenom} {membre.nom}
        </h3>
        <p className="text-sm font-medium text-amame-green mb-3">{membre.poste}</p>
        {membre.bio && (
          <p className="text-xs text-amame-muted leading-relaxed line-clamp-3">
            {membre.bio}
          </p>
        )}
      </div>

      {/* Footer — email (si présent) */}
      {membre.email && (
        <div className="px-5 pb-5 pt-3 mt-auto border-t border-amame-border">
          <a
            href={`mailto:${membre.email}`}
            className="inline-flex w-full items-center justify-center gap-1.5 text-xs text-amame-muted hover:text-amame-green transition-colors"
          >
            <Mail className="h-3.5 w-3.5 shrink-0" />
            <span className="truncate">{membre.email}</span>
          </a>
        </div>
      )}
    </div>
  </motion.div>
);

const Membres = () => {
  const { data: membres, isLoading } = useGetMembres();

  return (
    <div className="min-h-screen bg-amame-surface flex flex-col">
      <SEO
        title="Nos Membres"
        description="Rencontrez les membres bénévoles de l'AMAME qui s'engagent chaque jour pour accompagner les étudiants maliens vers l'excellence académique."
        path="/a-propos/membres"
      />
      <Navbar />
      <PageHero
        icon={Users}
        label="À Propos"
        title="Nos"
        titleHighlight="Membres"
        description="" //Découvrez les membres bénévoles qui font vivre l'AMAME et qui s'engagent chaque jour pour accompagner les étudiants maliens vers l'excellence.
        imageSrc="/images/heroes/hero-membres.png"
        imageAlt="Équipe bénévole AMAME"
      />

      <section className="flex-grow py-8 lg:py-12">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="bg-white rounded-2xl border border-amame-border overflow-hidden">
                  <Skeleton className="h-52 w-full rounded-none" />
                  <div className="p-5 space-y-2 text-center">
                    <Skeleton className="h-5 w-3/4 mx-auto rounded-md" />
                    <Skeleton className="h-4 w-1/2 mx-auto rounded-md" />
                    <Skeleton className="h-10 w-full rounded-md mt-2" />
                  </div>
                </div>
              ))}
            </div>
          ) : !membres || membres.length === 0 ? (
            <div className="text-center py-20">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-amame-green-subtle rounded-2xl mb-5">
                <Users className="h-8 w-8 text-amame-green" />
              </div>
              <h3 className="font-nunito font-bold text-xl text-amame-charcoal mb-2">Aucun membre affiché</h3>
              <p className="text-amame-muted text-sm">
                La liste des membres sera bientôt disponible.
              </p>
            </div>
          ) : (
            <>
              <div className="mb-8 text-center">
                <span className="section-label">L'équipe AMAME</span>
                <h2 className="font-nunito font-black text-2xl sm:text-3xl text-amame-charcoal">
                  {membres.length} membre{membres.length > 1 ? "s" : ""} actif{membres.length > 1 ? "s" : ""}
                </h2>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                {membres.map((membre, index) => (
                  <MembreCard key={membre.id} membre={membre} index={index} />
                ))}
              </div>
            </>
          )}
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Membres;
