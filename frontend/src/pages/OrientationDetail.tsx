import { useParams, Link } from "react-router-dom";
import SEO from "../components/SEO";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, Clock, TrendingUp, DollarSign, BookOpen, MapPin, Star, Briefcase, GraduationCap, Target, CheckCircle } from "lucide-react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { useGetFiliereById } from "../service/orientationService";
import { DifficulteType } from "@/types/orientationType";

const diffConfig: Record<string, { label: string; cls: string }> = {
  [DifficulteType.TRES_ELEVEE]: { label: "Très élevée", cls: "bg-red-50 text-red-700 border-red-200" },
  [DifficulteType.ELEVEE]: { label: "Élevée", cls: "bg-orange-50 text-orange-700 border-orange-200" },
};
const defaultDiff = { label: "Moyenne", cls: "bg-amame-green-light text-amame-green-dark border-amame-green/20" };

export function OrientationDetail() {
  const { id } = useParams();
  const { data: filiere, isLoading } = useGetFiliereById(Number(id));

  if (isLoading) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen bg-amame-surface">
          <div className="bg-white border-b border-amame-border"><div className="container mx-auto px-4 py-4"><Skeleton className="h-9 w-36 rounded-lg" /></div></div>
          <div className="container mx-auto px-4 py-10 grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-1 space-y-4">{[...Array(3)].map((_, i) => <Skeleton key={i} className="h-48 w-full rounded-xl" />)}</div>
            <div className="lg:col-span-2 space-y-5">{[...Array(3)].map((_, i) => <Skeleton key={i} className="h-40 w-full rounded-xl" />)}</div>
          </div>
        </div>
        <Footer />
      </>
    );
  }

  if (!filiere) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen bg-amame-surface flex items-center justify-center">
          <div className="text-center p-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-amame-green-subtle rounded-2xl mb-5"><Briefcase className="h-8 w-8 text-amame-green" /></div>
            <h2 className="font-nunito font-bold text-xl text-amame-charcoal mb-3">Filière non trouvée</h2>
            <p className="text-amame-muted mb-6">La filière que vous recherchez n'existe pas ou a été déplacée.</p>
            <Button asChild className="bg-amame-green hover:bg-amame-green-dark text-white font-semibold rounded-xl gap-2">
              <Link to="/orientation"><ArrowLeft className="h-4 w-4" />Retour à l'orientation</Link>
            </Button>
          </div>
        </div>
        <Footer />
      </>
    );
  }

  const diff = diffConfig[filiere.difficulte] || defaultDiff;

  return (
    <>
      <SEO
        title={filiere.nom}
        description={
          (filiere.descriptionCourte || filiere.descriptionLongue || "").slice(0, 155) ||
          `Filière ${filiere.nom} au Mali : débouchés, durée des études, salaires et établissements. Guide complet par l'AMAME.`
        }
        path={`/orientation/${filiere.id}`}
        keywords={`${filiere.nom}, filière Mali, orientation Mali, études Mali, AMAME`}
      />
      <Navbar />
      <div className="min-h-screen bg-amame-surface flex flex-col">
        {/* Breadcrumb */}
        <div className="bg-white border-b border-amame-border">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-3">
            <Button variant="ghost" asChild className="text-amame-muted hover:text-amame-charcoal hover:bg-gray-100 rounded-lg gap-2 h-9 text-sm">
              <Link to="/orientation"><ArrowLeft className="h-4 w-4" />Retour à l'orientation</Link>
            </Button>
          </div>
        </div>

        {/* Page header */}
        <div className="page-hero">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <div className="w-14 h-14 bg-white rounded-xl shadow-card border border-amame-border flex items-center justify-center overflow-hidden shrink-0">
                {filiere.filePath ? (
                  <img src={`/${filiere.filePath}`} alt={filiere.nom} className="w-full h-full object-cover" loading="lazy" onError={e => { e.currentTarget.style.display = "none"; }} />
                ) : (
                  <GraduationCap className="h-7 w-7 text-amame-green" />
                )}
              </div>
              <div className="flex-1">
                <div className="flex flex-wrap items-center gap-2 mb-2">
                  <span className="section-label !mb-0">Filière</span>
                  <Badge className={`text-xs border ${diff.cls}`}>Difficulté : {diff.label}</Badge>
                </div>
                <h1 className="font-nunito font-black text-2xl sm:text-3xl text-amame-charcoal">{filiere.nom}</h1>
              </div>
            </div>
          </div>
        </div>

        <section className="flex-grow py-8 lg:py-12">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

              {/* Sidebar */}
              <aside className="lg:col-span-1 space-y-5">
                {/* Quick stats */}
                <div className="bg-white rounded-xl border border-amame-border shadow-card p-5">
                  <h3 className="font-nunito font-bold text-sm text-amame-charcoal uppercase tracking-wide mb-4 flex items-center gap-2">
                    <Target className="h-4 w-4 text-amame-green" />Aperçu rapide
                  </h3>
                  <div className="space-y-3">
                    {[
                      { icon: Clock, label: "Durée", value: filiere.dureeEtudes, color: "text-blue-500" },
                      { icon: TrendingUp, label: "Demande", value: filiere.demande, color: "text-amame-gold" },
                      { icon: DollarSign, label: "Salaire moyen", value: filiere.salaire, color: "text-amame-green" },
                    ].map(({ icon: Icon, label, value, color }) => value && (
                      <div key={label} className="flex items-center justify-between py-2 border-b border-amame-border last:border-0">
                        <span className="text-sm text-amame-muted flex items-center gap-1.5"><Icon className={`h-4 w-4 ${color}`} />{label}</span>
                        <span className="text-sm font-semibold text-amame-charcoal">{value}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Universities */}
                {filiere.universites && filiere.universites.length > 0 && (
                  <div className="bg-white rounded-xl border border-amame-border shadow-card p-5">
                    <h3 className="font-nunito font-bold text-sm text-amame-charcoal uppercase tracking-wide mb-4 flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-blue-500" />Établissements
                    </h3>
                    <ul className="space-y-2">
                      {filiere.universites.slice(0, 5).map((u, i) => (
                        <li key={i} className="flex items-center gap-2 text-sm text-amame-slate">
                          <Star className="h-3.5 w-3.5 text-amame-gold shrink-0" />{u}
                        </li>
                      ))}
                      {filiere.universites.length > 5 && (
                        <li className="text-xs text-amame-muted italic">+{filiere.universites.length - 5} autres établissements</li>
                      )}
                    </ul>
                  </div>
                )}

                {/* Prerequisites */}
                {filiere.prerequis && filiere.prerequis.length > 0 && (
                  <div className="bg-white rounded-xl border border-amame-border shadow-card p-5">
                    <h3 className="font-nunito font-bold text-sm text-amame-charcoal uppercase tracking-wide mb-4 flex items-center gap-2">
                      <BookOpen className="h-4 w-4 text-amame-green" />Prérequis
                    </h3>
                    <ul className="space-y-2">
                      {filiere.prerequis.slice(0, 6).map((p, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-amame-slate">
                          <CheckCircle className="h-4 w-4 text-amame-green mt-0.5 shrink-0" />{p}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </aside>

              {/* Main */}
              <div className="lg:col-span-2 space-y-5">
                {/* Description */}
                <div className="bg-white rounded-xl border border-amame-border shadow-card p-6 lg:p-7">
                  <div className="h-1 -mx-6 lg:-mx-7 -mt-6 lg:-mt-7 mb-5 rounded-t-xl bg-gradient-to-r from-amame-green to-amame-green-dark" />
                  <h2 className="font-nunito font-bold text-lg text-amame-charcoal mb-4">Description de la filière</h2>
                  <p className="text-amame-slate leading-relaxed">
                    {filiere.descriptionLongue || filiere.descriptionCourte || "Aucune description disponible."}
                  </p>
                </div>

                {/* Debouches */}
                {filiere.debouches && filiere.debouches.length > 0 && (
                  <div className="bg-white rounded-xl border border-amame-border shadow-card p-6 lg:p-7">
                    <h2 className="font-nunito font-bold text-lg text-amame-charcoal mb-4 flex items-center gap-2">
                      <Briefcase className="h-5 w-5 text-amame-gold" />Débouchés professionnels
                    </h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {filiere.debouches.map((d, i) => (
                        <div key={i} className="flex items-center gap-2.5 p-3 bg-amame-green-subtle rounded-lg border border-amame-green/15 text-sm text-amame-charcoal">
                          <div className="w-2 h-2 bg-amame-green rounded-full shrink-0" />
                          {d}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Competences */}
                {filiere.competences && filiere.competences.length > 0 && (
                  <div className="bg-white rounded-xl border border-amame-border shadow-card p-6 lg:p-7">
                    <h2 className="font-nunito font-bold text-lg text-amame-charcoal mb-4">Compétences développées</h2>
                    <div className="flex flex-wrap gap-2">
                      {filiere.competences.map((c, i) => (
                        <Badge key={i} className="bg-blue-50 text-blue-700 border border-blue-200 text-xs px-3 py-1">{c}</Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Salary & Perspectives */}
                <div className="grid sm:grid-cols-2 gap-5">
                  <div className="bg-white rounded-xl border border-amame-border shadow-card p-5">
                    <h3 className="font-nunito font-bold text-sm text-amame-charcoal mb-4">Évolution de carrière</h3>
                    <div className="space-y-3">
                      {filiere.salaireDebut && (
                        <div>
                          <p className="text-xs text-amame-muted mb-0.5">Début de carrière</p>
                          <p className="font-bold text-xl text-amame-charcoal">{filiere.salaireDebut}</p>
                        </div>
                      )}
                      {filiere.salaireExperience && (
                        <div className="pt-2 border-t border-amame-border">
                          <p className="text-xs text-amame-muted mb-0.5">Avec expérience</p>
                          <p className="font-bold text-xl text-amame-green">{filiere.salaireExperience}</p>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="bg-white rounded-xl border border-amame-border shadow-card p-5">
                    <h3 className="font-nunito font-bold text-sm text-amame-charcoal mb-3">Perspectives d'avenir</h3>
                    <p className="text-sm text-amame-slate leading-relaxed">
                      {filiere.perspectives || "Les perspectives pour cette filière sont prometteuses avec une demande croissante sur le marché de l'emploi."}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
      <Footer />
    </>
  );
}

export default OrientationDetail;
