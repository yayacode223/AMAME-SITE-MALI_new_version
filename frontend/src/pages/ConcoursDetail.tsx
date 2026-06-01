import { useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import SEO from "../components/SEO";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Calendar, MapPin, GraduationCap, Target, Globe, FileText, ArrowLeft, Clock, ExternalLink, Download, Trophy } from "lucide-react";
import { useConcoursDetail } from "@/service/concoursService";

const ConcoursDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: concours, isLoading, error } = useConcoursDetail(Number(id));

  const formattedOpenDate = useMemo(() => {
    if (!concours?.dateOuverture) return "";
    try { return format(new Date(concours.dateOuverture), "dd MMMM yyyy", { locale: fr }); }
    catch { return concours.dateOuverture; }
  }, [concours?.dateOuverture]);

  const formattedLimitDate = useMemo(() => {
    if (!concours?.dateLimite) return "";
    try { return format(new Date(concours.dateLimite), "dd MMMM yyyy", { locale: fr }); }
    catch { return concours.dateLimite; }
  }, [concours?.dateLimite]);

  const statusInfo = useMemo(() => {
    if (!concours) return null;
    const now = new Date();
    const limite = new Date(concours.dateLimite);
    const ouverture = new Date(concours.dateOuverture);
    if (now < ouverture) return { label: "À venir", cls: "bg-blue-50 text-blue-700 border-blue-200" };
    if (now <= limite) return { label: "Ouvert", cls: "bg-amame-green-light text-amame-green-dark border-amame-green/20" };
    return { label: "Clôturé", cls: "bg-gray-100 text-gray-500 border-gray-200" };
  }, [concours]);

  const handleOpenFile = () => {
    if (!concours?.filePath) return;
    const url = concours.filePath.startsWith("http") ? concours.filePath : `/${concours.filePath}`;
    window.open(url, "_blank");
  };

  const handleDownloadFile = () => {
    if (!concours?.filePath) return;
    const url = concours.filePath.startsWith("http") ? concours.filePath : `/${concours.filePath}`;
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `${concours.nom.replace(/\s+/g, "_")}.pdf`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (error) {
    return (
      <div className="min-h-screen bg-amame-surface"><Navbar />
        <div className="container mx-auto px-4 py-24 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-red-50 rounded-2xl mb-5"><Trophy className="h-8 w-8 text-red-500" /></div>
          <h1 className="font-nunito font-bold text-2xl text-amame-charcoal mb-3">Concours non trouvé</h1>
          <p className="text-amame-muted mb-8">Le concours que vous recherchez n'existe pas ou a été supprimé.</p>
          <Button onClick={() => navigate("/concours")} className="bg-amame-green hover:bg-amame-green-dark text-white font-semibold rounded-xl gap-2">
            <ArrowLeft className="h-4 w-4" /> Retour aux concours
          </Button>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-amame-surface flex flex-col">
      {concours && (
        <SEO
          title={concours.nom}
          description={concours.description
            ? concours.description.slice(0, 155)
            : `Concours ${concours.status === "NATIONAL" ? "national" : "international"} au ${concours.pays}. Informations et candidature sur AMAME.`}
          path={`/concours/${concours.id}`}
          keywords={`${concours.nom}, concours Mali, ${concours.pays}, ${concours.niveau}, AMAME`}
        />
      )}
      <Navbar />

      {/* Breadcrumb */}
      <div className="bg-white border-b border-amame-border">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <Button variant="ghost" onClick={() => navigate(-1)} className="text-amame-muted hover:text-amame-charcoal hover:bg-gray-100 rounded-lg gap-2 h-9 text-sm">
            <ArrowLeft className="h-4 w-4" /> Retour aux concours
          </Button>
        </div>
      </div>

      <section className="flex-grow py-8 lg:py-12">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          {isLoading ? (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-1 space-y-5">
                <div className="bg-white rounded-xl border border-amame-border p-6 space-y-4">
                  <Skeleton className="h-6 w-24 rounded-full" />
                  {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-5 w-full rounded-lg" />)}
                  <Skeleton className="h-11 w-full rounded-xl" />
                </div>
              </div>
              <div className="lg:col-span-2 space-y-5">
                <div className="bg-white rounded-xl border border-amame-border p-6 space-y-4">
                  <Skeleton className="h-8 w-3/4 rounded-lg" />
                  <Skeleton className="h-5 w-full rounded-lg" />
                  <Skeleton className="h-5 w-2/3 rounded-lg" />
                </div>
                <Skeleton className="h-48 w-full rounded-xl" />
              </div>
            </div>
          ) : concours ? (
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
              className="grid grid-cols-1 lg:grid-cols-3 gap-8">

              {/* Sidebar */}
              <aside className="lg:col-span-1">
                <div className="bg-white rounded-xl border border-amame-border shadow-card p-5 sticky top-20">
                  {statusInfo && (
                    <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border mb-5 ${statusInfo.cls}`}>
                      <Clock className="h-3.5 w-3.5" />{statusInfo.label}
                    </div>
                  )}

                  {/* Dates */}
                  <div className="space-y-3 mb-5">
                    <p className="text-xs font-semibold text-amame-charcoal uppercase tracking-wide">Dates importantes</p>
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center shrink-0">
                        <Calendar className="h-4 w-4 text-blue-600" />
                      </div>
                      <div>
                        <p className="text-xs text-amame-muted">Ouverture</p>
                        <p className="text-sm font-semibold text-amame-charcoal">{formattedOpenDate}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 bg-red-50 rounded-lg flex items-center justify-center shrink-0">
                        <Clock className="h-4 w-4 text-red-500" />
                      </div>
                      <div>
                        <p className="text-xs text-amame-muted">Clôture</p>
                        <p className="text-sm font-semibold text-amame-charcoal">{formattedLimitDate}</p>
                      </div>
                    </div>
                  </div>

                  {/* Info */}
                  <div className="space-y-3 mb-5 pt-4 border-t border-amame-border">
                    <p className="text-xs font-semibold text-amame-charcoal uppercase tracking-wide">Informations</p>
                    <div className="flex items-center gap-2 text-sm">
                      <MapPin className="h-4 w-4 text-amame-green shrink-0" />
                      <span className="text-amame-slate">{concours.pays}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <GraduationCap className="h-4 w-4 text-blue-500 shrink-0" />
                      <Badge className="bg-blue-50 text-blue-700 border border-blue-200 text-xs">{concours.niveau}</Badge>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Target className="h-4 w-4 text-amame-gold shrink-0" />
                      <Badge className="bg-amame-gold-subtle text-amame-gold border border-amame-gold/20 text-xs">
                        {concours.status === "NATIONAL" ? "National" : "International"}
                      </Badge>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="space-y-2 pt-4 border-t border-amame-border">
                    {concours.lienOfficiel && (
                      <Button className="w-full bg-amame-green hover:bg-amame-green-dark text-white font-semibold rounded-xl gap-2 text-sm"
                        onClick={() => window.open(concours.lienOfficiel, "_blank")}>
                        <Globe className="h-4 w-4" />Site officiel<ExternalLink className="h-3.5 w-3.5 ml-auto" />
                      </Button>
                    )}
                    {concours.filePath && (
                      <>
                        <Button variant="outline" className="w-full border-2 border-blue-200 text-blue-700 hover:bg-blue-50 font-semibold rounded-xl gap-2 text-sm" onClick={handleOpenFile}>
                          <FileText className="h-4 w-4" />Voir le document
                        </Button>
                        <Button variant="outline" className="w-full border-2 border-amame-green/30 text-amame-green hover:bg-amame-green-subtle font-semibold rounded-xl gap-2 text-sm" onClick={handleDownloadFile}>
                          <Download className="h-4 w-4" />Télécharger
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </aside>

              {/* Main content */}
              <div className="lg:col-span-2 space-y-5">
                {/* Header */}
                <div className="bg-white rounded-xl border border-amame-border shadow-card p-6 lg:p-7">
                  <div className="h-1 -mx-6 lg:-mx-7 -mt-6 lg:-mt-7 mb-5 rounded-t-xl bg-gradient-to-r from-blue-500 to-blue-400" />
                  <div className="flex flex-wrap gap-2 mb-4">
                    {statusInfo && <Badge className={`text-xs border ${statusInfo.cls}`}>{statusInfo.label}</Badge>}
                    <Badge className="bg-blue-50 text-blue-700 border border-blue-200 text-xs">{concours.niveau}</Badge>
                    <Badge className="bg-amame-gold-subtle text-amame-gold border border-amame-gold/20 text-xs">
                      {concours.status === "NATIONAL" ? "National" : "International"}
                    </Badge>
                  </div>
                  <h1 className="font-nunito font-black text-2xl lg:text-3xl text-amame-charcoal mb-3 leading-tight">{concours.nom}</h1>
                  <p className="text-amame-slate leading-relaxed">{concours.description}</p>
                </div>

                {/* Details */}
                <div className="bg-white rounded-xl border border-amame-border shadow-card p-6 lg:p-7">
                  <h2 className="font-nunito font-bold text-lg text-amame-charcoal mb-5">Détails du concours</h2>
                  <div className="grid sm:grid-cols-2 gap-4 mb-6">
                    <div className="bg-amame-surface rounded-xl p-4 border border-amame-border">
                      <p className="text-xs font-semibold text-amame-muted uppercase tracking-wide mb-1.5">Période d'inscription</p>
                      <p className="text-sm text-amame-charcoal">Du <strong>{formattedOpenDate}</strong> au <strong>{formattedLimitDate}</strong></p>
                    </div>
                    <div className="bg-amame-surface rounded-xl p-4 border border-amame-border">
                      <p className="text-xs font-semibold text-amame-muted uppercase tracking-wide mb-1.5">Localisation</p>
                      <p className="text-sm text-amame-charcoal"><strong>{concours.pays}</strong> — {concours.status === "NATIONAL" ? "National" : "International"}</p>
                    </div>
                  </div>

                  {/* How to apply */}
                  <div className="bg-blue-50 border border-blue-200 rounded-xl p-5">
                    <h3 className="font-semibold text-blue-900 text-sm mb-3">Comment postuler ?</h3>
                    <ul className="space-y-2 text-sm text-blue-800">
                      <li className="flex items-start gap-2"><span className="text-blue-500 font-bold mt-0.5">→</span>Consultez le site officiel pour les modalités exactes</li>
                      <li className="flex items-start gap-2"><span className="text-blue-500 font-bold mt-0.5">→</span>Préparez les documents requis à l'avance</li>
                      <li className="flex items-start gap-2"><span className="text-blue-500 font-bold mt-0.5">→</span>Respectez scrupuleusement la date limite d'inscription</li>
                      {concours.filePath && <li className="flex items-start gap-2"><span className="text-blue-500 font-bold mt-0.5">→</span>Téléchargez la documentation complète pour plus de détails</li>}
                    </ul>
                  </div>
                </div>

                {/* Disclaimer */}
                <div className="bg-amame-gold-subtle border border-amame-gold/20 rounded-xl p-4">
                  <p className="text-xs font-semibold text-amame-gold mb-1">Important</p>
                  <p className="text-xs text-amame-slate leading-relaxed">
                    Les informations présentées sont indicatives. Vérifiez toujours sur le <strong>site officiel du concours</strong> pour les dernières mises à jour.
                  </p>
                </div>
              </div>
            </motion.div>
          ) : null}
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default ConcoursDetail;
