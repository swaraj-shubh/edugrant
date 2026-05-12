"use client";
import { useEffect, useRef } from 'react';
import Link from 'next/link';
import { motion, useAnimation, useInView } from 'framer-motion';
import Image from 'next/image';

// Scroll animation wrapper
const AnimatedSection = ({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) => {
  const controls = useAnimation();
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, amount: 0.2 });

  useEffect(() => {
    if (inView) {
      controls.start('visible');
    }
  }, [controls, inView]);

  return (
    <motion.div
      ref={ref}
      initial="hidden"
      animate={controls}
      variants={{
        hidden: { opacity: 0, y: 50 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.6, delay } }
      }}
    >
      {children}
    </motion.div>
  );
};

export default function Home() {
  return (
    <main className="min-h-screen bg-[#FDFCF8] overflow-x-hidden">
      {/* Hero Section */}
      <section className="relative pt-20 pb-32 px-4 sm:px-6 lg:px-8 overflow-hidden">
        {/* Background Icon – large, faded, centered */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="relative w-full h-full max-w-6xl mx-auto">
            <div className="absolute inset-0 flex items-center justify-center">
              <Image
                src="/icon2.png"
                alt=""
                width={800}
                height={800}
                className="opacity-[0.08] blur-sm scale-150 object-contain"
                priority
              />
            </div>
          </div>
        </div>

        {/* Decorative background blobs – kept but optional */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-[#A38A63]/10 rounded-full blur-3xl" />
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-[#7A9C59]/10 rounded-full blur-3xl" />
          <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-[#EBDDCB]/20 rounded-full blur-3xl" />
        </div>

        <div className="max-w-6xl mx-auto relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center"
          >
            {/* Small animated icon (optional, remove if you want only background) */}
            <div className="flex justify-center mb-6">
              <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: "spring", stiffness: 260, damping: 20 }}
                className="relative"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-[#A38A63]/20 to-[#7A9C59]/20 rounded-full blur-xl" />
                <Image
                  src="/icon2.png"
                  alt="EduGrant Icon"
                  width={80}
                  height={80}
                  className="relative z-10 drop-shadow-lg"
                />
              </motion.div>
            </div>

            <div className="inline-flex items-center gap-2 bg-white/60 backdrop-blur-sm border border-[#EBE6E0] rounded-full px-4 py-1.5 mb-6 shadow-sm">
              <span className="w-2 h-2 rounded-full bg-[#7A9C59] animate-pulse"></span>
              <span className="text-xs font-medium text-[#5C7A43]">Blockchain Powered · Fraud Proof</span>
            </div>
            
            <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight text-[#4A4238] mb-6">
              Smart Wallet for
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#A38A63] to-[#7A9C59] block mt-2">
                Educational Grants
              </span>
            </h1>
            
            <p className="text-xl text-[#8C8276] max-w-2xl mx-auto mb-10 leading-relaxed">
              EduGrant replaces broken trust with smart contracts. Programmable wallets ensure every rupee reaches the right student & university — instantly, transparently, and fraud‑free.
            </p>
            
            <div className="flex flex-wrap justify-center gap-4">
              <Link href="/donor">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.98 }}
                  className="px-8 py-4 bg-[#A38A63] text-white font-bold rounded-xl shadow-lg shadow-[#A38A63]/20 hover:bg-[#8F7856] transition-all"
                >
                  Become a Donor
                </motion.button>
              </Link>
              <Link href="/student">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.98 }}
                  className="px-8 py-4 bg-white text-[#4A4238] font-bold rounded-xl border border-[#EBE6E0] shadow-sm hover:bg-[#F5F0E6] transition-all"
                >
                  I'm a Student
                </motion.button>
              </Link>
            </div>
          </motion.div>

          {/* Animated stats / trust badges */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.6 }}
            className="flex flex-wrap justify-center gap-8 mt-20 pt-8 border-t border-[#EBE6E0]"
          >
            <div className="text-center">
              <div className="text-3xl font-black text-[#A38A63]">100%</div>
              <div className="text-sm text-[#8C8276]">On-Chain Transparency</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-black text-[#A38A63]">~0%</div>
              <div className="text-sm text-[#8C8276]">Middleman Fees</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-black text-[#A38A63]">Real‑time</div>
              <div className="text-sm text-[#8C8276]">Settlement</div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white border-t border-[#EBE6E0]">
        <div className="max-w-6xl mx-auto">
          <AnimatedSection>
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-extrabold text-[#4A4238] mb-4">How EduGrant Works</h2>
              <p className="text-[#8C8276] max-w-2xl mx-auto">A frictionless ecosystem for donors, students, and educational vendors.</p>
            </div>
          </AnimatedSection>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                ),
                title: "Donor Funding",
                desc: "Donors lock USDC into the smart contract, directly funding a student's wallet. No middlemen, no delays.",
                color: "bg-[#F5F0E6]",
                textColor: "text-[#A38A63]"
              },
              {
                icon: (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 14l9-5-9-5-9 5 9 5z" />
                ),
                title: "Student Spending",
                desc: "Students can spend approved grants only at verified vendors (universities, bookstores, etc.).",
                color: "bg-[#EDF2EA]",
                textColor: "text-[#5C7A43]"
              },
              {
                icon: (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                ),
                title: "Admin Oversight",
                desc: "Admins whitelist vendors and revoke allowances if needed — full control with transparency.",
                color: "bg-[#FDF6ED]",
                textColor: "text-[#C28C53]"
              }
            ].map((feature, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1, duration: 0.5 }}
                viewport={{ once: true }}
                whileHover={{ y: -8, transition: { duration: 0.2 } }}
                className="bg-[#FAFAF7] p-8 rounded-2xl border border-[#EBE6E0] shadow-sm hover:shadow-md transition-all"
              >
                <div className={`${feature.color} w-14 h-14 rounded-xl flex items-center justify-center mb-5`}>
                  <svg className={`w-7 h-7 ${feature.textColor}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    {feature.icon}
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-[#4A4238] mb-2">{feature.title}</h3>
                <p className="text-[#8C8276] leading-relaxed">{feature.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Steps */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-[#FDFCF8]">
        <div className="max-w-6xl mx-auto">
          <AnimatedSection>
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-extrabold text-[#4A4238] mb-4">Simple, Secure, On-Chain</h2>
              <p className="text-[#8C8276]">Four steps to transform education funding</p>
            </div>
          </AnimatedSection>

          <div className="relative">
            {/* Connecting line (desktop) */}
            <div className="hidden md:block absolute top-1/2 left-0 w-full h-0.5 bg-[#EBE6E0] -translate-y-1/2 z-0" />
            <div className="grid md:grid-cols-4 gap-6 relative z-10">
              {[
                { step: "1", title: "Connect Wallet", desc: "Donor or student connects MetaMask", icon: "M15 5v2m0 4v2m-6-4h6" },
                { step: "2", title: "Fund / Request", desc: "Donor funds student; or student requests grant", icon: "M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" },
                { step: "3", title: "Whitelist Vendors", desc: "Admin approves trusted shops", icon: "M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" },
                { step: "4", title: "Spend Grant", desc: "Student pays vendor using allowance", icon: "M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" }
              ].map((item, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, scale: 0.9 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  transition={{ delay: idx * 0.1 }}
                  viewport={{ once: true }}
                  className="bg-white rounded-2xl border border-[#EBE6E0] p-6 text-center shadow-sm hover:shadow-md transition"
                >
                  <div className="w-12 h-12 bg-[#F5F0E6] rounded-full flex items-center justify-center mx-auto mb-4 text-xl font-bold text-[#A38A63]">
                    {item.step}
                  </div>
                  <h3 className="font-bold text-[#4A4238] mb-1">{item.title}</h3>
                  <p className="text-sm text-[#8C8276]">{item.desc}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <motion.section
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-[#4A4238] to-[#2A251E] text-white"
      >
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-extrabold mb-4">Ready to change the future of education?</h2>
          <p className="text-[#D6CEC4] text-lg mb-8">Join EduGrant today — donate, receive, or administer grants with complete transparency.</p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link href="/donor">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.98 }}
                className="px-8 py-4 bg-white text-[#4A4238] font-bold rounded-xl shadow-lg hover:bg-[#F5F0E6] transition-all"
              >
                Start Donating
              </motion.button>
            </Link>
            <Link href="/admin">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.98 }}
                className="px-8 py-4 bg-transparent border border-white text-white font-bold rounded-xl hover:bg-white/10 transition-all"
              >
                Admin Portal
              </motion.button>
            </Link>
          </div>
        </div>
      </motion.section>

      {/* Footer */}
      <footer className="py-10 text-center text-sm text-[#8C8276] border-t border-[#EBE6E0] bg-white">
        <p>© 2025 EduGrant – Smart Scholarship Wallet | Powered by Sepolia Testnet</p>
        <p className="mt-1">Secure, transparent, and built for the future of education.</p>
      </footer>
    </main>
  );
}