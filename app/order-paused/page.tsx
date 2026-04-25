import NavBar from '@/components/NavBar';
import Footer from '@/components/Footer';

export default function OrderPausedPage() {
  return (
    <div className="min-h-screen scroll-smooth bg-gradient-to-br from-light via-white to-light">
      <NavBar />
      <main className="mx-auto max-w-3xl px-6 py-14 sm:px-8 sm:py-20">
        <section className="rounded-2xl border border-rose-200/80 bg-rose-50/90 p-7 shadow-[0_10px_28px_rgba(28,26,24,0.08)] sm:p-9">
          <div className="mb-4 inline-flex items-center rounded-full border border-rose-300/70 bg-white/80 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-rose-800">
            Ordering is currently paused
          </div>
          <h1 className="text-3xl font-black text-stone-900 sm:text-4xl">
            Ordering is temporarily paused
          </h1>
          <p className="mt-4 text-base leading-relaxed text-stone-700">
            We&apos;re not accepting orders right now. Please check back shortly.
          </p>
        </section>
      </main>
      <Footer />
    </div>
  );
}

