import NavBar from '../components/NavBar';
import Footer from '../components/Footer';

export default function PrivacyPage() {
  return (
    <div className="min-h-screen scroll-smooth bg-gradient-to-br from-light via-white to-light">
      <NavBar />
      <main className="max-w-4xl mx-auto px-6 sm:px-8 py-16 sm:py-24">
        <article className="bg-white rounded-xl shadow-lg border border-gray-200 p-8 sm:p-10">
          <h1 className="text-3xl sm:text-4xl font-black text-gray-900 mb-6">Privacy Policy</h1>
          <div className="space-y-8 text-gray-700 leading-relaxed">
            <section>
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-3">Introduction</h2>
              <p>
                Another Bowl respects your privacy and is committed to protecting your personal
                information when you use our website.
              </p>
            </section>

            <section>
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-3">Data Collection</h2>
              <p>
                We may collect contact details you provide directly, such as your email address when
                you get in touch. We use this information only to respond to your enquiries and
                provide relevant updates about our services.
              </p>
            </section>

            <section>
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-3">Cookies</h2>
              <p>
                Our website may use essential cookies or similar technologies to support core site
                functionality and improve user experience. You can manage cookie preferences in your
                browser settings.
              </p>
            </section>

            <section>
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-3">
                Contact Information
              </h2>
              <p>
                For privacy-related questions, email us at{' '}
                <a href="mailto:anotherbowlipswich@gmail.com" className="text-primary hover:underline">
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
