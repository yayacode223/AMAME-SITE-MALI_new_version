import React from "react";
import { Link } from "react-router-dom";
import { ArrowLeftIcon } from "@heroicons/react/24/outline";

interface FormWrapperProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  backUrl: string;
  isLoading?: boolean;
}

const FormWrapper: React.FC<FormWrapperProps> = ({
  title,
  subtitle,
  children,
  backUrl,
  isLoading = false,
}) => {
  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <Link
          to={backUrl}
          className="inline-flex items-center text-sm font-medium text-gray-500 hover:text-gray-700"
        >
          <ArrowLeftIcon className="h-4 w-4 mr-1" />
          Retour à la liste
        </Link>
      </div>

      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
          <h1 className="text-lg leading-6 font-medium text-gray-900">
            {title}
          </h1>
          {subtitle && <p className="mt-1 text-sm text-gray-500">{subtitle}</p>}
        </div>

        {isLoading ? (
          <div className="p-6">
            <div className="animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
              <div className="h-10 bg-gray-200 rounded mb-4"></div>
              <div className="h-10 bg-gray-200 rounded mb-4"></div>
              <div className="h-10 bg-gray-200 rounded"></div>
            </div>
          </div>
        ) : (
          <div className="px-4 py-5 sm:p-6">{children}</div>
        )}
      </div>
    </div>
  );
};

export default FormWrapper;
