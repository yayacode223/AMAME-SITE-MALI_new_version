import { useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import SEO from "../components/SEO";
import { ArrowLeft, Calendar, MapPin, GraduationCap, Building, ExternalLink, Eye, Clock, Award } from "lucide-react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useGetBourseDetail } from "@/service/bourseService";

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
    passed: { cls: "bg-red-50 border-red-200 text-red-800", label: "Date limite dépassée" },
    near: { cls: "bg-orange-50 border-orange-200 text-orange-800", label: "Date limite proche" },
    ok: { cls: "bg-amame-green-subtle border-amame-green/20 text-amame-green-dark", label: "Date limite de candidature" },
    neutral: { cls: "bg-gray-50 border-gray-200 text-gray-700", label: "Date limite" },
  };

  const dc = deadlineConfig[deadlineStatus];

  if (error) {
    return (
      <div className="min-h-screen bg-amame-surface"><Navbar />
        <div className="container mx-auto px-4 py-24 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-red-50 rounded-2xl mb-5"><Award className="h-8 w-8 text-red-500" /></div>
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
          <Button variant="ghost" onClick={() => navigate(-1)} className="text-amame-muted hover:text-amame-charcoal hover:bg-gray-100 rounded-lg gap-2 h-9 text-sm">
            <ArrowLeft className="h-4 w-4" /> Retour aux bourses
          </Button>
        </div>
      </div>

      <section className="flex-grow py-8 lg:py-12">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <AnimatePresence mode="wait">
            {isLoading ? (
              <motion.div key="skeleton" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="grid lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-5">
                  <div className="bg-white rounded-xl border border-amame-border p-6 space-y-4">
                    <div className="flex gap-2"><Skeleton className="h-6 w-20 rounded-full" /><Skeleton className="h-6 w-24 rounded-full" /></div>
                    <Skeleton className="h-8 w-3/4 rounded-lg" />
                    <Skeleton className="h-5 w-full rounded-lg" />
                    <Skeleton className="h-5 w-2/3 rounded-lg" />
                    <Skeleton className="h-14 w-full rounded-xl" />
                  </div>
                  <div className="bg-white rounded-xl border border-amame-border p-6 space-y-3">
                    <Skeleton className="h-6 w-40 rounded-lg" />
                    <Skeleton className="h-24 w-full rounded-lg" />
                  </div>
                </div>
                <div className="space-y-5">
                  <Skeleton className="h-56 w-full rounded-xl" />
                  <Skeleton className="h-36 w-full rounded-xl" />
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

                {/* Main */}
                <div className="lg:col-span-2 space-y-5">
                  {/* Header card */}
                  <div className="bg-white rounded-xl border border-amame-border shadow-card p-6 lg:p-7">
                    {/* Top accent */}
                    <div className="h-1 -mx-6 lg:-mx-7 -mt-6 lg:-mt-7 mb-5 rounded-t-xl bg-gradient-to-r from-amame-gold to-amame-gold-light" />

                    {/* Badges */}
                    <div className="flex flex-wrap gap-2 mb-4">
                      {bourse.niveau && (
                        <Badge className="bg-blue-50 text-blue-700 border border-blue-200 text-xs"><GraduationCap className="h-3 w-3 mr-1" />{bourse.niveau}</Badge>
                      )}
                      {bourse.paysHote && (
                        <Badge className="bg-amame-green-light text-amame-green-dark border border-amame-green/20 text-xs"><MapPin className="h-3 w-3 mr-1" />{bourse.paysHote}</Badge>
                      )}
                      {bourse.categorie && (
                        <Badge className="bg-gray-50 text-gray-600 border border-gray-200 text-xs">{bourse.categorie}</Badge>
                      )}
                      {bourse.financementStatut && (
                        <Badge className="bg-amame-gold-subtle text-amame-gold border border-amame-gold/20 text-xs">{bourse.financementStatut}</Badge>
                      )}
                    </div>

                    <h1 className="font-nunito font-black text-2xl lg:text-3xl text-amame-charcoal mb-3 leading-tight">
                      {bourse.titre}
                    </h1>
                    <p className="text-amame-slate leading-relaxed">{bourse.descriptionCourte}</p>

                    {/* Deadline alert */}
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

                  {/* Description */}
                  <div className="bg-white rounded-xl border border-amame-border shadow-card p-6 lg:p-7">
                    <h2 className="font-nunito font-bold text-lg text-amame-charcoal mb-4">Description détaillée</h2>
                    <div className="prose prose-sm max-w-none text-amame-slate leading-relaxed">
                      {bourse.descriptionLongue ? (
                        <p className="whitespace-pre-line">{bourse.descriptionLongue}</p>
                      ) : (
                        <p className="text-amame-muted italic">Aucune description détaillée disponible.</p>
                      )}
                    </div>
                  </div>

                  {/* Organisation */}
                  {(bourse.organisation || bourse.bailleur) && (
                    <div className="bg-white rounded-xl border border-amame-border shadow-card p-6 lg:p-7">
                      <h2 className="font-nunito font-bold text-lg text-amame-charcoal mb-4">Organisation</h2>
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
                  )}
                </div>

                {/* Sidebar */}
                <div className="space-y-5">
                  {/* Actions */}
                  <div className="bg-white rounded-xl border border-amame-border shadow-card p-5">
                    <Button
                      onClick={() => bourse.urlSource && window.open(bourse.urlSource, "_blank", "noopener,noreferrer")}
                      disabled={!bourse.urlSource}
                      className="w-full bg-amame-gold hover:bg-yellow-600 text-white font-semibold rounded-xl gap-2 mb-4"
                    >
                      <ExternalLink className="h-4 w-4" />
                      Voir la source officielle
                    </Button>

                    <div className="space-y-3 pt-4 border-t border-amame-border">
                      {bourse.datePublication && (
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-amame-muted flex items-center gap-1.5"><Calendar className="h-3.5 w-3.5" />Publiée le</span>
                          <span className="font-medium text-amame-charcoal">{new Date(bourse.datePublication).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" })}</span>
                        </div>
                      )}
                      {bourse.nombresVues !== undefined && (
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-amame-muted flex items-center gap-1.5"><Eye className="h-3.5 w-3.5" />Vues</span>
                          <span className="font-medium text-amame-charcoal">{bourse.nombresVues.toLocaleString()}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Eligibility */}
                  {(bourse.paysEligible || bourse.regionEligible) && (
                    <div className="bg-white rounded-xl border border-amame-border shadow-card p-5">
                      <h3 className="font-nunito font-bold text-sm text-amame-charcoal uppercase tracking-wide mb-4">Éligibilité</h3>
                      <div className="space-y-3">
                        {bourse.paysEligible && (
                          <div className="flex items-start gap-3">
                            <MapPin className="h-4 w-4 text-amame-green mt-0.5 shrink-0" />
                            <div>
                              <p className="text-xs text-amame-muted">Pays éligibles</p>
                              <p className="text-sm font-medium text-amame-charcoal">{bourse.paysEligible}</p>
                            </div>
                          </div>
                        )}
                        {bourse.regionEligible && (
                          <div className="flex items-start gap-3">
                            <MapPin className="h-4 w-4 text-blue-500 mt-0.5 shrink-0" />
                            <div>
                              <p className="text-xs text-amame-muted">Régions éligibles</p>
                              <p className="text-sm font-medium text-amame-charcoal">{bourse.regionEligible}</p>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Disclaimer */}
                  <div className="bg-amame-gold-subtle border border-amame-gold/20 rounded-xl p-4">
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
