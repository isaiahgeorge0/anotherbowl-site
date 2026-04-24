import NavBar from '../components/NavBar';
import Footer from '../components/Footer';

export default function TermsPage() {
  return (
    <div className="min-h-screen scroll-smooth bg-gradient-to-br from-light via-white to-light">
      <NavBar />
      <main className="max-w-4xl mx-auto px-6 sm:px-8 py-16 sm:py-24">
        <article className="bg-white rounded-xl shadow-lg border border-gray-200 p-8 sm:p-10">
          <h1 className="text-3xl sm:text-4xl font-black text-gray-900 mb-6">Terms of Service</h1>
          <div className="space-y-8 text-gray-700 leading-relaxed">
            <section>
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-3">Website Use</h2>
              <p>
                By accessing this website, you agree to use it lawfully and in a way that does not
                interfere with the website, its content, or other visitors.
              </p>
            </section>

            <section>
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-3">
                Intellectual Property
              </h2>
              <p>
                All website content, including text, branding, and imagery, is owned by or licensed
                to Another Bowl unless stated otherwise. Reproduction or redistribution without
                permission is not allowed.
              </p>
            </section>

            <section>
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-3">
                Limitation of Liability
              </h2>
              <p>
                We aim to keep website information accurate and up to date, but we do not guarantee
                that all content will always be complete or error-free. Another Bowl is not liable
                for losses resulting from use of this website.
              </p>
            </section>

            <section>
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-3">Contact Details</h2>
              <p>
                For terms-related questions, email us at{' '}
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
