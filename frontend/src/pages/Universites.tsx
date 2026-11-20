import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { Building2, Search, MapPin, ExternalLink, GraduationCap } from "lucide-react";
import SEO from "../components/SEO";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import PageHero from "../components/PageHero";
import { Input } from "@/components/ui/input";
import CardSkeleton from "@/components/CardSkeleton";
import QueryError from "@/components/QueryError";
import { useGetEtablissement } from "@/service/etablissementService";


const Universites = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedType, setSelectedType] = useState("all");

  const { data: etablissements, isLoading, isLoadingError, error, refetch, isFetching } = useGetEtablissement();

  const types = useMemo(() => {
    if (!etablissements) return [];
    const set = new Set((etablissements.content || []).map(e => e.typeEtablissement).filter(Boolean));
    return Array.from(set);
  }, [etablissements]);

  const filtered = useMemo(() => {
    if (!etablissements) return [];
    let list = etablissements.content || [];
    if (selectedType !== "all") {
      list = list.filter(e => e.typeEtablissement === selectedType);
    }
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      list = list.filter(e =>
        e.nom.toLowerCase().includes(term) ||
        e.lieu?.toLowerCase().includes(term) ||
        e.typeEtablissement?.toLowerCase().includes(term)
      );
    }
    return list;
  }, [etablissements, selectedType, searchTerm]);

  return (
    <div className="min-h-screen bg-amame-surface flex flex-col">
      <SEO
        title="Universités et Établissements"
        description="Découvrez les universités et établissements d'enseignement supérieur accessibles aux étudiants maliens. Guide complet pour choisir votre établissement avec l'AMAME."
        path="/orientation/universites"
        keywords="universités Mali, établissements supérieurs Mali, choisir université Mali, AMAME universités"
      />
      <Navbar />
      <PageHero
        icon={Building2}
        label="Orientation"
        title="Universités &"
        titleHighlight="Établissements"
        description="" //Explorez les universités et établissements d'enseignement supérieur disponibles pour les étudiants maliens.
        image="heroes/hero-universites"
        imageAlt="Universités et établissements supérieurs"
      />

      {/* Filtres */}
      <section className="bg-white border-b border-amame-border py-5">
        <div className="page-container">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center"
          >
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-amame-muted pointer-events-none" />
              <Input
                type="text"
                placeholder="Rechercher un établissement..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="pl-10 h-11 border-amame-border focus:border-amame-green rounded-xl"
              />
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setSelectedType("all")}
                className={`px-3 py-2 rounded-lg text-xs font-medium border transition-all ${selectedType === "all" ? "bg-amame-green text-white border-amame-green" : "bg-white text-amame-slate border-amame-border hover:border-amame-green hover:text-amame-green"}`}
              >
                Tous
              </button>
              {types.map(type => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setSelectedType(type)}
                  className={`px-3 py-2 rounded-lg text-xs font-medium border transition-all ${selectedType === type ? "bg-amame-green text-white border-amame-green" : "bg-white text-amame-slate border-amame-border hover:border-amame-green hover:text-amame-green"}`}
                >
                  {type}
                </button>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Contenu */}
      <section className="flex-grow py-8 lg:py-12">
        <div className="page-container">
          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 lg:gap-6">
              {[...Array(9)].map((_, i) => <CardSkeleton key={i} media="logo" lines={1} />)}
            </div>
          ) : isLoadingError ? (
            <QueryError error={error} onRetry={refetch} isRetrying={isFetching} title="Les établissements n'ont pas pu être chargés." />
          ) : filtered.length === 0 ? (
            <div className="text-center py-20">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-amame-green-subtle rounded-2xl mb-5">
                <GraduationCap className="h-8 w-8 text-amame-green" />
              </div>
              <h3 className="font-nunito font-bold text-xl text-amame-charcoal mb-2">Aucun établissement trouvé</h3>
              <p className="text-amame-muted text-sm">Essayez de modifier votre recherche.</p>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="font-nunito font-bold text-lg text-amame-charcoal">Établissements</h2>
                  <p className="text-sm text-amame-muted">{filtered.length} établissement{filtered.length > 1 ? "s" : ""}</p>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 lg:gap-6">
                {filtered.map((etab, index) => (
                  <motion.div
                    key={etab.id}
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: index * 0.04 }}
                  >
                    {/* Carte .amame-card (index.css). Elle n'est pas un lien : pas de soulèvement au
                        survol ; seul le lien du pied réagit. */}
                    <div className="amame-card">
                      {/* Média — logo (object-contain pour ne jamais rogner le logo) */}
                      <div className="amame-card-media amame-card-media-logo">
                        {etab.urlLogo ? (
                          <img
                            src={etab.urlLogo}
                            alt={etab.nom}
                            className="max-h-full max-w-full object-contain"
                            loading="lazy"
                            onError={e => { e.currentTarget.style.display = "none"; }}
                          />
                        ) : (
                          <Building2 className="h-12 w-12 text-amame-green/30" />
                        )}
                        {etab.typeEtablissement && (
                          <span className="absolute top-3 right-3 text-xs bg-white/90 backdrop-blur-sm text-amame-green-dark border border-amame-green/15 px-2.5 py-1 rounded-full font-medium shadow-sm">
                            {etab.typeEtablissement}
                          </span>
                        )}
                      </div>

                      {/* Corps — nom + lieu */}
                      <div className="amame-card-body">
                        <h3 className="amame-card-title">{etab.nom}</h3>
                        {etab.lieu && (
                          <div className="flex items-center gap-2 text-sm text-amame-muted mt-2">
                            <MapPin className="h-3.5 w-3.5 text-amame-green shrink-0" />
                            <span className="line-clamp-1">{etab.lieu}</span>
                          </div>
                        )}
                      </div>

                      {/* Pied — lien vers la fiche de l'établissement (si présent) */}
                      {etab.urlDetailEtablissement && (
                        <div className="amame-card-footer justify-end">
                          <a
                            href={etab.urlDetailEtablissement}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="amame-card-action text-amame-green-dark hover:gap-1.5 hover:underline"
                          >
                            Voir le détail
                            <ExternalLink className="h-3.5 w-3.5" />
                          </a>
                        </div>
                      )}
                    </div>
                  </motion.div>
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

export default Universites;
