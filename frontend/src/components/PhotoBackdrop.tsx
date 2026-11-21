import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import type { StaticImageName } from "@/generated/staticImages";
import StaticImage from "@/components/StaticImage";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

/*
 * Page « photo en fond + carte » : connexion, mot de passe oublié, adhésion (docs/06, R8).
 * La photo reste naturelle, sans voile : le texte est dans la carte blanche ; le seul texte posé sur
 * la photo, le lien de retour, a son cartouche sombre (.amame-photo-cartouche).
 */

/** Zone dont le fond est une photo. Une vraie image (srcset) plutôt qu'un fond CSS : un téléphone
 *  télécharge la version de 640 px, pas la plus grande. */
export const PhotoBackdrop = ({ image, className, children }: {
  image: StaticImageName;
  className?: string;
  children: ReactNode;
}) => (
  <div className={cn("relative isolate overflow-hidden", className)}>
    <StaticImage name={image} sizes="100vw" priority alt="" aria-hidden="true"
      className="absolute inset-0 -z-10 h-full w-full object-cover object-center" />
    {children}
  </div>
);

/** Au-dessus de la carte : lien de retour (blanc sur cartouche, plus foncé au survol) et logo. */
export const BackdropHeader = ({ to, label }: { to: string; label: string }) => (
  <div className="mb-6 flex items-center justify-between gap-3 sm:mb-8">
    <Button variant="ghost" asChild
      className="amame-photo-cartouche rounded-full text-sm text-white hover:bg-black/70 hover:text-white">
      <Link to={to}>
        <ArrowLeft className="mr-2 h-4 w-4" />
        {label}
      </Link>
    </Button>
    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-gray-100 bg-white shadow-sm">
      <img src="/logo-192.webp" alt="AMAME" className="h-7 w-7" />
    </div>
  </div>
);

/** Carte blanche posée sur la photo, liseré en haut : vert, ou rouge pour une erreur (lien invalide).
 *  La largeur se règle par className. */
export const BackdropCard = ({ className, accent = "green", children }: {
  className?: string;
  accent?: "green" | "red";
  children: ReactNode;
}) => (
  <Card className={cn("overflow-hidden rounded-2xl border-0 shadow-xl", className)}>
    <div aria-hidden="true" className={cn("h-1.5 w-full bg-gradient-to-r",
      accent === "red" ? "from-red-500 to-red-600" : "from-amame-green to-amame-green-dark")} />
    {children}
  </Card>
);

/** En-tête de la carte : pictogramme, titre de la page (h1) et phrase d'introduction. */
export const BackdropCardTitle = ({ icon, title, children }: {
  icon: ReactNode;
  title: string;
  children?: ReactNode;
}) => (
  <div className="flex flex-col items-center px-5 pt-6 text-center sm:px-8 sm:pt-8">
    <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-amame-green-subtle text-amame-green-dark">
      {icon}
    </div>
    <h1 className="font-nunito text-2xl font-black text-amame-charcoal">{title}</h1>
    {children && <p className="mt-1.5 text-sm leading-relaxed text-amame-muted">{children}</p>}
  </div>
);
