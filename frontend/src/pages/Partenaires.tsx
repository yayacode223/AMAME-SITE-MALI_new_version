import { Handshake, ExternalLink, Globe } from "lucide-react";
import SEO from "../components/SEO";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import PageHero from "../components/PageHero";
import { Skeleton } from "@/components/ui/skeleton";
import { motion } from "framer-motion";
import { useGetPartenaires } from "@/service/partenaireService";

const PROD_URL = "https://amame.ml";

const Partenaires = () => {
  const { data: partenaires, isLoading } = useGetPartenaires();

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
        imageSrc="/images/heroes/hero-partenaires.png"
        imageAlt="Partenaires et collaborateurs AMAME"
      />

      <section className="flex-grow py-8 lg:py-12">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="bg-white rounded-2xl border border-amame-border overflow-hidden">
                  <Skeleton className="h-32 w-full rounded-none" />
                  <div className="p-5 space-y-3">
                    <Skeleton className="h-5 w-2/3 rounded-md" />
                    <Skeleton className="h-4 w-full rounded-md" />
                    <Skeleton className="h-9 w-full rounded-xl mt-2" />
                  </div>
                </div>
              ))}
            </div>
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
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                    {list!.map((partenaire, index) => (
                      <motion.div
                        key={partenaire.id}
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4, delay: index * 0.06 }}
                      >
                        <div className="bg-white rounded-2xl border border-amame-border shadow-card hover:shadow-card-hover hover:-translate-y-1 transition-all duration-300 overflow-hidden flex flex-col h-full group">
                          {/* Header — logo pleine largeur (object-contain pour ne jamais rogner le logo) */}
                          <div className="relative h-32 w-full flex items-center justify-center p-5 bg-gradient-to-br from-amame-green-subtle to-white border-b border-amame-border">
                            {partenaire.filePath ? (
                              <img
                                src={`${PROD_URL}/${partenaire.filePath}`}
                                alt={partenaire.nom}
                                className="max-h-full max-w-full object-contain transition-transform duration-500 group-hover:scale-105"
                                loading="lazy"
                                onError={e => { e.currentTarget.style.display = "none"; }}
                              />
                            ) : (
                              <Globe className="h-12 w-12 text-amame-green/30" />
                            )}
                            <span className="absolute top-3 right-3 text-xs bg-white/90 backdrop-blur-sm text-amame-green-dark border border-amame-green/15 px-2.5 py-1 rounded-full font-medium shadow-sm">
                              {partenaire.type || "Partenaire"}
                            </span>
                          </div>

                          {/* Body — nom + description */}
                          <div className="flex flex-col flex-grow p-5">
                            <h3 className="font-nunito font-bold text-base text-amame-charcoal group-hover:text-amame-green transition-colors line-clamp-2 leading-snug">
                              {partenaire.nom}
                            </h3>
                            {partenaire.description && (
                              <p className="text-xs text-amame-muted leading-relaxed line-clamp-3 mt-2">
                                {partenaire.description}
                              </p>
                            )}
                          </div>

                          {/* Footer — site web (si présent) */}
                          {partenaire.siteWeb && (
                            <div className="px-5 pb-5 mt-auto">
                              <a
                                href={partenaire.siteWeb}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex w-full items-center justify-center gap-2 h-10 rounded-xl text-sm font-semibold bg-amame-green-subtle text-amame-green-dark border border-amame-green/20 hover:bg-amame-green hover:text-white hover:border-amame-green transition-colors"
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
