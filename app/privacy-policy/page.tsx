export default function Page() {
  return (
    <main className="min-h-screen bg-black text-white px-6 py-20">
      <div className="max-w-4xl mx-auto">
        <a href="/" className="text-sm text-gray-400 hover:text-white">← Back to Home</a>
        <h1 className="text-4xl md:text-5xl font-bold mt-8 mb-8">Privacy Policy</h1>
        <div className="space-y-6 text-lg leading-8 text-gray-300">
          <p>HELOC CONNECT values your privacy and is committed to protecting your personal information.</p>
          <p>Information submitted through our platform may be used to connect consumers with participating lending partners, improve platform functionality, verify submitted information, and communicate regarding financing inquiries.</p>
          <p>We implement commercially reasonable security measures to help protect consumer data. HELOC CONNECT does not sell personal information to unrelated third parties.</p>
          <p>By using this website, you consent to the collection and use of information in accordance with this Privacy Policy.</p>
        </div>
      </div>
    </main>
  );
}
