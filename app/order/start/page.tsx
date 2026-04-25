import Link from 'next/link';
import NavBar from '@/components/NavBar';
import Footer from '@/components/Footer';

const optionCardClass =
  'group block rounded-2xl border border-stone-200/80 bg-white p-6 shadow-[0_8px_24px_rgba(28,26,24,0.08)] transition-all duration-200 hover:-translate-y-0.5 hover:border-stone-300 hover:shadow-[0_12px_28px_rgba(28,26,24,0.12)] focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/35 focus-visible:ring-offset-2';

export default function OrderStartPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-light via-white/80 to-light">
      <NavBar />
      <main className="mx-auto max-w-4xl px-6 pb-16 pt-12 sm:px-8 sm:pt-16">
        <section className="rounded-2xl border border-stone-200/70 bg-light/90 p-6 shadow-[0_8px_32px_rgba(28,26,24,0.06)] sm:p-8">
          <h1 className="text-3xl font-black text-stone-900 sm:text-4xl">Start your order</h1>
          <p className="mt-3 max-w-2xl text-sm text-stone-600 sm:text-base">
            Choose how you want to place your order, then continue to the full menu.
          </p>

          <div className="mt-8 grid grid-cols-1 gap-4 sm:gap-5 md:grid-cols-2">
            <Link href="/order?type=collection" className={optionCardClass}>
              <div className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-stone-300/80 bg-stone-50 text-stone-700">
                <span aria-hidden>🛍️</span>
              </div>
              <h2 className="mt-4 text-xl font-bold text-stone-900">Collection</h2>
              <p className="mt-2 text-sm leading-relaxed text-stone-600">
                Order ahead and collect from the cafe.
              </p>
              <span className="mt-5 inline-flex items-center text-sm font-semibold text-stone-800">
                Continue
                <span className="ml-1 transition-transform duration-200 group-hover:translate-x-0.5">
                  →
                </span>
              </span>
            </Link>

            <Link href="/order?type=table" className={optionCardClass}>
              <div className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-stone-300/80 bg-stone-50 text-stone-700">
                <span aria-hidden>🍽️</span>
              </div>
              <h2 className="mt-4 text-xl font-bold text-stone-900">Table service</h2>
              <p className="mt-2 text-sm leading-relaxed text-stone-600">
                Order from your table while you&apos;re here.
              </p>
              <span className="mt-5 inline-flex items-center text-sm font-semibold text-stone-800">
                Continue
                <span className="ml-1 transition-transform duration-200 group-hover:translate-x-0.5">
                  →
                </span>
              </span>
            </Link>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
