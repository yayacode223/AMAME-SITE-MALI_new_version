import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route} from "react-router-dom";

import Index from "./pages/Index";
import Bourses from "./pages/Bourses";
import BoursesDetail from "./pages/BoursesDetail";
import Register from "@/pages/Register";
import Login from "@/pages/Authentication";
import About from "./pages/About";
import Orientation from "./pages/Orientation";
import Articles from "./pages/Articles";
import OrientationDetail from "./pages/OrientationDetail";
import ArticleDetail from "./pages/ArticleDetail";
import Concours from "./pages/Concours";
import ConcoursDetail from "./pages/ConcoursDetail";
import AdminLayout from "@/components/admin/LayoutAdmin";
import Dashboard from "@/pages/admin/Dashboard";
import ArticlesManagement from "@/pages/admin/ArticlesManagement";
import BoursesManagement from "@/pages/admin/BoursesManagement";
import FilieresManagement from "@/pages/admin/FilieresManagement";
import ConcoursManagement from "@/pages/admin/ConcoursManagement";
import BourseForm from "./pages/admin/BourseForm";
import ArticleForm from "./pages/admin/ArticleForm";
import FiliereForm from "./pages/admin/FiliereForm";
import ConcoursForm from "./pages/admin/ConcoursForm";
import ProtectedRoute from "@/components/ProtectedRoute";
import NotFound from "@/pages/NotFound";
import Forbidden from "@/pages/Forbidden";
import UsersManagement from "@/pages/admin/UsersManagement";
import UserForm from "@/pages/admin/UserForm";
import UserDetail from "./pages/admin/UserDetail";


const queryClient = new QueryClient();



const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          //Routes publiques
          <Route path="/" element={<Index />} />
          <Route path="/register" element={<Register />} />
          <Route path="/login" element={<Login />} />
          <Route path="/bourses" element={<Bourses />} />
          <Route path="/bourses/:id" element={<BoursesDetail />} />
          <Route path="/a-propos" element={<About />} />
          <Route path="/orientation" element={<Orientation />} />
          <Route path="/articles" element={<Articles />} />
          <Route path="/orientation/:id" element={<OrientationDetail />} />
          <Route path="/articles/:slug" element={<ArticleDetail />} />
          <Route path="/concours" element={<Concours />} />
          <Route path="/concours/:id" element={<ConcoursDetail />} />
          <Route path="*" element={<NotFound />} />
          <Route path="/forbidden" element={<Forbidden />} />


          //Routes admin
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
            
          </Route>
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
