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
      <div className="absolute inset-0 bg-gradient-to-r from-ink/90 via-ink/80 to-brand-deep/80" />

      <div className="relative mx-auto max-w-6xl px-5 text-white">
        <div className="max-w-2xl">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-brand-amber">
            Smart vendor matching
          </p>
          <h2 className="mt-3 text-3xl font-light uppercase tracking-wide sm:text-4xl">
            Find the right vendors — matched by AI
          </h2>
          <p className="mt-4 text-white/75">
            Tell Bridal Team your style, budget and location. Our AI reads
            through the directory and recommends the vendors that actually fit
            your day — then helps you reach out.
          </p>
        </div>

        <ul className="mt-10 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {CATEGORIES.map((c) => (
            <li key={c}>
              <Link
                href="/vendors"
                className="block rounded-xl border border-white/15 bg-white/10 px-4 py-4 text-center text-sm font-medium backdrop-blur transition-colors hover:border-brand hover:bg-white/20"
              >
                {c}
              </Link>
            </li>
          ))}
        </ul>

        <Link
          href="/vendors"
          className="mt-10 inline-flex rounded-full bg-white px-8 py-3.5 text-sm font-semibold text-brand-dark shadow-glow transition-transform hover:-translate-y-0.5"
        >
          Match me with vendors
        </Link>
      </div>
    </section>
  );
}
