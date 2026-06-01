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
                <div key={i} className="bg-white rounded-xl border border-amame-border p-6 flex items-center gap-4">
                  <Skeleton className="h-16 w-16 rounded-xl shrink-0" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-5 w-2/3 rounded-md" />
                    <Skeleton className="h-4 w-1/3 rounded-full" />
                    <Skeleton className="h-4 w-full rounded-md" />
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
                        <div className="bg-white rounded-xl border border-amame-border shadow-card hover:shadow-card-hover hover:-translate-y-1 transition-all duration-300 p-5 flex flex-col h-full group">
                          {/* Logo + nom */}
                          <div className="flex items-start gap-4 mb-4">
                            <div className="w-14 h-14 rounded-xl bg-gray-50 border border-amame-border flex items-center justify-center overflow-hidden shrink-0">
                              {partenaire.filePath ? (
                                <img
                                  src={`${PROD_URL}/${partenaire.filePath}`}
                                  alt={partenaire.nom}
                                  className="w-full h-full object-contain"
                                  loading="lazy"
                                  onError={e => { e.currentTarget.style.display = "none"; }}
                                />
                              ) : (
                                <Globe className="h-6 w-6 text-amame-muted" />
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <h3 className="font-nunito font-bold text-sm text-amame-charcoal group-hover:text-amame-green transition-colors truncate">
                                {partenaire.nom}
                              </h3>
                              <span className="text-xs text-amame-muted bg-gray-50 border border-amame-border px-2 py-0.5 rounded-full mt-1 inline-block">
                                {partenaire.type || "Partenaire"}
                              </span>
                            </div>
                          </div>

                          {partenaire.description && (
                            <p className="text-xs text-amame-muted leading-relaxed line-clamp-3 flex-grow mb-4">
                              {partenaire.description}
                            </p>
                          )}

                          {partenaire.siteWeb && (
                            <a
                              href={partenaire.siteWeb}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="mt-auto inline-flex items-center gap-1.5 text-xs font-semibold text-amame-green hover:text-amame-green-dark transition-colors pt-3 border-t border-amame-border"
                            >
                              Visiter le site
                              <ExternalLink className="h-3.5 w-3.5" />
                            </a>
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
