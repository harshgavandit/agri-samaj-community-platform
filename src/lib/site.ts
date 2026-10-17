export function siteOrigin() {
  const configured =
    process.env.APP_URL ||
    process.env.NEXT_PUBLIC_APP_URL ||
    "https://agri-samaj-community-platform.vercel.app";
  try {
    return new URL(configured).origin;
  } catch {
    return "https://agri-samaj-community-platform.vercel.app";
  }
}
