import { Suspense, lazy } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Skeleton } from "@/components/ui/skeleton";
import ProtectedRoute from "@/components/ProtectedRoute";
import ScrollToTop from "@/components/ScrollToTop";

// ── Pages chargées immédiatement (above-the-fold critique) ─────────────────
import Index        from "./pages/Index";
import Login        from "@/pages/Authentication";
import NotFound     from "@/pages/NotFound";
import Forbidden    from "@/pages/Forbidden";

// ── Pages publiques — lazy (chargées à la demande) ────────────────────────
const About                = lazy(() => import("./pages/About"));
const Bourses              = lazy(() => import("./pages/Bourses"));
const BoursesDetail        = lazy(() => import("./pages/BoursesDetail"));
const BoursesEtude         = lazy(() => import("./pages/BoursesEtude"));
const BoursesRecherche     = lazy(() => import("./pages/BoursesRecherche"));
const Concours             = lazy(() => import("./pages/Concours"));
const ConcoursDetail       = lazy(() => import("./pages/ConcoursDetail"));
const ConcoursNational     = lazy(() => import("./pages/ConcoursNational"));
const ConcoursInternational= lazy(() => import("./pages/ConcoursInternational"));
const Orientation          = lazy(() => import("./pages/Orientation"));
const OrientationDetail    = lazy(() => import("./pages/OrientationDetail"));
const Universites          = lazy(() => import("./pages/Universites"));
const GuideConseils        = lazy(() => import("./pages/GuideConseils"));
const LiensUtiles          = lazy(() => import("./pages/LiensUtiles"));
const RessourcesAcademiques= lazy(() => import("./pages/RessourcesAcademiques"));
const Articles             = lazy(() => import("./pages/Articles"));
const ArticleDetail        = lazy(() => import("./pages/ArticleDetail"));
const Postes               = lazy(() => import("./pages/Postes"));
const Galeries             = lazy(() => import("./pages/Galeries"));
const Membres              = lazy(() => import("./pages/Membres"));
const Partenaires          = lazy(() => import("./pages/Partenaires"));

// ── Admin — lazy (ne charge les libs lourdes que si admin connecté) ────────
const AdminLayout          = lazy(() => import("@/components/admin/LayoutAdmin"));
const Dashboard            = lazy(() => import("@/pages/admin/Dashboard"));
const ArticlesManagement   = lazy(() => import("@/pages/admin/ArticlesManagement"));
const BoursesManagement    = lazy(() => import("@/pages/admin/BoursesManagement"));
const FilieresManagement   = lazy(() => import("@/pages/admin/FilieresManagement"));
const ConcoursManagement   = lazy(() => import("@/pages/admin/ConcoursManagement"));
const BourseForm           = lazy(() => import("./pages/admin/BourseForm"));
const ArticleForm          = lazy(() => import("./pages/admin/ArticleForm"));
const FiliereForm          = lazy(() => import("./pages/admin/FiliereForm"));
const ConcoursForm         = lazy(() => import("./pages/admin/ConcoursForm"));
const UsersManagement      = lazy(() => import("@/pages/admin/UsersManagement"));
const UserForm             = lazy(() => import("@/pages/admin/UserForm"));
const UserDetail           = lazy(() => import("./pages/admin/UserDetail"));
const MembresManagement    = lazy(() => import("@/pages/admin/MembresManagement"));
const MembreForm           = lazy(() => import("@/pages/admin/MembreForm"));
const PartenairesManagement= lazy(() => import("@/pages/admin/PartenairesManagement"));
const PartenaireForm       = lazy(() => import("@/pages/admin/PartenaireForm"));
const UniversitesManagement= lazy(() => import("@/pages/admin/UniversitesManagement"));
const UniversiteForm       = lazy(() => import("@/pages/admin/UniversiteForm"));
const LiensUtilesManagement= lazy(() => import("@/pages/admin/LiensUtilesManagement"));
const LienUtileForm        = lazy(() => import("@/pages/admin/LienUtileForm"));
const RessourcesManagement = lazy(() => import("@/pages/admin/RessourcesManagement"));
const RessourceForm        = lazy(() => import("@/pages/admin/RessourceForm"));
const PostesManagement     = lazy(() => import("@/pages/admin/PostesManagement"));
const PosteForm            = lazy(() => import("@/pages/admin/PosteForm"));
const GaleriesManagement   = lazy(() => import("@/pages/admin/GaleriesManagement"));
const GalerieForm          = lazy(() => import("@/pages/admin/GalerieForm"));
const AdhesionsManagement  = lazy(() => import("@/pages/admin/AdhesionsManagement"));
const Adhesion             = lazy(() => import("@/pages/Adhesion"));
const LayoutMembre         = lazy(() => import("@/components/membre/LayoutMembre"));
const DashboardHome        = lazy(() => import("@/pages/membre/DashboardHome"));
const MembreActivite       = lazy(() => import("@/pages/membre/Activite"));
const MembreCotisation     = lazy(() => import("@/pages/membre/Cotisation"));
const MembreDon            = lazy(() => import("@/pages/membre/Don"));
const MembreProfil         = lazy(() => import("@/pages/membre/Profil"));
const MembreParametres     = lazy(() => import("@/pages/membre/Parametres"));
const ForgotPassword       = lazy(() => import("@/pages/ForgotPassword"));
const ResetPassword        = lazy(() => import("@/pages/ResetPassword"));

