import { Users, Mail } from "lucide-react";
import SEO from "../components/SEO";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import PageHero from "../components/PageHero";
import CardSkeleton from "@/components/CardSkeleton";
import QueryError from "@/components/QueryError";
import { motion } from "framer-motion";
import { useGetMembres } from "@/service/membreService";
import MediaImage from "@/components/MediaImage";

const MembreCard = ({ membre, index }: { membre: any; index: number }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.5, delay: index * 0.07 }}
  >
    {/* Carte .amame-card (index.css), zone média portrait. Elle n'est pas un lien : pas de
        soulèvement au survol ; seul le lien du pied réagit. */}
    <div className="amame-card">
      {/* Média — photo */}
      <div className="amame-card-media amame-card-media-portrait">
        {(membre.fileUrl ?? membre.filePath) ? (
          <MediaImage
            src={membre.fileUrl ?? membre.filePath}
            maxWidth={640}
            sizes="(min-width: 1280px) 25vw, (min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
            alt={`${membre.prenom} ${membre.nom}`}
            className="h-full w-full object-cover object-center"
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

      {/* Corps — nom + poste + bio */}
      <div className="amame-card-body text-center">
        <h3 className="amame-card-title">
          {membre.prenom} {membre.nom}
        </h3>
        <p className="text-sm font-medium text-amame-green-dark mt-0.5">{membre.poste}</p>
        {membre.bio && <p className="amame-card-text mt-3">{membre.bio}</p>}
      </div>

      {/* Pied — email (si présent) */}
      {membre.email && (
        <div className="amame-card-footer justify-center">
          <a
            href={`mailto:${membre.email}`}
            className="amame-card-action min-w-0 shrink font-medium text-amame-muted hover:text-amame-green-dark"
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
  const { data: membres, isLoading, isLoadingError, error, refetch, isFetching } = useGetMembres();

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
        image="heroes/hero-membres"
        imageAlt="Équipe bénévole AMAME"
      />

      <section className="flex-grow py-8 lg:py-12">
        <div className="page-container">
          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 lg:gap-6">
              {[...Array(8)].map((_, i) => <CardSkeleton key={i} media="portrait" lines={2} />)}
            </div>
          ) : isLoadingError ? (
            <QueryError error={error} onRetry={refetch} isRetrying={isFetching} title="Les membres du bureau n'ont pas pu être chargés." />
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
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 lg:gap-6">
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
