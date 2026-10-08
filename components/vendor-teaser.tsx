import Link from "next/link";

const CATEGORIES = [
  "Venues",
  "Photographers",
  "Florists",
  "Caterers",
  "DJs & Bands",
  "Cakes & Desserts",
  "Planners",
  "Beauty & Hair",
];

export default function VendorTeaser() {
  return (
    <section
      id="vendors"
      className="relative overflow-hidden bg-cover bg-center py-24"
      style={{ backgroundImage: "url('/brand/cat.jpg')" }}
    >
      <div className="absolute inset-0 bg-gradient-to-r from-brand-text/95 via-brand-text/90 to-brand-deep/90" />

      <div className="relative mx-auto max-w-6xl px-5 text-white">
        <div className="max-w-2xl">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-white">
            Find your team
          </p>
          <h2 className="mt-3 text-3xl font-light uppercase tracking-wide sm:text-4xl">
            Browse vendors, book with confidence
          </h2>
          <p className="mt-4 text-white">
            Browse by category and see real work before you reach out. Not sure
            where to start? Tell the AI planner your style, budget and city and
            it will tell you who to book first and what to ask them.
          </p>
        </div>

        <ul className="mt-10 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {CATEGORIES.map((c) => (
            <li key={c}>
              <Link
                href="/vendors"
                className="block rounded-xl border border-white/40 px-4 py-4 text-center text-sm font-medium transition-colors hover:border-white hover:bg-white hover:text-brand-text"
              >
                {c}
              </Link>
            </li>
          ))}
        </ul>

        <Link
          href="/vendors"
          className="mt-10 inline-flex rounded-full bg-white px-8 py-3.5 text-sm font-semibold text-brand-text shadow-glow transition-transform hover:-translate-y-0.5"
        >
          Match me with vendors
        </Link>
      </div>
    </section>
  );
}
