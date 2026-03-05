import React from 'react';

const TermsOfUse = () => {
  const lastUpdated = new Date().toLocaleDateString();

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="max-w-3xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="bg-white shadow rounded-lg p-6 sm:p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">Terms of Use</h1>
          <p className="text-sm text-gray-600 mb-8">Last Updated: {lastUpdated}</p>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">1. Agreement to Terms</h2>
            <p className="text-gray-700 mb-4">
              By accessing or using the website and services of Chic & Holland, you agree to be bound by these Terms of Use.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">2. Website Use</h2>
            <div className="text-gray-700 space-y-3">
              <p>As a visitor to our website, you agree to:</p>
              <ul className="list-disc pl-5 space-y-2">
                <li>Use the website only for lawful purposes</li>
                <li>Not attempt to access restricted areas of the website</li>
                <li>Not interfere with the website's functionality</li>
                <li>Accept that product information and availability are subject to change</li>
              </ul>
            </div>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">3. Product Information</h2>
            <p className="text-gray-700 mb-4">
              We strive to provide accurate product information but cannot guarantee the availability or price of any item. We reserve the right to modify information without notice.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">4. Authorized Access</h2>
            <div className="text-gray-700 space-y-3">
              <p>For authorized users of our administrative system:</p>
              <ul className="list-disc pl-5 space-y-2">
                <li>Access is restricted to authorized personnel only</li>
                <li>You must maintain the confidentiality of your login credentials</li>
                <li>You agree to use the system only for its intended business purposes</li>
                <li>You must comply with all applicable data protection regulations</li>
              </ul>
            </div>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">5. Data Usage</h2>
            <p className="text-gray-700 mb-4">
              Business data, including information from QuickBooks Online, is to be used solely for authorized business operations and in accordance with our Privacy Policy.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">6. Intellectual Property</h2>
            <p className="text-gray-700 mb-4">
              All content on this website is the property of Chic & Holland and is protected by copyright laws.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">7. Limitation of Liability</h2>
            <p className="text-gray-700 mb-4">
              Chic & Holland is not liable for any damages arising from the use or inability to use our website or services.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">8. Changes to Terms</h2>
            <p className="text-gray-700 mb-4">
              We reserve the right to modify these terms at any time. Continued use of the website or system constitutes acceptance of modified terms.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">9. Contact Information</h2>
            <p className="text-gray-700 mb-4">
              For questions about these terms, please contact:
            </p>
            <div className="bg-gray-50 rounded p-4 text-gray-700">
              <p className="mb-2">Chic & Holland</p>
              <p className="mb-2">Email: info@chicandholland.com</p>
              <p className="mb-2">Phone: +31621422813, +3375609484</p>
              <p>Address: Jonkheer Carel Sternplein 33, 2273 WZ Voorburg, Netherlands</p>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
};

export default TermsOfUse;