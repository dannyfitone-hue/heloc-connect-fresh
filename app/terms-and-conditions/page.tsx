export default function Page() {
  return (
    <main className="min-h-screen bg-black text-white px-6 py-20">
      <div className="max-w-4xl mx-auto">
        <a href="/" className="text-sm text-gray-400 hover:text-white">← Back to Home</a>
        <h1 className="text-4xl md:text-5xl font-bold mt-8 mb-8">Terms & Conditions</h1>
        <div className="space-y-6 text-lg leading-8 text-gray-300">
          <p>By using the HELOC CONNECT platform, you agree to comply with all applicable laws and regulations related to your use of the website and financing inquiry services.</p>
          <p>HELOC CONNECT is not a direct lender and does not guarantee loan approval, rates, or funding terms. Financing options are subject to lender review, underwriting guidelines, property qualifications, and applicable regulations.</p>
          <p>Consumers are encouraged to carefully review all loan terms and disclosures provided by participating lending partners before entering into any financing agreement.</p>
        </div>
      </div>
    </main>
  );
}
