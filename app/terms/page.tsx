import NavBar from '../components/NavBar';
import Footer from '../components/Footer';

export default function TermsPage() {
  return (
    <div className="min-h-screen scroll-smooth bg-gradient-to-br from-light via-white to-light">
      <NavBar />
      <main className="max-w-4xl mx-auto px-6 sm:px-8 py-16 sm:py-24">
        <article className="rounded-2xl border border-stone-200/80 bg-white p-7 shadow-[0_8px_28px_rgba(28,26,24,0.08)] sm:p-10">
          <h1 className="mb-3 text-3xl font-black text-stone-900 sm:text-4xl">Terms &amp; Conditions</h1>
          <p className="mb-8 text-sm text-stone-600 sm:text-base">
            This placeholder terms page outlines baseline ordering and website terms for Another Bowl.
          </p>
          <div className="space-y-8 text-stone-700 leading-relaxed">
            <section>
              <h2 className="text-xl sm:text-2xl font-bold text-stone-900 mb-3">Ordering terms</h2>
              <p>
                By placing an order, you confirm that your details are accurate and that you are authorized
                to place the order. Availability, menu items, and pricing may change without notice.
              </p>
            </section>

            <section>
              <h2 className="text-xl sm:text-2xl font-bold text-stone-900 mb-3">Collection terms</h2>
              <p>
                Collection times are estimates and may vary based on kitchen demand. Customers are
                responsible for collecting orders promptly and verifying order details at pickup.
              </p>
            </section>

            <section>
              <h2 className="text-xl sm:text-2xl font-bold text-stone-900 mb-3">Payment terms</h2>
              <p>
                Payment processing and confirmation behavior may change as the live payment integration is
                introduced. Promotional discounts are subject to validation rules and may be revoked if
                misused.
              </p>
            </section>

            <section>
              <h2 className="text-xl sm:text-2xl font-bold text-stone-900 mb-3">Liability disclaimer</h2>
              <p>
                Another Bowl provides the website and ordering service on an as-available basis and is not
                liable for indirect losses, service interruptions, or delays beyond reasonable control.
              </p>
            </section>

            <section>
              <h2 className="text-xl sm:text-2xl font-bold text-stone-900 mb-3">Contact details</h2>
              <p>
                For terms-related questions, email us at{' '}
                <a href="mailto:anotherbowlipswich@gmail.com" className="text-primary font-semibold hover:underline">
                  anotherbowlipswich@gmail.com
                </a>
                .
              </p>
            </section>
          </div>
        </article>
      </main>
      <Footer />
    </div>
  );
}