// ── Fallback Suspense ──────────────────────────────────────────────────────
const PageLoader = () => (
  <div className="min-h-screen flex flex-col gap-4 p-8 bg-amame-surface">
    <Skeleton className="h-16 w-full rounded-xl" />
    <Skeleton className="h-48 w-full rounded-xl" />
    <div className="grid grid-cols-3 gap-4">
      <Skeleton className="h-32 rounded-xl" />
      <Skeleton className="h-32 rounded-xl" />
      <Skeleton className="h-32 rounded-xl" />
    </div>
  </div>
);

const App = () => (
  <TooltipProvider>
    <Toaster />
    <Sonner />
    <BrowserRouter>
      <ScrollToTop />
      <Suspense fallback={<PageLoader />}>
      <Routes>
          {/* Routes publiques */}
          <Route path="/" element={<Index />} />
          <Route path="/register" element={<Navigate to="/adhesion" replace />} />
          <Route path="/login" element={<Login />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/a-propos" element={<About />} />
          <Route path="/a-propos/membres" element={<Membres />} />
          <Route path="/a-propos/partenaires" element={<Partenaires />} />
          <Route path="/forbidden" element={<Forbidden />} />
          <Route path="*" element={<NotFound />} />

          {/* Bourses */}
          <Route path="/bourses" element={<Bourses />} />
          <Route path="/bourses/etude" element={<BoursesEtude />} />
          <Route path="/bourses/recherche" element={<BoursesRecherche />} />
          <Route path="/bourses/:id" element={<BoursesDetail />} />

          {/* Concours */}
          <Route path="/concours" element={<Concours />} />
          <Route path="/concours/national" element={<ConcoursNational />} />
          <Route path="/concours/international" element={<ConcoursInternational />} />
          <Route path="/concours/:id" element={<ConcoursDetail />} />

          {/* Orientation */}
          <Route path="/orientation" element={<Orientation />} />
          <Route path="/orientation/universites" element={<Universites />} />
          <Route path="/orientation/guide-conseils" element={<GuideConseils />} />
          <Route path="/orientation/liens-utiles" element={<LiensUtiles />} />
          <Route path="/orientation/ressources" element={<RessourcesAcademiques />} />
          <Route path="/orientation/:id" element={<OrientationDetail />} />

          {/* Adhésion */}
          <Route path="/adhesion" element={<Adhesion />} />

          {/* Espace membre — layout avec sidebar */}
          <Route path="/membre" element={<LayoutMembre />}>
            <Route index element={<Navigate to="/membre/dashboard" replace />} />
            <Route path="dashboard"  element={<DashboardHome />} />
            <Route path="activite"   element={<MembreActivite />} />
            <Route path="cotisation" element={<MembreCotisation />} />
            <Route path="don"        element={<MembreDon />} />
            <Route path="profil"     element={<MembreProfil />} />
            <Route path="parametres" element={<MembreParametres />} />
          </Route>

          {/* Actualités */}
          <Route path="/articles" element={<Articles />} />
          <Route path="/articles/postes" element={<Postes />} />
          <Route path="/articles/:slug" element={<ArticleDetail />} />
          <Route path="/galeries" element={<Galeries />} />

          {/* Admin */}
          <Route
            path="/admin/*"
            element={
              <ProtectedRoute>
                <AdminLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Dashboard />} />

            <Route path="articles" element={<ArticlesManagement />} />
            <Route path="articles/new" element={<ArticleForm />} />
            <Route path="articles/edit/:id" element={<ArticleForm />} />

            <Route path="bourses" element={<BoursesManagement />} />
            <Route path="bourses/new" element={<BourseForm />} />
            <Route path="bourses/edit/:id" element={<BourseForm />} />

            <Route path="concours" element={<ConcoursManagement />} />
            <Route path="concours/new" element={<ConcoursForm />} />
            <Route path="concours/edit/:id" element={<ConcoursForm />} />

            <Route path="filieres" element={<FilieresManagement />} />
            <Route path="filieres/new" element={<FiliereForm />} />
            <Route path="filieres/edit/:id" element={<FiliereForm />} />

            <Route path="users" element={<UsersManagement />} />
            <Route path="users/new" element={<UserForm />} />
            <Route path="users/edit/:id" element={<UserForm />} />
            <Route path="users/:id" element={<UserDetail />} />

            <Route path="membres" element={<MembresManagement />} />
            <Route path="membres/new" element={<MembreForm />} />
            <Route path="membres/edit/:id" element={<MembreForm />} />

            <Route path="partenaires" element={<PartenairesManagement />} />
            <Route path="partenaires/new" element={<PartenaireForm />} />
            <Route path="partenaires/edit/:id" element={<PartenaireForm />} />

            <Route path="universites" element={<UniversitesManagement />} />
            <Route path="universites/new" element={<UniversiteForm />} />
            <Route path="universites/edit/:id" element={<UniversiteForm />} />

            <Route path="liens-utiles" element={<LiensUtilesManagement />} />
            <Route path="liens-utiles/new" element={<LienUtileForm />} />
            <Route path="liens-utiles/edit/:id" element={<LienUtileForm />} />

            <Route path="ressources" element={<RessourcesManagement />} />
            <Route path="ressources/new" element={<RessourceForm />} />
            <Route path="ressources/edit/:id" element={<RessourceForm />} />

            <Route path="postes" element={<PostesManagement />} />
            <Route path="postes/new" element={<PosteForm />} />
            <Route path="postes/edit/:id" element={<PosteForm />} />

            <Route path="galeries" element={<GaleriesManagement />} />
            <Route path="galeries/new" element={<GalerieForm />} />
            <Route path="galeries/edit/:id" element={<GalerieForm />} />

            <Route path="adhesions" element={<AdhesionsManagement />} />
          </Route>
      </Routes>
      </Suspense>
    </BrowserRouter>
  </TooltipProvider>
);

export default App;
