
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import Index from "./pages/Index";
// import Concours from "./pages/Concours";
import Filieres from "./pages/Filieres";
import Bourses from "./pages/Bourses";
// import Ressources from "./pages/Ressources";
// import NotFound from "./pages/NotFound";
// import Admin from "./pages/Admin";
// import ConcoursDetail from "./pages/details/ConcoursDetail";
// import FiliereDetail from "./pages/details/FiliereDetail";
// import BourseDetail from "./pages/details/BourseDetail";
// import RessourceDetail from "./pages/details/RessourceDetail";
import Register from "@/pages/Register";
import Login from "@/pages/Authentication"; 
// import AppLayout from "./layout/AppLayout";
// import Home from "./pages/Dashboard/Home";
// import UserProfiles from "./pages/UserProfiles";
// import Calendar from "./pages/Calendar";
// import Blank from "./pages/Blank";
// import FormElements from "./pages/Forms/FormElements";
// import BasicTables from "./pages/Tables/BasicTables";
// import Alerts from "./pages/UiElements/Alerts";
// import Avatars from "./pages/UiElements/Avatars";
// import Badges from "./pages/UiElements/Badges";
// import Buttons from "./pages/UiElements/Buttons";
// import Images from "./pages/UiElements/Images";
// import Videos from "./pages/UiElements/Videos";
// import LineChart from "./pages/Charts/LineChart";
// import BarChart from "./pages/Charts/BarChart";
import SignIn from "./pages/AuthPages/SignIn";
import SignUp from "./pages/AuthPages/SignUp";
import EtablissementsList from "./pages/EtablissementsList"; 


const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          {/* <Route path="/concours" element={<Concours />} />
          <Route path="/concours/:id" element={<ConcoursDetail />} />
          
          <Route path="/filieres/:id" element={<FiliereDetail />} />
          
          <Route path="/bourses/:id" element={<BourseDetail />} />
          <Route path="/ressources" element={<Ressources />} />
          <Route path="/ressources/:id" element={<RessourceDetail />} />
          <Route path="/admin" element={<Admin />} /> */}
          <Route path="/register" element={<Register />} />
          <Route path="/login" element={<Login />} />
          {/* <Route path="*" element={<NotFound />} /> */}

          
           {/* <Route element={<AppLayout />}>
            <Route index path="/" element={<Home />} />

            <Route path="/profile" element={<UserProfiles />} />
            <Route path="/calendar" element={<Calendar />} />
            <Route path="/blank" element={<Blank />} />

           
            <Route path="/form-elements" element={<FormElements />} />

           
            <Route path="/basic-tables" element={<BasicTables />} />

            
            <Route path="/alerts" element={<Alerts />} />
            <Route path="/avatars" element={<Avatars />} />
            <Route path="/badge" element={<Badges />} />
            <Route path="/buttons" element={<Buttons />} />
            <Route path="/images" element={<Images />} />
            <Route path="/videos" element={<Videos />} />

            
            <Route path="/line-chart" element={<LineChart />} />
            <Route path="/bar-chart" element={<BarChart />} />
          </Route>  */}
          <Route path="/filieres" element={<Filieres />} />
          <Route path="/bourses" element={<Bourses />} />
          {/* Auth Layout */}
          <Route path="/signin" element={<SignIn />} />
          <Route path="/signup" element={<SignUp />} />
          <Route path="/ " element={<EtablissementsList />} />

          {/* Fallback Route */}
          {/* <Route path="*" element={<NotFound />} /> */}
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
