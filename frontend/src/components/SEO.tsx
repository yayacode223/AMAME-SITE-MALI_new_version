import { Helmet } from "react-helmet-async";

const SITE_NAME = "AMAME";
const BASE_URL  = "https://amame.ml";
const OG_IMAGE  = `${BASE_URL}/amame-uploads/amame-logo.webp`;

interface SEOProps {
  title: string;
  description: string;
  path?: string;          // ex: "/bourses" — pour construire canonical + og:url
  image?: string;         // URL absolue d'une image spécifique
  type?: "website" | "article";
  keywords?: string;
  noIndex?: boolean;      // true pour les pages admin/login
}

const SEO = ({
  title,
  description,
  path = "/",
  image = OG_IMAGE,
  type = "website",
  keywords,
  noIndex = false,
}: SEOProps) => {
  const fullTitle    = `${title} — ${SITE_NAME}`;
  const canonicalUrl = `${BASE_URL}${path}`;

  return (
    <Helmet>
      {/* ── Titre & méta de base ─────────────────────────────────────── */}
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      {keywords && <meta name="keywords" content={keywords} />}
      <meta name="robots" content={noIndex ? "noindex, nofollow" : "index, follow"} />
      <link rel="canonical" href={canonicalUrl} />

      {/* ── Open Graph ──────────────────────────────────────────────── */}
      <meta property="og:title"       content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:url"         content={canonicalUrl} />
      <meta property="og:type"        content={type} />
      <meta property="og:image"       content={image} />
      <meta property="og:site_name"   content={SITE_NAME} />
      <meta property="og:locale"      content="fr_ML" />

      {/* ── Twitter Card ─────────────────────────────────────────────── */}
      <meta name="twitter:card"        content="summary" />
      <meta name="twitter:title"       content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image"       content={image} />
    </Helmet>
  );
};

export default SEO;
