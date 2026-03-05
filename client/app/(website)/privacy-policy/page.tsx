const PrivacyPolicy = () => {
  const lastUpdated = new Date().toLocaleDateString();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Main Content */}
      <main className="max-w-3xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="bg-white shadow rounded-lg p-6 sm:p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">Privacy Policy</h1>
          <p className="text-sm text-gray-600 mb-8">Last Updated: {lastUpdated}</p>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Introduction</h2>
            <p className="text-gray-700 mb-4">
              This privacy policy describes how Chic & Holland ("we", "us", or "our")
              collects and processes information through our website and administrative system.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Information We Collect</h2>

            <h3 className="text-lg font-medium text-gray-900 mb-2">Website Visitors</h3>
            <ul className="list-disc pl-5 mb-4 text-gray-700">
              <li className="mb-2">Basic usage data necessary for website functionality</li>
              <li className="mb-2">Any information voluntarily provided through contact forms or product inquiries</li>
            </ul>

            <h3 className="text-lg font-medium text-gray-900 mb-2">Administrative System</h3>
            <ul className="list-disc pl-5 mb-4 text-gray-700">
              <li className="mb-2">Business data imported from QuickBooks Online, specifically:</li>
              <li className="ml-4 mb-2">Customer information for internal business operations</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">How We Use Information</h2>

            <h3 className="text-lg font-medium text-gray-900 mb-2">Website Information</h3>
            <ul className="list-disc pl-5 mb-4 text-gray-700">
              <li className="mb-2">To provide and improve our website services</li>
              <li className="mb-2">To respond to inquiries and customer service requests</li>
            </ul>

            <h3 className="text-lg font-medium text-gray-900 mb-2">QuickBooks Data</h3>
            <ul className="list-disc pl-5 mb-4 text-gray-700">
              <li className="mb-2">Used solely for internal business operations</li>
              <li className="mb-2">Accessed only by authorized personnel through secure admin panel</li>
              <li className="mb-2">Never shared with or sold to third parties</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Data Security</h2>
            <p className="text-gray-700 mb-4">
              We implement appropriate security measures to protect your information, including:
            </p>
            <ul className="list-disc pl-5 mb-4 text-gray-700">
              <li className="mb-2">Secure, password-protected access to administrative functions</li>
              <li className="mb-2">Encrypted data transmission</li>
              <li className="mb-2">Regular security updates and monitoring</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Contact Us</h2>
            <p className="text-gray-700 mb-4">
              For questions about your data or this privacy policy, please contact us at:
            </p>
            <div className="bg-gray-50 rounded p-4 text-gray-700">
              <p className="mb-2">Email: info@chicandholland.com</p>
              <p className="mb-2">Phone: +31621422813, +3375609484</p>
              <p>Address: Jonkheer Carel Sternplein 33, 2273 WZ Voorburg, Netherlands</p>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Changes to This Policy</h2>
            <p className="text-gray-700">
              We may update this privacy policy from time to time. Any changes will be posted on this page.
            </p>
          </section>
        </div>
      </main>
    </div>
  );
};

export default PrivacyPolicy;