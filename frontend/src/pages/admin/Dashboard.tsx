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
const Dashboard: React.FC = () => {
  const { data: bourseData, isLoading: bourseIsLoading } = useGetBourses({});
  const { data: articleData, isLoading: articleIsLoading } =
    useGetAllArticles();
  const { data: concoursData, isLoading: concoursIsLoading } = useConcoursLists(
    {},
  );
  const { data: filiereData, isLoading: filiereIsLoading } =
    useGetAllFilieres();
  const { data: userData, isLoading: userIsLoading } = useGetAllUsers();

  const stats = [
    {
      name: "Utilisateurs inscrits",
      value: userIsLoading ? "Aucun" : userData?.length,
      icon: UserGroupIcon,
      href: "/admin/users",
    },
    {
      name: "Articles publiés",
      value: articleIsLoading ? "Aucun" : articleData?.length,
      icon: NewspaperIcon,
      href: "/admin/articles",
    },
    {
      name: "Bourses actives",
      value: bourseIsLoading ? "Aucun" : bourseData?.totalElements,
      icon: AcademicCapIcon,
      href: "/admin/bourses",
    },
    {
      name: "Concours en cours",
      value: concoursIsLoading ? "Aucun" : concoursData?.totalElements,
      icon: TrophyIcon,
      href: "/admin/concours",
    },
    {
      name: "Filières disponibles",
      value: filiereIsLoading ? "Aucun" : filiereData?.length,
      icon: FolderIcon,
      href: "/admin/filieres",
    },
  ];

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-gray-900">
          Tableau de bord
        </h1>
        <p className="mt-2 text-sm text-gray-700">
          Vue d'ensemble de la plateforme AMAME
        </p>
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        {stats.map((item) => (
          <Link
            key={item.name}
            to={item.href}
            className="bg-white overflow-hidden shadow rounded-lg hover:shadow-md transition-shadow duration-200"
          >
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <item.icon className="h-8 w-8 text-gray-800" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-800 truncate">
                      {item.name}
                    </dt>
                    <dd className="flex items-baseline">
                      <div
                        className={`text-2xl font-semibold ${
                          item.icon === NewspaperIcon
                            ? "text-blue-600"
                            : item.icon === AcademicCapIcon
                              ? "text-green-600"
                              : item.icon === TrophyIcon
                                ? "text-purple-600"
                                : item.icon === FolderIcon
                                  ? "text-orange-600"
                                  : "text-indigo-800"
                        }`}
                      >
                        {item.value}
                      </div>
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Actions rapides */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
              Actions rapides
            </h3>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Link
                to="/admin/users/new"
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                <PlusIcon className="h-4 w-4 mr-2" />
                Nouvel utilisateur
              </Link>

              <Link
                to="/admin/articles/new"
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <PlusIcon className="h-4 w-4 mr-2" />
                Nouvel article
              </Link>

              <Link
                to="/admin/bourses/new"
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
              >
                <PlusIcon className="h-4 w-4 mr-2" />
                Nouvelle bourse
              </Link>

              <Link
                to="/admin/concours/new"
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
              >
                <PlusIcon className="h-4 w-4 mr-2" />
                Nouveau concours
              </Link>

              <Link
                to="/admin/filieres/new"
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-orange-600 hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500"
              >
                <PlusIcon className="h-4 w-4 mr-2" />
                Nouvelle filière
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
