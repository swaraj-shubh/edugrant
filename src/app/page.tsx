"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion, useInView } from "framer-motion";
import Lenis from "@studio-freight/lenis";

/* ------------------------------------------------------------------
  Helper Components
------------------------------------------------------------------ */
const SplitHeading = ({ text, className = "", delay = 0 }: { text: string; className?: string; delay?: number }) => {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, amount: 0.4 });
  return (
    <h2 ref={ref} className={className}>
      {text.split(" ").map((word, i) => (
        <motion.span
          key={i}
          initial={{ opacity: 0, y: 60 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7, delay: delay + i * 0.08, ease: [0.22, 1, 0.36, 1] }}
          className="inline-block mr-[0.25em]"
        >
          {word}
        </motion.span>
      ))}
    </h2>
  );
};

const FadeUp = ({ children, delay = 0, className = "" }: { children: React.ReactNode; delay?: number; className?: string }) => {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, amount: 0.2 });
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 48 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.7, delay, ease: [0.22, 1, 0.36, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
};

const Stat = ({ value, label, subLabel }: { value: string; label: string; subLabel?: string }) => {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true });
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, scale: 0.8 }}
      animate={inView ? { opacity: 1, scale: 1 } : {}}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      className="text-center"
    >
      <div className="text-4xl md:text-5xl font-black text-[#A38A63] tracking-tight">{value}</div>
      <div className="text-sm text-[#8C8276] mt-1 font-medium tracking-wide uppercase">{subLabel || label}</div>
    </motion.div>
  );
};

