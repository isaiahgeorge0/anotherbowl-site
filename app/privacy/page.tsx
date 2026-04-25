import NavBar from '../components/NavBar';
import Footer from '../components/Footer';

export default function PrivacyPage() {
  return (
    <div className="min-h-screen scroll-smooth bg-gradient-to-br from-light via-white to-light">
      <NavBar />
      <main className="max-w-4xl mx-auto px-6 sm:px-8 py-16 sm:py-24">
        <article className="rounded-2xl border border-stone-200/80 bg-white p-7 shadow-[0_8px_28px_rgba(28,26,24,0.08)] sm:p-10">
          <h1 className="mb-3 text-3xl font-black text-stone-900 sm:text-4xl">Privacy Policy</h1>
          <p className="mb-8 text-sm text-stone-600 sm:text-base">
            This placeholder privacy policy explains how Another Bowl collects, uses, and stores customer
            information for website and order operations.
          </p>
          <div className="space-y-8 text-stone-700 leading-relaxed">
            <section>
              <h2 className="text-xl sm:text-2xl font-bold text-stone-900 mb-3">Information we collect</h2>
              <p>
                We may collect details you provide when placing an order, such as your name, phone
                number, email address, order details, and optional preferences. We may also collect basic
                technical website usage information for security and performance.
              </p>
            </section>

            <section>
              <h2 className="text-xl sm:text-2xl font-bold text-stone-900 mb-3">How we use your information</h2>
              <p>
                We use customer information to process and manage orders, provide support, improve service
                quality, and maintain platform security. We do not sell personal data to third parties.
              </p>
            </section>

            <section>
              <h2 className="text-xl sm:text-2xl font-bold text-stone-900 mb-3">Email communication</h2>
              <p>
                If you opt in, we may send occasional updates, offers, or service announcements. You can
                unsubscribe from marketing emails at any time using the unsubscribe instructions in each
                message.
              </p>
            </section>

            <section>
              <h2 className="text-xl sm:text-2xl font-bold text-stone-900 mb-3">Data retention</h2>
              <p>
                We retain order and account-related data only for as long as needed for business
                operations, legal obligations, or service improvement, then securely delete or anonymize
                it where appropriate.
              </p>
            </section>

            <section>
              <h2 className="text-xl sm:text-2xl font-bold text-stone-900 mb-3">Contact information</h2>
              <p>
                For privacy-related questions, email us at{' '}
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
