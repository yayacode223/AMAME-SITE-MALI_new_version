import { useMemo } from "react";
import ExpandableText from "@/components/ExpandableText";
import { useParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import SEO from "../components/SEO";
import { ArrowLeft, Calendar, MapPin, GraduationCap, ExternalLink, Eye, Clock, Award } from "lucide-react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useGetBourseDetail } from "@/service/bourseService";

const FLAG_BASE = "/amame-uploads/bourses";
const flagMap: Record<string, string> = {
  "france":      "france.png",
  "canada":      "canada.png",
  "états-unis":  "etats-unis.png",
  "allemagne":   "allemagne.png",
  "royaume-uni": "angleterre.png",
  "angleterre":  "angleterre.png",
  "australie":   "australie.png",
  "suisse":      "suisse.png",
  "suède":       "suede.png",
};
const getFlagSrc = (pays?: string) => {
  if (!pays) return null;
  const file = flagMap[pays.toLowerCase()];
  return file ? `${FLAG_BASE}/${file}` : null;
};

const BoursesDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: bourse, isLoading, error } = useGetBourseDetail(Number(id));

  const formattedDate = useMemo(() => {
    if (!bourse?.dateLimite) return "Non spécifiée";
    return new Date(bourse.dateLimite).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });
  }, [bourse?.dateLimite]);

  const deadlineStatus = useMemo(() => {
    if (!bourse?.dateLimite) return "neutral";
    const diff = new Date(bourse.dateLimite).getTime() - Date.now();
    if (diff < 0) return "passed";
    if (diff < 30 * 24 * 60 * 60 * 1000) return "near";
    return "ok";
  }, [bourse?.dateLimite]);

  const deadlineConfig = {
    passed: { cls: "bg-red-50 border-red-200 text-red-800",                      label: "Date limite dépassée"       },
    near:   { cls: "bg-orange-50 border-orange-200 text-orange-800",              label: "Date limite proche"         },
    ok:     { cls: "bg-amame-green-subtle border-amame-green/20 text-amame-green-dark", label: "Date limite de candidature" },
    neutral:{ cls: "bg-gray-50 border-gray-200 text-gray-700",                    label: "Date limite"                },
  };
  const dc = deadlineConfig[deadlineStatus];

  if (error) {
    return (
      <div className="min-h-screen bg-amame-surface">
        <Navbar />
        <div className="container mx-auto px-4 py-24 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-red-50 rounded-2xl mb-5">
            <Award className="h-8 w-8 text-red-500" />
          </div>
          <h1 className="font-nunito font-bold text-2xl text-amame-charcoal mb-3">Bourse non trouvée</h1>
          <p className="text-amame-muted mb-8">La bourse que vous recherchez n'existe pas ou a été supprimée.</p>
          <Button onClick={() => navigate("/bourses")} className="bg-amame-green hover:bg-amame-green-dark text-white font-semibold rounded-xl gap-2">
            <ArrowLeft className="h-4 w-4" /> Retour aux bourses
          </Button>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-amame-surface flex flex-col">
      <Navbar />

      {/* Breadcrumb */}
      <div className="bg-white border-b border-amame-border">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <Button variant="ghost" onClick={() => navigate(-1)}
            className="text-amame-muted hover:text-amame-charcoal hover:bg-gray-100 rounded-lg gap-2 h-9 text-sm">
            <ArrowLeft className="h-4 w-4" /> Retour aux bourses
          </Button>
        </div>
      </div>

      <section className="flex-grow py-8 lg:py-12">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <AnimatePresence mode="wait">

            {/* ── Skeleton ── */}
            {isLoading ? (
              <motion.div key="skeleton" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="grid lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-5">
                  <div className="bg-white rounded-2xl border border-amame-border overflow-hidden">
                    <Skeleton className="h-48 w-full rounded-none" />
                    <div className="p-6 space-y-4">
                      <Skeleton className="h-7 w-3/4 rounded-lg" />
                      <Skeleton className="h-4 w-full rounded-md" />
                      <Skeleton className="h-4 w-2/3 rounded-md" />
                      <Skeleton className="h-14 w-full rounded-xl" />
                    </div>
                  </div>
                  <div className="bg-white rounded-2xl border border-amame-border p-6 space-y-3">
                    <Skeleton className="h-5 w-40 rounded-lg" />
                    <Skeleton className="h-24 w-full rounded-lg" />
                  </div>
                </div>
                <div className="space-y-5">
                  <Skeleton className="h-48 w-full rounded-2xl" />
                  <Skeleton className="h-36 w-full rounded-2xl" />
                </div>
              </motion.div>

            ) : bourse ? (
              <motion.div key="content" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
                className="grid lg:grid-cols-3 gap-8">

                <SEO
                  title={bourse.titre}
                  description={bourse.descriptionCourte || `Bourse d'études : ${bourse.titre}. Informations, critères d'éligibilité et procédures de candidature.`}
                  path={`/bourses/${id}`}
                  keywords={`bourse ${bourse.paysHote || "internationale"}, ${bourse.niveau || ""}, étudiants maliens`}
                />

                {/* ── Contenu principal ── */}
                <div className="lg:col-span-2 space-y-5">

                  {/* Carte header — drapeau pays hôte */}
                  <div className="bg-white rounded-2xl border border-amame-border shadow-card overflow-hidden">

                    {/* Image drapeau */}
                    <div className="relative h-48 overflow-hidden bg-gradient-to-br from-amame-gold-subtle to-amame-gold/10">
                      {getFlagSrc(bourse.paysHote) && (
                        <img
                          src={getFlagSrc(bourse.paysHote)!}
                          alt={bourse.paysHote ?? ""}
                          className="w-full h-full object-cover"
                        />
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/5 to-transparent" />

                      {/* Pills overlay */}
                      <div className="absolute bottom-4 left-5 flex flex-wrap gap-2">
                        {bourse.paysHote && (
                          <span className="flex items-center gap-1.5 bg-white/20 backdrop-blur-sm border border-white/30 text-white text-xs font-semibold px-3 py-1.5 rounded-full">
                            <MapPin className="h-3 w-3 shrink-0" />{bourse.paysHote}
                          </span>
                        )}
                        {bourse.niveau && (
                          <span className="flex items-center gap-1.5 bg-white/20 backdrop-blur-sm border border-white/30 text-white text-xs font-semibold px-3 py-1.5 rounded-full">
                            <GraduationCap className="h-3 w-3 shrink-0" />{bourse.niveau}
                          </span>
                        )}
                        {bourse.financementStatut && (
                          <span className="bg-amame-gold/85 text-white text-xs font-semibold px-3 py-1.5 rounded-full">
                            {bourse.financementStatut}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Titre + description courte + deadline */}
                    <div className="p-6 lg:p-7">
                      <h1 className="font-nunito font-black text-2xl lg:text-3xl text-amame-charcoal mb-3 leading-tight">
                        {bourse.titre}
                      </h1>
                      {bourse.descriptionCourte && (
                        <ExpandableText text={bourse.descriptionCourte} maxWords={50}
                          className="text-amame-slate leading-relaxed text-sm" />
                      )}
                      {bourse.dateLimite && (
                        <div className={`mt-5 flex items-center gap-3 px-4 py-3 rounded-xl border ${dc.cls}`}>
                          <Clock className="h-4 w-4 shrink-0" />
                          <div>
                            <p className="font-semibold text-sm">{dc.label}</p>
                            <p className="text-sm opacity-80">{formattedDate}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Description détaillée */}
                  <div className="bg-white rounded-2xl border border-amame-border shadow-card p-6 lg:p-7">
                    <h2 className="font-nunito font-bold text-base text-amame-charcoal mb-4">Description détaillée</h2>
                    {bourse.descriptionLongue ? (
                      <ExpandableText text={bourse.descriptionLongue} maxWords={50}
                        className="text-amame-slate leading-relaxed text-sm" />
                    ) : (
                      <p className="text-amame-muted italic text-sm">Aucune description détaillée disponible.</p>
                    )}
                  </div>

                  {/* Organisation — désactivée temporairement */}
                  {/* {(bourse.organisation || bourse.bailleur) && (
                    <div className="bg-white rounded-2xl border border-amame-border shadow-card p-6 lg:p-7">
                      <h2 className="font-nunito font-bold text-base text-amame-charcoal mb-4">Organisation</h2>
                      <div className="flex items-start gap-4">
                        <div className="w-10 h-10 bg-amame-green-subtle rounded-xl flex items-center justify-center shrink-0">
                          <Building className="h-5 w-5 text-amame-green" />
                        </div>
                        <div>
                          <p className="font-semibold text-amame-charcoal">{bourse.organisation || bourse.bailleur}</p>
                          {bourse.bailleur && bourse.organisation && (
                            <p className="text-sm text-amame-muted mt-1">Bailleur : {bourse.bailleur}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  )} */}
                </div>

                {/* ── Sidebar ── */}
                <div className="space-y-5">

                  {/* CTA + méta */}
                  <div className="bg-white rounded-2xl border border-amame-border shadow-card p-5">
                    <Button
                      onClick={() => bourse.urlSource && window.open(bourse.urlSource, "_blank", "noopener,noreferrer")}
                      disabled={!bourse.urlSource}
                      className="w-full bg-amame-gold hover:bg-yellow-600 text-white font-semibold rounded-xl gap-2 mb-4"
                    >
                      <ExternalLink className="h-4 w-4" />
                      Source officielle
                    </Button>
                    <div className="space-y-2.5 pt-4 border-t border-amame-border">
                      {bourse.datePublication && (
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-amame-muted flex items-center gap-1.5">
                            <Calendar className="h-3.5 w-3.5" />Publiée le
                          </span>
                          <span className="font-medium text-amame-charcoal text-xs">
                            {new Date(bourse.datePublication).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" })}
                          </span>
                        </div>
                      )}
                      {bourse.nombresVues !== undefined && (
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-amame-muted flex items-center gap-1.5">
                            <Eye className="h-3.5 w-3.5" />Vues
                          </span>
                          <span className="font-medium text-amame-charcoal text-xs">
                            {bourse.nombresVues.toLocaleString()}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Éligibilité — pills pour éviter le débordement */}
                  {(bourse.paysEligible || bourse.regionEligible) && (
                    <div className="bg-white rounded-2xl border border-amame-border shadow-card p-5">
                      <h3 className="font-nunito font-bold text-xs text-amame-charcoal uppercase tracking-wide mb-4">Éligibilité</h3>
                      <div className="space-y-4">
                        {bourse.paysEligible && (
                          <div>
                            <p className="text-xs text-amame-muted mb-2 flex items-center gap-1.5">
                              <MapPin className="h-3.5 w-3.5 text-amame-green shrink-0" />Pays éligibles
                            </p>
                            <div className="flex flex-wrap gap-1.5">
                              {bourse.paysEligible.split(/[,;]/).map(p => p.trim()).filter(Boolean).map(pays => (
                                <span key={pays}
                                  className="text-xs bg-amame-green-subtle text-amame-green-dark border border-amame-green/20 px-2 py-1 rounded-full font-medium">
                                  {pays}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                        {bourse.regionEligible && (
                          <div>
                            <p className="text-xs text-amame-muted mb-2 flex items-center gap-1.5">
                              <MapPin className="h-3.5 w-3.5 text-blue-500 shrink-0" />Régions éligibles
                            </p>
                            <div className="flex flex-wrap gap-1.5">
                              {bourse.regionEligible.split(/[,;]/).map(r => r.trim()).filter(Boolean).map(region => (
                                <span key={region}
                                  className="text-xs bg-blue-50 text-blue-700 border border-blue-200 px-2 py-1 rounded-full font-medium">
                                  {region}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Disclaimer */}
                  <div className="bg-amame-gold-subtle border border-amame-gold/20 rounded-2xl p-4">
                    <p className="text-xs text-amame-gold font-semibold mb-1">Information</p>
                    <p className="text-xs text-amame-slate leading-relaxed">
                      Vérifiez toujours les informations sur le site officiel avant de candidater.
                    </p>
                  </div>
                </div>

              </motion.div>
            ) : null}
          </AnimatePresence>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default BoursesDetail;
