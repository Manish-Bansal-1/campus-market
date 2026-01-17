import { Helmet } from "react-helmet-async";

const SITE_NAME = "Campus Market";
const SITE_URL = "https://campusmarks.vercel.app";
const DEFAULT_DESC =
  "Campus Market - Buy & Sell items within your campus. Chat instantly, post listings, and get notifications.";
const DEFAULT_OG_IMAGE = `${SITE_URL}/og-image.png`;

export default function SEO({
  title = SITE_NAME,
  description = DEFAULT_DESC,
  url = SITE_URL,
  image = DEFAULT_OG_IMAGE,
}) {
  const fullTitle = title === SITE_NAME ? SITE_NAME : `${title} | ${SITE_NAME}`;

  return (
    <Helmet>
      <title>{fullTitle}</title>

      {/* Basic SEO */}
      <meta name="description" content={description} />
      <link rel="canonical" href={url} />

      {/* Open Graph */}
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:type" content="website" />
      <meta property="og:url" content={url} />
      <meta property="og:site_name" content={SITE_NAME} />
      <meta property="og:image" content={image} />

      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={image} />
    </Helmet>
  );
}
