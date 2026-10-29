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
      {/* Dark enough everywhere for white text. The photo is light on the
          right, where a 30% orange overlay used to wash out the copy and the
          category buttons; the deep burnt orange keeps the warmth at about
          10:1 contrast with white. */}
      <div className="absolute inset-0 bg-gradient-to-r from-ink/90 via-ink/85 to-[#4a2410]/85 backdrop-saturate-[.4]" />

      <div className="relative mx-auto max-w-6xl px-5 text-white">
        <div className="max-w-2xl">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-brand-amber">
            Find your team
          </p>
          <h2 className="mt-3 text-3xl font-light uppercase tracking-wide sm:text-4xl">
            Browse vendors, book with confidence
          </h2>
          <p className="mt-4 text-white/90">
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
                className="block rounded-xl border border-white/30 bg-ink/50 px-4 py-4 text-center text-sm font-semibold backdrop-blur transition-colors hover:border-brand hover:bg-ink/70"
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
