import Link from "next/link";
export default function NotFound() {
  return (
    <section className="max-w-xl mx-auto p-12 text-center space-y-5">
      <p className="text-amber-700 font-bold">404</p>
      <h1 className="text-3xl font-bold">पृष्ठ सापडले नाही / Page not found</h1>
      <Link
        className="inline-block rounded-lg bg-navy-950 text-white p-3"
        href="/"
      >
        मुख्यपृष्ठ / Return home
      </Link>
    </section>
  );
}
