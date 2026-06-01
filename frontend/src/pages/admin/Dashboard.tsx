import React from "react";
import { Link } from "react-router-dom";
import {
  NewspaperIcon,
  AcademicCapIcon,
  TrophyIcon,
  UserGroupIcon,
  FolderIcon,
  PlusIcon,
} from "@heroicons/react/24/outline";
import { useGetBourses } from "@/service/bourseService";
import { useGetAllArticles } from "@/service/articleService";
import { useConcoursLists } from "@/service/concoursService";
import { useGetAllFilieres } from "@/service/orientationService";
import { useGetAllUsers } from "@/service/userService";
import { useGetAdhesionStats } from "@/service/adhesionService";
import { Skeleton } from "@/components/ui/skeleton";
import { IdentificationIcon, ClockIcon } from "@heroicons/react/24/outline";

const quickActions = [
  { href: "/admin/users/new",    label: "Nouvel utilisateur",  cls: "bg-amame-green hover:bg-amame-green-dark" },
  { href: "/admin/articles/new", label: "Nouvel article",      cls: "bg-blue-600 hover:bg-blue-700" },
  { href: "/admin/bourses/new",  label: "Nouvelle bourse",     cls: "bg-amame-gold hover:bg-yellow-600" },
  { href: "/admin/concours/new", label: "Nouveau concours",    cls: "bg-purple-600 hover:bg-purple-700" },
  { href: "/admin/adhesions",    label: "Gérer les adhésions", cls: "bg-teal-600 hover:bg-teal-700" },
];

const statColors = [
  "text-amame-green",
  "text-blue-600",
  "text-amame-gold",
  "text-purple-600",
  "text-orange-500",
  "text-teal-600",
  "text-yellow-600",
];

const Dashboard: React.FC = () => {
  const { data: bourseData, isLoading: bourseIsLoading } = useGetBourses({});
  const { data: articleData, isLoading: articleIsLoading } = useGetAllArticles();
  const { data: concoursData, isLoading: concoursIsLoading } = useConcoursLists({});
  const { data: filiereData, isLoading: filiereIsLoading } = useGetAllFilieres();
  const { data: userData, isLoading: userIsLoading } = useGetAllUsers();
  const { data: adhesionStats, isLoading: adhesionIsLoading } = useGetAdhesionStats();

  const stats = [
    { name: "Utilisateurs inscrits",  value: userIsLoading    ? null : userData?.totalElements ?? 0,     icon: UserGroupIcon,       href: "/admin/users" },
    { name: "Articles publiés",       value: articleIsLoading ? null : articleData?.totalElements ?? 0,  icon: NewspaperIcon,        href: "/admin/articles" },
    { name: "Bourses actives",        value: bourseIsLoading  ? null : bourseData?.totalElements ?? 0,   icon: AcademicCapIcon,      href: "/admin/bourses" },
    { name: "Concours en cours",      value: concoursIsLoading ? null : concoursData?.totalElements ?? 0, icon: TrophyIcon,          href: "/admin/concours" },
    { name: "Filières disponibles",   value: filiereIsLoading ? null : filiereData?.totalElements ?? 0,  icon: FolderIcon,           href: "/admin/filieres" },
    { name: "Membres adhérents",      value: adhesionIsLoading ? null : adhesionStats?.approved ?? 0,    icon: IdentificationIcon,   href: "/admin/adhesions" },
    { name: "Adhésions en attente",   value: adhesionIsLoading ? null : adhesionStats?.pending ?? 0,     icon: ClockIcon,            href: "/admin/adhesions?status=PENDING" },
  ];

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <h1 className="font-nunito font-black text-2xl text-amame-charcoal">Tableau de bord</h1>
        <p className="text-sm text-amame-muted mt-1">Vue d'ensemble de la plateforme AMAME</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-4 mb-8">
        {stats.map((item, i) => (
          <Link
            key={item.name}
            to={item.href}
            className="bg-white rounded-xl border border-amame-border shadow-card hover:shadow-card-hover hover:-translate-y-0.5 transition-all duration-200 p-4 group"
          >
            <div className="flex items-start justify-between mb-3">
              <div className="p-2 bg-gray-50 rounded-lg group-hover:bg-amame-green-subtle transition-colors">
                <item.icon className="h-5 w-5 text-amame-muted group-hover:text-amame-green transition-colors" />
              </div>
            </div>
            {item.value === null ? (
              <Skeleton className="h-8 w-16 rounded-md mb-1" />
            ) : (
              <p className={`font-nunito font-black text-2xl ${statColors[i]} mb-0.5`}>{item.value}</p>
            )}
            <p className="text-xs text-amame-muted leading-tight">{item.name}</p>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Quick actions */}
        <div className="bg-white rounded-xl border border-amame-border shadow-card p-6">
          <h3 className="font-nunito font-bold text-base text-amame-charcoal mb-4">Actions rapides</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {quickActions.map(({ href, label, cls }) => (
              <Link
                key={href}
                to={href}
                className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white transition-all ${cls} shadow-sm hover:shadow-md`}
              >
                <PlusIcon className="h-4 w-4 shrink-0" />
                {label}
              </Link>
            ))}
          </div>
        </div>

        {/* Navigation rapide */}
        <div className="bg-white rounded-xl border border-amame-border shadow-card p-6">
          <h3 className="font-nunito font-bold text-base text-amame-charcoal mb-4">Navigation rapide</h3>
          <div className="space-y-2">
            {stats.slice(0, 4).map((item, i) => (
              <Link
                key={item.name}
                to={item.href}
                className="flex items-center justify-between p-3 rounded-xl hover:bg-amame-green-subtle hover:text-amame-green transition-all group"
              >
                <div className="flex items-center gap-3">
                  <item.icon className="h-4 w-4 text-amame-muted group-hover:text-amame-green" />
                  <span className="text-sm font-medium text-amame-slate group-hover:text-amame-green">{item.name}</span>
                </div>
                <span className={`font-bold text-sm ${statColors[i]}`}>{item.value ?? "—"}</span>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
