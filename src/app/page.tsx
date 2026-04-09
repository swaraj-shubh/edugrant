export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-8 bg-white">
      
      {/* Hero Section */}
      <div className="text-center max-w-4xl mx-auto">
        <div className="inline-block px-4 py-1.5 rounded-full border border-blue-200 bg-blue-50 text-blue-700 font-semibold text-sm mb-6">
          Hackathon Demo Live 🚀
        </div>
        
        <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight text-gray-900 mb-6">
          Fund the Future, <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-emerald-500">
            Fraud-Free.
          </span>
        </h1>
        
        <p className="text-xl text-gray-600 max-w-2xl mx-auto mb-10 leading-relaxed">
          EduGrant replaces broken trust with <strong>Smart Contracts</strong>. 
          Our programmable wallets ensure every rupee donated reaches the right university, instantly.
        </p>
        
        <div className="flex flex-col sm:flex-row justify-center gap-4">
          <button className="px-8 py-4 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition shadow-lg shadow-blue-200">
            Make a Donation (AI)
          </button>
          <button className="px-8 py-4 bg-white text-slate-700 border border-slate-200 rounded-xl font-bold hover:bg-slate-50 transition">
            Admin Dashboard
          </button>
        </div>
      </div>

      {/* Trust Badges */}
      <div className="mt-20 pt-10 border-t border-slate-100 w-full max-w-3xl flex justify-between items-center text-slate-400 font-medium">
        <span>Powered by Polygon</span>
        <span>Secured by Ethereum Escrow</span>
        <span>AI Intents by Gemini</span>
      </div>

    </main>
  );
}