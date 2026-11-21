import { Handshake, ExternalLink, Globe } from "lucide-react";
import SEO from "../components/SEO";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import PageHero from "../components/PageHero";
import CardSkeleton from "@/components/CardSkeleton";
import QueryError from "@/components/QueryError";
import { motion } from "framer-motion";
import { useGetPartenaires } from "@/service/partenaireService";
import MediaImage from "@/components/MediaImage";

const Partenaires = () => {
  const { data: partenaires, isLoading, isLoadingError, error, refetch, isFetching } = useGetPartenaires();

  const byType = (partenaires ?? []).reduce<Record<string, typeof partenaires>>((acc, p) => {
    const type = p.type || "Partenaire";
    if (!acc[type]) acc[type] = [];
    acc[type]!.push(p);
    return acc;
  }, {});

  return (
    <div className="min-h-screen bg-amame-surface flex flex-col">
      <SEO
        title="Partenaires & Collaborateurs"
        description="Découvrez les partenaires et collaborateurs qui soutiennent la mission de l'AMAME pour accompagner les étudiants maliens vers l'excellence."
        path="/a-propos/partenaires"
      />
      <Navbar />
      <PageHero
        icon={Handshake}
        label="À Propos"
        title="Partenaires &"
        titleHighlight="Collaborateurs"
        description="" //Ils nous font confiance et soutiennent la mission de l'AMAME. Découvrez nos partenaires institutionnels et collaborateurs.
        image="heroes/hero-partenaires"
        imageAlt="Partenaires et collaborateurs AMAME"
      />

      <section className="flex-grow py-8 lg:py-12">
        <div className="page-container">
          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 lg:gap-6">
              {[...Array(6)].map((_, i) => <CardSkeleton key={i} media="wide" lines={2} />)}
            </div>
          ) : isLoadingError ? (
            <QueryError error={error} onRetry={refetch} isRetrying={isFetching} title="Les partenaires n'ont pas pu être chargés." />
          ) : !partenaires || partenaires.length === 0 ? (
            <div className="text-center py-20">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-amame-green-subtle rounded-2xl mb-5">
                <Globe className="h-8 w-8 text-amame-green" />
              </div>
              <h3 className="font-nunito font-bold text-xl text-amame-charcoal mb-2">Aucun partenaire affiché</h3>
              <p className="text-amame-muted text-sm">
                La liste des partenaires sera bientôt disponible.
              </p>
            </div>
          ) : (
            <div className="space-y-12">
              {Object.entries(byType).map(([type, list]) => (
                <div key={type}>
                  <div className="mb-6">
                    <span className="section-label">{type}s</span>
                    <h2 className="font-nunito font-bold text-xl text-amame-charcoal">{type}s ({list!.length})</h2>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 lg:gap-6">
                    {list!.map((partenaire, index) => (
                      <motion.div
                        key={partenaire.id}
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4, delay: index * 0.06 }}
                      >
                        {/* Carte .amame-card (index.css). Elle n'est pas un lien : pas de soulèvement
                            au survol ; seul le lien du pied réagit. */}
                        <div className="amame-card">
                          {/* Média — image du partenaire en pleine largeur, qui remplit la zone 16:9, calée en haut
                              (.amame-card-media-wide, docs/06, R10) */}
                          <div className="amame-card-media amame-card-media-wide border-b border-amame-border">
                            {(partenaire.fileUrl ?? partenaire.filePath) ? (
                              <MediaImage
                                src={partenaire.fileUrl ?? partenaire.filePath}
                                maxWidth={640}
                                sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                                alt={partenaire.nom}
                                className="absolute inset-0 h-full w-full object-cover object-top"
                                onError={e => { e.currentTarget.style.display = "none"; }}
                              />
                            ) : (
                              <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-amame-green-subtle to-white">
                                <Globe className="h-12 w-12 text-amame-green/30" />
                              </div>
                            )}
                            {/* Pastille opaque : en blanc à 90 %, l'image dessous la faisait tomber à 4,4:1 (docs/06, R10) */}
                            <span className="absolute top-3 right-3 text-xs bg-white text-amame-green-dark border border-amame-green/15 px-2.5 py-1 rounded-full font-medium shadow-sm">
                              {partenaire.type || "Partenaire"}
                            </span>
                          </div>

                          {/* Corps — nom + description */}
                          <div className="amame-card-body">
                            <h3 className="amame-card-title">{partenaire.nom}</h3>
                            {partenaire.description && (
                              <p className="amame-card-text mt-2">{partenaire.description}</p>
                            )}
                          </div>

                          {/* Pied — site web (si présent) */}
                          {partenaire.siteWeb && (
                            <div className="amame-card-footer justify-end">
                              <a
                                href={partenaire.siteWeb}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="amame-card-action text-amame-green-dark hover:gap-1.5 hover:underline"
                              >
                                Visiter le site
                                <ExternalLink className="h-3.5 w-3.5" />
                              </a>
                            </div>
                          )}
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Partenaires;
