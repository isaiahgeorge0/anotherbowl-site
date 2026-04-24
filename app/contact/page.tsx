'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import NavBar from '../components/NavBar';
import Footer from '../components/Footer';

type FormErrors = {
  name?: string;
  email?: string;
  message?: string;
};

const HOURS = [
  { day: 'Monday', hours: '7:00am-3:00pm' },
  { day: 'Tuesday', hours: '7:00am-3:00pm' },
  { day: 'Wednesday', hours: '7:00am-3:00pm' },
  { day: 'Thursday', hours: '7:00am-3:00pm' },
  { day: 'Friday', hours: '7:00am-3:00pm' },
  { day: 'Saturday', hours: '8:00am-2:00pm' },
  { day: 'Sunday', hours: 'Closed' },
];

const DAY_ORDER = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const CONTACT_EMAIL = 'placeholder@anotherbowl.com';

export default function ContactPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [errors, setErrors] = useState<FormErrors>({});

  const today = useMemo(() => DAY_ORDER[new Date().getDay()], []);

  const validateEmail = (value: string) => /\S+@\S+\.\S+/.test(value);

  const validateForm = () => {
    const nextErrors: FormErrors = {};

    if (!name.trim()) nextErrors.name = 'Name is required.';
    if (!email.trim()) {
      nextErrors.email = 'Email is required.';
    } else if (!validateEmail(email)) {
      nextErrors.email = 'Enter a valid email address.';
    }
    if (!message.trim()) nextErrors.message = 'Message is required.';

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!validateForm()) return;

    const subject = encodeURIComponent(`Contact enquiry from ${name.trim()}`);
    const body = encodeURIComponent(
      `Name: ${name.trim()}\nEmail: ${email.trim()}\n\nMessage:\n${message.trim()}`
    );
    window.location.href = `mailto:${CONTACT_EMAIL}?subject=${subject}&body=${body}`;
  };

  return (
    <div className="min-h-screen scroll-smooth bg-gradient-to-br from-light via-white to-light">
      <NavBar />
      <main className="max-w-4xl mx-auto px-6 sm:px-8 py-16 sm:py-24">
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-8 sm:p-10">
          <h1 className="text-3xl sm:text-4xl font-black text-gray-900 mb-4">Contact Hub</h1>
          <p className="text-gray-600 mb-8">
            Reach out, plan your visit, or send us a quick message. We would love to hear from you.
          </p>

          <div className="grid grid-cols-1 gap-6 sm:gap-8">
            <section className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 sm:p-8">
              <h2 className="text-2xl font-black text-gray-900 mb-5">Address</h2>
              <div className="space-y-4 text-gray-700">
                <div className="flex items-start gap-3">
                  <span className="inline-flex items-center justify-center w-9 h-9 rounded-full bg-primary/10 text-primary">
                    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                      <path d="M12 2a5 5 0 00-5 5v1H6a2 2 0 00-2 2v9a2 2 0 002 2h12a2 2 0 002-2v-9a2 2 0 00-2-2h-1V7a5 5 0 00-5-5zm3 6H9V7a3 3 0 016 0v1z" />
                    </svg>
                  </span>
                  <div>
                    <p className="font-semibold text-gray-900">Cafe Name</p>
                    <p>Another Bowl</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <span className="inline-flex items-center justify-center w-9 h-9 rounded-full bg-primary/10 text-primary">
                    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                      <path d="M12 2a7 7 0 00-7 7c0 5.25 7 13 7 13s7-7.75 7-13a7 7 0 00-7-7zm0 9.5A2.5 2.5 0 1112 6a2.5 2.5 0 010 5.5z" />
                    </svg>
                  </span>
                  <div>
                    <p className="font-semibold text-gray-900">Address</p>
                    <p>[Insert placeholder cafe address for now]</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <span className="inline-flex items-center justify-center w-9 h-9 rounded-full bg-primary/10 text-primary">
                    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                      <path d="M6.62 10.79a15.53 15.53 0 006.59 6.59l2.2-2.2a1 1 0 011-.24c1.12.37 2.32.56 3.59.56a1 1 0 011 1V21a1 1 0 01-1 1C11.85 22 2 12.15 2 1a1 1 0 011-1h3.5a1 1 0 011 1c0 1.27.19 2.47.56 3.59a1 1 0 01-.24 1l-2.2 2.2z" />
                    </svg>
                  </span>
                  <div>
                    <p className="font-semibold text-gray-900">Phone</p>
                    <p>[Insert placeholder phone]</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <span className="inline-flex items-center justify-center w-9 h-9 rounded-full bg-primary/10 text-primary">
                    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                      <path d="M20 4H4a2 2 0 00-2 2v.22l10 6.25 10-6.25V6a2 2 0 00-2-2zm2 4.78l-9.47 5.92a1 1 0 01-1.06 0L2 8.78V18a2 2 0 002 2h16a2 2 0 002-2V8.78z" />
                    </svg>
                  </span>
                  <div>
                    <p className="font-semibold text-gray-900">Email</p>
                    <p>[Insert placeholder email]</p>
                  </div>
                </div>
              </div>
            </section>

            <section className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 sm:p-8">
              <h2 className="text-2xl font-black text-gray-900 mb-5">Opening Hours</h2>
              <ul className="space-y-2">
                {HOURS.map((entry) => {
                  const isToday = entry.day === today;
                  return (
                    <li
                      key={entry.day}
                      className={`flex items-center justify-between rounded-lg px-3 py-2 ${
                        isToday ? 'bg-primary/10 text-gray-900' : 'text-gray-700'
                      }`}
                    >
                      <span className={`font-medium ${isToday ? 'font-bold' : ''}`}>
                        {entry.day}
                        {isToday ? ' (Today)' : ''}
                      </span>
                      <span className={`text-sm sm:text-base ${isToday ? 'font-bold' : ''}`}>
                        {entry.hours}
                      </span>
                    </li>
                  );
                })}
              </ul>
            </section>

            <section className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 sm:p-8">
              <h2 className="text-2xl font-black text-gray-900 mb-5">Find Us</h2>
              <div className="relative w-full overflow-hidden rounded-xl border border-gray-200">
                <div className="w-full aspect-[16/9]">
                  <iframe
                    title="Another Bowl map location"
                    src="https://www.google.com/maps?q=Ipswich&output=embed"
                    className="w-full h-full"
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                  />
                </div>
              </div>
            </section>

            <section className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 sm:p-8">
              <h2 className="text-2xl font-black text-gray-900 mb-5">Send Us a Message</h2>
              <form className="space-y-4" onSubmit={handleSubmit} noValidate>
                <div>
                  <label htmlFor="name" className="block text-sm font-semibold text-gray-900 mb-2">
                    Name
                  </label>
                  <input
                    id="name"
                    name="name"
                    type="text"
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    className="w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary"
                    aria-invalid={Boolean(errors.name)}
                    aria-describedby={errors.name ? 'name-error' : undefined}
                    required
                  />
                  {errors.name && (
                    <p id="name-error" className="text-sm text-red-600 mt-1">
                      {errors.name}
                    </p>
                  )}
                </div>

                <div>
                  <label htmlFor="email" className="block text-sm font-semibold text-gray-900 mb-2">
                    Email
                  </label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    className="w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary"
                    aria-invalid={Boolean(errors.email)}
                    aria-describedby={errors.email ? 'email-error' : undefined}
                    required
                  />
                  {errors.email && (
                    <p id="email-error" className="text-sm text-red-600 mt-1">
                      {errors.email}
                    </p>
                  )}
                </div>

                <div>
                  <label htmlFor="message" className="block text-sm font-semibold text-gray-900 mb-2">
                    Message
                  </label>
                  <textarea
                    id="message"
                    name="message"
                    rows={5}
                    value={message}
                    onChange={(event) => setMessage(event.target.value)}
                    className="w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary"
                    aria-invalid={Boolean(errors.message)}
                    aria-describedby={errors.message ? 'message-error' : undefined}
                    required
                  />
                  {errors.message && (
                    <p id="message-error" className="text-sm text-red-600 mt-1">
                      {errors.message}
                    </p>
                  )}
                </div>

                <button
                  type="submit"
                  className="inline-flex items-center justify-center px-6 py-3 rounded-xl font-bold text-white bg-gradient-to-r from-brandPink to-brandGreen hover:from-brandPink/90 hover:to-brandGreen/90 transition-all duration-300 shadow-md hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brandPink/50"
                >
                  Send Message
                </button>
              </form>
            </section>

            <section className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 sm:p-8">
              <h2 className="text-2xl font-black text-gray-900 mb-5">Follow Us</h2>
              <div className="flex flex-wrap items-center gap-4">
                <Link
                  href="https://instagram.com/another.bowl"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-3 px-4 py-3 rounded-xl border border-gray-200 hover:border-primary/40 bg-white hover:bg-primary/5 transition-colors duration-200"
                  aria-label="Visit our Instagram page"
                >
                  <svg className="w-5 h-5 text-primary" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069z" />
                  </svg>
                  <span className="font-semibold text-gray-800">Instagram</span>
                </Link>

                <Link
                  href="https://facebook.com/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-3 px-4 py-3 rounded-xl border border-gray-200 hover:border-primary/40 bg-white hover:bg-primary/5 transition-colors duration-200"
                  aria-label="Visit our Facebook page"
                >
                  <svg className="w-5 h-5 text-primary" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                    <path d="M22 12a10 10 0 10-11.56 9.88v-6.99H7.9V12h2.54V9.8c0-2.5 1.49-3.88 3.77-3.88 1.09 0 2.23.19 2.23.19v2.46h-1.25c-1.23 0-1.62.76-1.62 1.55V12h2.76l-.44 2.89h-2.32v6.99A10 10 0 0022 12z" />
                  </svg>
                  <span className="font-semibold text-gray-800">Facebook</span>
                </Link>
              </div>
            </section>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