/* ------------------------------------------------------------------
  Main Page Component
------------------------------------------------------------------ */
export default function HomePage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [loadedCount, setLoadedCount] = useState(0);
  const [currentFrame, setCurrentFrame] = useState(0);
  const TOTAL_FRAMES = 240;
  const imagesRef = useRef<HTMLImageElement[]>([]);
  const frameContext = useRef<CanvasRenderingContext2D | null>(null);

  /* -- Lenis Smooth Scroll -- */
  useEffect(() => {
    const lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      orientation: "vertical",
      smoothWheel: true,
    });

    function raf(time: number) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }
    requestAnimationFrame(raf);

    return () => {
      lenis.destroy();
    };
  }, []);

  /* -- Preload 240 frames -- */
  useEffect(() => {
    const imgs: HTMLImageElement[] = [];
    let loaded = 0;
    for (let i = 1; i <= TOTAL_FRAMES; i++) {
      const img = new window.Image();
      const num = String(i).padStart(4, "0");
      img.src = `/frame_${num}.png`;
      img.onload = () => {
        loaded++;
        setLoadedCount(loaded);
        if (loaded === 1 && frameContext.current && canvasRef.current) {
          drawFrame(img);
        }
      };
      imgs.push(img);
    }
    imagesRef.current = imgs;
  }, []);

  /* -- Setup canvas context & resize handler -- */
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    frameContext.current = ctx;

    const handleResize = () => {
      if (!canvas) return;
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      const img = imagesRef.current[currentFrame];
      if (img && img.complete) drawFrame(img);
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [currentFrame]);

  const drawFrame = useCallback((img: HTMLImageElement) => {
    const ctx = frameContext.current;
    const canvas = canvasRef.current;
    if (!ctx || !canvas) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    // cover the canvas while preserving aspect ratio
    const scale = Math.max(canvas.width / img.width, canvas.height / img.height);
    const x = (canvas.width - img.width * scale) / 2;
    const y = (canvas.height - img.height * scale) / 2;
    ctx.drawImage(img, x, y, img.width * scale, img.height * scale);
  }, []);

  /* -- Scroll → frame mapping -- */
  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY;
      const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
      const progress = Math.max(0, Math.min(1, scrollY / maxScroll));
      const frameIdx = Math.floor(progress * (TOTAL_FRAMES - 1));
      setCurrentFrame(frameIdx);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  /* -- Draw when currentFrame changes -- */
  useEffect(() => {
    const img = imagesRef.current[currentFrame];
    if (img && img.complete) {
      drawFrame(img);
    } else if (img) {
      img.onload = () => drawFrame(img);
    }
  }, [currentFrame, drawFrame]);

  const loadProgress = Math.round((loadedCount / TOTAL_FRAMES) * 100);

  return (
    <main className="relative bg-transparent" style={{ fontFamily: "'Cormorant Garamond', 'Georgia', serif" }}>
      {/* Global styles */}
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;0,700;1,400;1,600&family=DM+Sans:wght@300;400;500;600;700&display=swap');
        :root {
          --beige: #FDFCF8;
          --beige-mid: #F5F0E6;
          --sand: #EBE6E0;
          --warm-brown: #A38A63;
          --dark-brown: #4A4238;
          --muted: #8C8276;
          --green: #7A9C59;
          --green-dark: #5C7A43;
        }
        html { scroll-behavior: auto; background-color: #FDFCF8; }
        .dm { font-family: 'DM Sans', sans-serif; }
        .grain::after {
          content: '';
          position: fixed;
          inset: 0;
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 512 512' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.04'/%3E%3C/svg%3E");
          pointer-events: none;
          z-index: 9998;
          opacity: 0.3;
        }
        .card-glass {
          background: rgba(255,255,255,0.55);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border: 1px solid rgba(235,230,224,0.8);
        }
        .shimmer-text {
          background: linear-gradient(90deg, #A38A63 0%, #D4B896 40%, #A38A63 60%, #7A9C59 100%);
          background-size: 200% auto;
          -webkit-background-clip: text;
          background-clip: text;
          -webkit-text-fill-color: transparent;
          animation: shimmer 4s linear infinite;
        }
        @keyframes shimmer {
          0% { background-position: -200% center; }
          100% { background-position: 200% center; }
        }
        .marquee {
          display: flex;
          overflow: hidden;
          gap: 0;
        }
        .marquee-inner {
          display: flex;
          gap: 3rem;
          animation: marquee 20s linear infinite;
          white-space: nowrap;
        }
        @keyframes marquee {
          from { transform: translateX(0); }
          to { transform: translateX(-50%); }
        }
      `}</style>

      <div className="grain" />

      {/* FIXED BACKGROUND CANVAS */}
      <canvas
        ref={canvasRef}
        // className="fixed top-0 left-0 w-full h-full object-cover -z-10"
        className="fixed inset-0 w-full h-full z-0 pointer-events-none"
        style={{ opacity: loadedCount > 5 ? 1 : 0, transition: "opacity 0.5s" }}
      />

      {/* LOADING OVERLAY */}
      {/* {loadedCount < TOTAL_FRAMES && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 bg-white/80 backdrop-blur-md px-6 py-3 rounded-full shadow-lg dm text-sm">
          Loading frames… {loadProgress}%
          <div className="w-48 h-1 bg-[#EBE6E0] rounded-full mt-2 overflow-hidden">
            <div className="h-full bg-[#A38A63] rounded-full transition-all" style={{ width: `${loadProgress}%` }} />
          </div>
        </div>
      )} */}

      {/* SCROLLING CONTENT */}
      <div className="relative z-10">
        {/* HERO */}
        <div className="relative h-screen flex items-center justify-center text-center px-6 -mt-20 overflow-hidden">
          
          {/* White cinematic overlay */}
          <div
            className="absolute inset-0 z-0"
            style={{
              background: `
                radial-gradient(circle at center,
                  rgba(255,255,255,0.78) 0%,
                  rgba(255,255,255,0.62) 35%,
                  rgba(255,255,255,0.42) 60%,
                  rgba(255,255,255,0.18) 100%)
              `,
              backdropFilter: "blur(2px)",
            }}
          />          
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.3 }}
            className="relative z-10 max-w-4xl"
          >
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6, duration: 0.6 }}
              className="inline-flex items-center gap-2 mb-8 px-4 py-2 rounded-full dm"
              style={{ background: "rgba(255,255,255,0.7)", backdropFilter: "blur(12px)", border: "1px solid rgba(163,138,99,0.3)" }}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-[#7A9C59] animate-pulse" />
              <span className="text-xs font-semibold text-[#5C7A43] tracking-widest uppercase">Blockchain Powered · Fraud Proof</span>
            </motion.div>
            <div
              className="inline-block px-8 py-6 md:px-12 md:py-8 rounded-[2rem]"
              style={{
                background: "rgba(255,255,255,0.12)",
                backdropFilter: "blur(14px)",
                WebkitBackdropFilter: "blur(14px)",
                border: "1px solid rgba(255,255,255,0.18)",
                boxShadow: "0 8px 40px rgba(0,0,0,0.08)",
              }}
            >
              <h1
                className="text-6xl md:text-8xl lg:text-9xl font-bold tracking-tight text-[#4A4238] leading-[0.9]"
                style={{
                  textShadow: "0 2px 40px rgba(253,252,248,0.8)",
                }}
              >
                Smart Wallet
                <br />
                <span className="shimmer-text italic font-light">
                  for Education
                </span>
              </h1>
            </div>
            <p className="text-lg md:text-xl text-[#6B6158] max-w-xl mx-auto leading-relaxed dm mt-6"
              style={{ textShadow: "0 1px 20px rgba(253,252,248,0.9)" }}>
              Programmable wallets. Zero fraud. Every rupee to the right student.
            </p>
          </motion.div>
        </div>

        {/* MARQUEE */}
        <div className="py-5 bg-[#4A4238] overflow-hidden">
          <div className="marquee">
            <div className="marquee-inner">
              {[...Array(2)].map((_, repeat) =>
                ["On-Chain Transparency", "Zero Middlemen", "Smart Contracts", "Real-time Settlement", "Fraud-Proof", "Blockchain Verified", "Instant Grants", "Student First"].map((item, i) => (
                  <span key={`${repeat}-${i}`} className="text-[#D4B896]/70 text-sm font-medium dm uppercase tracking-widest flex items-center gap-3">
                    <span className="w-1 h-1 rounded-full bg-[#A38A63] inline-block" />
                    {item}
                  </span>
                ))
              )}
            </div>
          </div>
        </div>

        {/* STATS */}
        <section className="py-24 px-6 bg-[#FDFCF8]/80 backdrop-blur-sm">
          <div className="max-w-5xl mx-auto">
            <FadeUp className="grid grid-cols-3 gap-8 text-center divide-x divide-[#EBE6E0]">
              <Stat value="100%" label="On-Chain" subLabel="Transparency" />
              <Stat value="~0%" label="Middleman Fees" />
              <Stat value="Real‑time" label="Settlement" />
            </FadeUp>
          </div>
        </section>

        {/* QUOTE 1 */}
        <section className="py-32 px-6 bg-[#F5F0E6]/80 backdrop-blur-sm relative overflow-hidden">
          <div className="max-w-4xl mx-auto text-center">
            <SplitHeading text="Education is the most powerful weapon you can use to change the world." className="text-3xl md:text-5xl font-bold text-[#4A4238] leading-tight mb-6" />
            <FadeUp delay={0.3}>
              <p className="text-[#8C8276] dm text-sm tracking-widest uppercase">— Nelson Mandela</p>
            </FadeUp>
          </div>
        </section>

        {/* HOW IT WORKS CARDS */}
        <section className="py-28 px-6 bg-white/70 backdrop-blur-sm">
          <div className="max-w-6xl mx-auto">
            <FadeUp className="text-center mb-20">
              <span className="text-xs font-semibold text-[#A38A63] dm uppercase tracking-widest">The Ecosystem</span>
              <SplitHeading text="How EduGrant Works" className="text-4xl md:text-6xl font-bold text-[#4A4238] mt-3" />
              <p className="text-[#8C8276] dm mt-4 max-w-xl mx-auto">A frictionless ecosystem for donors, students, and educational vendors.</p>
            </FadeUp>
            <div className="grid md:grid-cols-3 gap-6">
              {[
                { num: "01", title: "Donor Funding", desc: "Donors lock USDC into the smart contract, directly funding a student's wallet. No middlemen, no delays, no trust required.", color: "#F5F0E6", accent: "#A38A63", icon: ( <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-10 h-10"><circle cx="24" cy="24" r="20" /><path d="M24 14v20M18 18l6-4 6 4" strokeLinecap="round" /></svg> ) },
                { num: "02", title: "Student Spending", desc: "Students can only spend approved grants at verified vendors — universities, bookstores, labs. Smart contracts enforce it.", color: "#EDF2EA", accent: "#5C7A43", icon: ( <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-10 h-10"><path d="M6 24L24 8l18 16" strokeLinecap="round" strokeLinejoin="round" /><rect x="14" y="24" width="20" height="16" rx="2" /><rect x="20" y="32" width="8" height="8" /></svg> ) },
                { num: "03", title: "Admin Oversight", desc: "Admins whitelist vendors and revoke allowances if needed. Full control, full transparency — nothing hidden on-chain.", color: "#FDF6ED", accent: "#C28C53", icon: ( <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-10 h-10"><path d="M24 4l16 8v12c0 10-8 18-16 20C16 42 8 34 8 24V12L24 4z" strokeLinecap="round" strokeLinejoin="round" /><path d="M16 24l5 5 10-10" strokeLinecap="round" strokeLinejoin="round" /></svg> ) },
              ].map((card, i) => (
                <motion.div key={i} initial={{ opacity: 0, y: 50 }} whileInView={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.12, duration: 0.7 }} viewport={{ once: true }} whileHover={{ y: -10 }} className="relative group p-8 rounded-3xl border border-[#EBE6E0] shadow-sm hover:shadow-xl transition-all bg-white/80">
                  <div className="flex items-start justify-between mb-6">
                    <div className="p-3 rounded-2xl" style={{ backgroundColor: card.color, color: card.accent }}>{card.icon}</div>
                    <span className="text-5xl font-black opacity-10" style={{ color: card.accent }}>{card.num}</span>
                  </div>
                  <h3 className="text-2xl font-bold text-[#4A4238] mb-3">{card.title}</h3>
                  <p className="text-[#8C8276] dm leading-relaxed">{card.desc}</p>
                  <div className="absolute bottom-0 left-0 right-0 h-1 rounded-b-3xl opacity-0 group-hover:opacity-100 transition-opacity" style={{ background: `linear-gradient(90deg, ${card.accent}, transparent)` }} />
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* FOUR STEPS */}
        <section className="py-28 px-6 bg-[#FDFCF8]/80 backdrop-blur-sm">
          <div className="max-w-6xl mx-auto">
            <FadeUp className="text-center mb-20">
              <span className="text-xs font-semibold text-[#A38A63] dm uppercase tracking-widest">Simple. Secure. On-Chain.</span>
              <SplitHeading text="Four Steps to Transform Education Funding" className="text-4xl md:text-5xl font-bold text-[#4A4238] mt-3 max-w-3xl mx-auto" />
            </FadeUp>
            <div className="grid md:grid-cols-4 gap-6 relative">
              <div className="hidden md:block absolute top-14 left-[12.5%] right-[12.5%] h-px bg-gradient-to-r from-transparent via-[#EBE6E0] to-transparent" />
              {[
                { step: "1", title: "Connect Wallet", desc: "Donor or student connects MetaMask in seconds.", emoji: "🔗" },
                { step: "2", title: "Fund / Request", desc: "Donors fund students; or students request grants on-chain.", emoji: "💸" },
                { step: "3", title: "Whitelist Vendors", desc: "Admin approves trusted educational shops and institutions.", emoji: "✅" },
                { step: "4", title: "Spend Grant", desc: "Student pays vendor using smart-contract allowance.", emoji: "🎓" },
              ].map((item, i) => (
                <motion.div key={i} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1, duration: 0.6 }} viewport={{ once: true }} className="text-center">
                  <div className="relative w-28 h-28 mx-auto mb-6">
                    <div className="absolute inset-0 rounded-full bg-[#F5F0E6] border-2 border-[#EBE6E0]" />
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-3xl">{item.emoji}</span>
                      <span className="text-xs font-black text-[#A38A63] dm mt-1">STEP {item.step}</span>
                    </div>
                  </div>
                  <h3 className="text-lg font-bold text-[#4A4238] mb-2">{item.title}</h3>
                  <p className="text-sm text-[#8C8276] dm leading-relaxed">{item.desc}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* TRUST + LIVE CONTRACT FEED */}
        <section className="py-28 px-6 bg-[#F5F0E6]/80 backdrop-blur-sm">
          <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-16 items-center">
            <FadeUp>
              <span className="text-xs font-semibold text-[#A38A63] dm uppercase tracking-widest">Built Different</span>
              <SplitHeading text="Trust is not given. It's programmed." className="text-4xl md:text-5xl font-bold text-[#4A4238] mt-3 leading-tight" />
              <p className="text-[#6B6158] dm mt-6 text-lg leading-relaxed">
                Traditional grant systems rely on paperwork, intermediaries, and good faith. EduGrant replaces all of that with immutable smart contracts on the Sepolia testnet — no human can intercept, delay, or steal a single rupee.
              </p>
              <div className="flex flex-col gap-4 mt-8">
                {[
                  "Zero custodial risk — funds go directly to student wallets",
                  "Vendor whitelist enforced by contract, not by humans",
                  "Every transaction publicly verifiable on-chain",
                  "Donor retains refund rights until funds are spent",
                ].map((point, i) => (
                  <motion.div key={i} initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.1 }} viewport={{ once: true }} className="flex items-start gap-3">
                    <div className="w-5 h-5 rounded-full bg-[#7A9C59]/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <div className="w-2 h-2 rounded-full bg-[#7A9C59]" />
                    </div>
                    <p className="text-[#4A4238] dm">{point}</p>
                  </motion.div>
                ))}
              </div>
            </FadeUp>
            <FadeUp delay={0.2}>
              <div className="relative">
                <div className="absolute inset-0 -m-6 rounded-3xl opacity-50 blur-2xl" style={{ background: "radial-gradient(circle, #A38A63 0%, transparent 70%)" }} />
                <div className="relative card-glass p-8 rounded-3xl shadow-2xl">
                  <div className="text-xs text-[#8C8276] dm uppercase tracking-widest mb-4">Live Contract Feed</div>
                  {[
                    { hash: "0x4f2c...a91b", type: "Fund Student", amount: "₹50,000", time: "2s ago", color: "#7A9C59" },
                    { hash: "0x9e1a...3d7c", type: "Grant Spent", amount: "₹12,500", time: "1m ago", color: "#A38A63" },
                    { hash: "0x2b8f...c42e", type: "Vendor Approved", amount: "—", time: "5m ago", color: "#5C7A43" },
                    { hash: "0x7d3a...8f1b", type: "Fund Student", amount: "₹75,000", time: "12m ago", color: "#7A9C59" },
                  ].map((tx, i) => (
                    <motion.div key={i} initial={{ opacity: 0, x: 20 }} whileInView={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.08 }} viewport={{ once: true }} className="flex items-center justify-between py-3 border-b border-[#EBE6E0] last:border-0">
                      <div className="flex items-center gap-3">
                        <div className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: tx.color }} />
                        <div>
                          <div className="text-xs font-mono text-[#8C8276]">{tx.hash}</div>
                          <div className="text-sm font-semibold text-[#4A4238] dm">{tx.type}</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-bold" style={{ color: tx.color }}>{tx.amount}</div>
                        <div className="text-xs text-[#8C8276] dm">{tx.time}</div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </FadeUp>
          </div>
        </section>

        {/* QUOTE 2 */}
        <section className="py-28 px-6 bg-white/70 backdrop-blur-sm overflow-hidden">
          <div className="max-w-4xl mx-auto text-center">
            <FadeUp><p className="text-5xl md:text-7xl font-bold text-[#EBE6E0] leading-none select-none" aria-hidden>&ldquo;</p></FadeUp>
            <SplitHeading text="An investment in knowledge pays the best interest." className="text-3xl md:text-4xl font-bold text-[#4A4238] leading-snug -mt-4" />
            <FadeUp delay={0.4}><p className="text-[#8C8276] dm text-sm tracking-widest uppercase mt-4">— Benjamin Franklin</p></FadeUp>
          </div>
        </section>

        {/* CTA */}
        <section className="py-32 px-6 bg-[#4A4238] relative overflow-hidden">
          <div className="absolute inset-0 opacity-5" style={{ backgroundImage: "repeating-linear-gradient(45deg, #A38A63 0, #A38A63 1px, transparent 0, transparent 50%)", backgroundSize: "20px 20px" }} />
          <div className="max-w-4xl mx-auto text-center relative z-10">
            <FadeUp><span className="text-xs font-semibold text-[#A38A63] dm uppercase tracking-widest">Join the Movement</span></FadeUp>
            <SplitHeading text="Ready to change the future of education?" className="text-4xl md:text-6xl font-bold text-[#F5F0E6] mt-4 mb-6" />
            <FadeUp delay={0.3}><p className="text-[#D6CEC4] dm text-lg mb-12 max-w-xl mx-auto leading-relaxed">Join EduGrant today — donate, receive, or administer grants with complete on-chain transparency.</p></FadeUp>
            <FadeUp delay={0.45} className="flex flex-wrap justify-center gap-5">
              <Link href="/donor"><motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.97 }} className="px-10 py-5 bg-[#A38A63] text-white font-bold rounded-2xl shadow-2xl shadow-[#A38A63]/30 hover:bg-[#8F7856] transition-all dm text-lg">Start Donating →</motion.button></Link>
              <Link href="/student"><motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.97 }} className="px-10 py-5 bg-transparent border-2 border-[#F5F0E6]/30 text-[#F5F0E6] font-bold rounded-2xl hover:bg-white/10 hover:border-[#F5F0E6]/60 transition-all dm text-lg">I'm a Student</motion.button></Link>
            </FadeUp>
          </div>
        </section>

        {/* FOOTER */}
        <footer className="py-12 px-6 bg-[#3A342E] border-t border-[#4A4238]">
          <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-3">
              <Image src="/icon2.png" alt="EduGrant" width={28} height={28} style={{ width: 'auto', height: 'auto' }} className="opacity-60" />
              <span className="text-[#8C8276] dm text-sm">© 2025 EduGrant — Smart Scholarship Wallet</span>
            </div>
            <div className="flex items-center gap-8">
              {["Donors", "Students", "Admin", "Whitepaper"].map(link => <Link key={link} href={`/${link.toLowerCase()}`} className="text-[#8C8276] hover:text-[#D4B896] dm text-sm transition-colors">{link}</Link>)}
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-[#7A9C59] animate-pulse" />
              <span className="text-xs text-[#8C8276] dm">Powered by Sepolia Testnet</span>
            </div>
          </div>
        </footer>
      </div>
    </main>
  );
}