"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";

// Animated text reveal component
function RevealText({ children, delay = 0, className = "" }: { children: React.ReactNode; delay?: number; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setVisible(true); observer.disconnect(); } },
      { threshold: 0.2 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={`transition-all duration-1000 ease-out ${className}`}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(40px)',
        transitionDelay: `${delay}ms`
      }}
    >
      {children}
    </div>
  );
}

// Giant number counter
function GiantNumber({ target, label }: { target: number; label: string }) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setVisible(true); observer.disconnect(); } },
      { threshold: 0.5 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!visible) return;
    let start = 0;
    const duration = 1500;
    const step = 16;
    const increment = target / (duration / step);
    const timer = setInterval(() => {
      start += increment;
      if (start >= target) { setCount(target); clearInterval(timer); }
      else setCount(Math.floor(start));
    }, step);
    return () => clearInterval(timer);
  }, [visible, target]);

  return (
    <div ref={ref} className="text-center">
      <div 
        className="text-[12rem] md:text-[16rem] font-bold leading-none"
        style={{ 
          color: '#FFFFFF',
          fontFamily: 'var(--font-mono)',
          textShadow: '0 0 60px rgba(0,212,255,0.3)'
        }}
      >
        {count}
      </div>
      <div className="text-2xl md:text-3xl font-light tracking-[0.3em]" style={{ color: '#666680' }}>{label}</div>
    </div>
  );
}

export default function LandingPage() {
  const [scrollProgress, setScrollProgress] = useState(0);
  const mainRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleScroll = () => {
      if (!mainRef.current) return;
      const scrollTop = window.scrollY;
      const docHeight = mainRef.current.scrollHeight - window.innerHeight;
      setScrollProgress(Math.min(scrollTop / docHeight, 1));
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div ref={mainRef} className="relative" style={{ background: '#030308' }}>
      {/* Scroll progress bar */}
      <div 
        className="fixed top-0 left-0 right-0 z-[100] h-px"
        style={{ 
          background: 'rgba(0,212,255,0.1)',
        }}
      >
        <div 
          className="h-full"
          style={{ 
            width: `${scrollProgress * 100}%`,
            background: 'linear-gradient(90deg, #00D4FF, #8B5CF6, #FF006E)',
            boxShadow: '0 0 20px rgba(0,212,255,0.5)',
            transition: 'width 0.1s linear'
          }}
        />
      </div>

      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 px-8 py-6 flex items-center justify-between" style={{ background: 'rgba(3,3,8,0.0)', backdropFilter: scrollProgress > 0.05 ? 'blur(16px)' : 'none', borderBottom: scrollProgress > 0.02 ? '1px solid rgba(0,212,255,0.06)' : 'none' }}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg flex items-center justify-center text-base font-bold" style={{ background: 'linear-gradient(135deg, #00D4FF 0%, #FF006E 100%)', color: 'white', fontFamily: 'var(--font-mono)' }}>象</div>
          <span className="text-base font-semibold tracking-widest" style={{ color: '#E0E0E0', letterSpacing: '0.2em' }}>Fatexi</span>
        </div>
        <div className="flex items-center gap-6">
          <Link href="/register" className="px-6 py-3 rounded-lg text-sm font-medium" style={{ background: 'linear-gradient(135deg, #00D4FF 0%, #8B5CF6 100%)', color: '#030308', letterSpacing: '0.05em' }}>
            開始使用
          </Link>
        </div>
      </nav>

      {/* ── SECTION 1: HERO ── */}
      <section className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden">
        {/* Background glow */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full" style={{ background: 'radial-gradient(circle, rgba(0,212,255,0.08) 0%, transparent 70%)' }} />
          <div className="absolute bottom-1/4 left-1/2 -translate-x-1/2 w-[400px] h-[400px] rounded-full" style={{ background: 'radial-gradient(circle, rgba(139,92,246,0.06) 0%, transparent 70%)' }} />
        </div>

        <div className="text-center px-6 relative z-10">
          <RevealText delay={0}>
            <div className="text-sm tracking-[0.5em] mb-8" style={{ color: '#666680', letterSpacing: '0.4em' }}>QUANTIFIED FATE</div>
          </RevealText>

          <RevealText delay={200}>
            <h1 
              className="text-[3.5rem] md:text-[7rem] font-bold leading-[0.9] mb-6"
              style={{ color: '#FFFFFF', letterSpacing: '-0.02em' }}
            >
              命的形狀
            </h1>
          </RevealText>

          <RevealText delay={400}>
            <div 
              className="text-[2rem] md:text-[4rem] font-extralight mb-8"
              style={{ 
                background: 'linear-gradient(135deg, #00D4FF 0%, #8B5CF6 50%, #FF006E 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                letterSpacing: '0.05em'
              }}
            >
              萬象承載
            </div>
          </RevealText>

          <RevealText delay={600}>
            <p className="text-base md:text-lg max-w-xl mx-auto mb-12" style={{ color: '#666680', lineHeight: 1.8 }}>
              全球首款量化命理趨勢分析平台<br/>
              將東西方命理體系數值化，像操盤手一樣看待你的命運
            </p>
          </RevealText>

          <RevealText delay={800}>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link 
                href="/register"
                className="px-10 py-4 rounded-xl text-base font-semibold"
                style={{ background: 'linear-gradient(135deg, #00D4FF 0%, #8B5CF6 100%)', color: '#030308', letterSpacing: '0.05em' }}
              >
                窺見你的命運
              </Link>
            </div>
          </RevealText>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2" style={{ animation: 'bounce 2s infinite' }}>
          <div className="text-xs" style={{ color: '#444460', letterSpacing: '0.2em' }}>SCROLL</div>
          <div className="w-px h-8" style={{ background: 'linear-gradient(180deg, #00D4FF, transparent)' }} />
        </div>
      </section>

      {/* ── SECTION 2: THE QUESTION ── */}
      <section className="min-h-screen flex items-center justify-center py-32 px-6">
        <div className="max-w-5xl mx-auto">
          <RevealText>
            <h2 className="text-[2rem] md:text-[4rem] font-bold leading-tight mb-12" style={{ color: '#FFFFFF' }}>
              你的命運，<br/>
              <span style={{ color: '#666680' }}>可以被看見嗎？</span>
            </h2>
          </RevealText>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-16">
            <RevealText delay={200}>
              <p className="text-lg md:text-xl leading-relaxed" style={{ color: '#9999AA', lineHeight: 2 }}>
                命運從不是模糊的隱喻。<br/>
                它有起點，有高點，有低點。<br/>
                有規律，有節奏，有週期。
              </p>
            </RevealText>
            <RevealText delay={400}>
              <p className="text-lg md:text-xl leading-relaxed" style={{ color: '#9999AA', lineHeight: 2 }}>
                Fatexi 將東西方千年命理智慧<br/>
                翻譯成 K 線圖上的每一個數值。<br/>
                <span style={{ color: '#00D4FF' }}>讓你看見，然後掌握。</span>
              </p>
            </RevealText>
          </div>
        </div>
      </section>

      {/* ── SECTION 3: THE THEORIES ── */}
      <section className="min-h-screen flex items-center justify-center py-32 px-6">
        <div className="max-w-5xl mx-auto">
          <RevealText>
            <div className="text-sm tracking-[0.4em] mb-6" style={{ color: '#00D4FF' }}>FOUR SYSTEMS</div>
            <h2 className="text-[2.5rem] md:text-[4.5rem] font-bold leading-tight mb-20" style={{ color: '#FFFFFF' }}>
              四個理論體系<br/>
              <span style={{ color: '#666680' }}>一種命運觀</span>
            </h2>
          </RevealText>

          <div className="space-y-20">
            {[
              { num: "01", title: "姓名學", desc: "每一個名字都是一種能量場。筆畫結構蘊含著命運的基因密碼，影響著事業與人際的軌跡。", color: "#8B5CF6" },
              { num: "02", title: "八字命理", desc: "出生那一刻，天干地支就鎖定了你的人生劇本。流年大運，如潮汐般起落有常。", color: "#00D4FF" },
              { num: "03", title: "五行八卦", desc: "金木水火土，陰陽流轉。五行平衡與否，決定了你在每個階段的能量狀態。", color: "#00FF88" },
              { num: "04", title: "占星行運", desc: "行星的相位不是迷信，是宇宙能量場對個人磁場的週期性影響。", color: "#FF006E" },
            ].map((item, i) => (
              <RevealText key={item.num} delay={i * 100}>
                <div className="flex items-start gap-8 md:gap-16">
                  <div 
                    className="text-[4rem] md:text-[6rem] font-bold leading-none"
                    style={{ color: item.color, fontFamily: 'var(--font-mono)', opacity: 0.3 }}
                  >
                    {item.num}
                  </div>
                  <div className="flex-1 pt-4">
                    <h3 className="text-3xl md:text-5xl font-bold mb-4" style={{ color: '#FFFFFF' }}>{item.title}</h3>
                    <p className="text-base md:text-lg leading-relaxed max-w-2xl" style={{ color: '#9999AA', lineHeight: 2 }}>{item.desc}</p>
                  </div>
                </div>
              </RevealText>
            ))}
          </div>
        </div>
      </section>

      {/* ── SECTION 4: THE NUMBERS ── */}
      <section className="min-h-screen flex items-center justify-center py-32 px-6">
        <div className="max-w-5xl mx-auto text-center">
          <RevealText>
            <div className="text-sm tracking-[0.4em] mb-6" style={{ color: '#666680' }}>QUANTIFIED</div>
            <h2 className="text-[2rem] md:text-[4rem] font-bold mb-20" style={{ color: '#FFFFFF' }}>
              將命運，翻譯成數字
            </h2>
          </RevealText>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-12">
            {[
              { num: "4", label: "理論體系" },
              { num: "∞", label: "數值維度" },
              { num: "24/7", label: "即時追蹤" },
              { num: "0-100", label: "標準化指數" },
            ].map((item, i) => (
              <RevealText key={item.label} delay={i * 150}>
                <div className="text-center">
                  <div 
                    className="text-[4rem] md:text-[6rem] font-bold mb-3"
                    style={{ color: '#FFFFFF', fontFamily: 'var(--font-mono)', textShadow: '0 0 40px rgba(0,212,255,0.2)' }}
                  >
                    {item.num}
                  </div>
                  <div className="text-sm tracking-[0.2em]" style={{ color: '#666680' }}>{item.label}</div>
                </div>
              </RevealText>
            ))}
          </div>
        </div>
      </section>

      {/* ── SECTION 5: THE METRICS ── */}
      <section className="min-h-screen flex items-center justify-center py-32 px-6">
        <div className="max-w-5xl mx-auto">
          <RevealText>
            <div className="text-sm tracking-[0.4em] mb-6" style={{ color: '#00FF88' }}>FOUR INDICATORS</div>
            <h2 className="text-[2rem] md:text-[4rem] font-bold mb-20" style={{ color: '#FFFFFF', lineHeight: 1.1 }}>
              四個維度，<br/>
              <span style={{ color: '#666680' }}>構成你命運的全部</span>
            </h2>
          </RevealText>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[
              { icon: "💰", title: "財富", desc: "投資、薪資、意外財的能量流向", color: "#00FF88" },
              { icon: "💼", title: "事業", desc: "權力、效率、人際支持的磁場", color: "#00D4FF" },
              { icon: "❤️", title: "感情", desc: "吸引力、和諧度、脫單的機率", color: "#FF006E" },
              { icon: "⚡", title: "能量", desc: "身心健康與情緒穩定的指數", color: "#FFB800" },
            ].map((item, i) => (
              <RevealText key={item.title} delay={i * 120}>
                <div 
                  className="rounded-2xl p-8 flex items-start gap-6"
                  style={{ 
                    background: 'linear-gradient(135deg, #0D0D1A 0%, #080814 100%)',
                    border: `1px solid ${item.color}20`,
                    boxShadow: `0 0 40px ${item.color}08`
                  }}
                >
                  <div 
                    className="text-4xl"
                    style={{ filter: `drop-shadow(0 0 8px ${item.color}60)` }}
                  >
                    {item.icon}
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold mb-2" style={{ color: item.color }}>{item.title}</h3>
                    <p className="text-sm" style={{ color: '#9999AA', lineHeight: 1.7 }}>{item.desc}</p>
                  </div>
                </div>
              </RevealText>
            ))}
          </div>
        </div>
      </section>

      {/* ── SECTION 6: CTA ── */}
      <section className="min-h-screen flex items-center justify-center py-32 px-6 relative overflow-hidden">
        {/* Background */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full" style={{ background: 'radial-gradient(circle, rgba(0,212,255,0.06) 0%, transparent 60%)' }} />
        </div>

        <div className="text-center relative z-10 max-w-3xl mx-auto">
          <RevealText>
            <h2 
              className="text-[2.5rem] md:text-[5rem] font-bold leading-tight mb-8"
              style={{ color: '#FFFFFF' }}
            >
              你的命運，<br/>
              <span style={{ 
                background: 'linear-gradient(135deg, #00D4FF 0%, #8B5CF6 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent'
              }}>
                值得被看懂
              </span>
            </h2>
          </RevealText>

          <RevealText delay={200}>
            <p className="text-lg mb-12" style={{ color: '#666680', lineHeight: 2 }}>
              立即開始，獲得你專屬的命運分析報告
            </p>
          </RevealText>

          <RevealText delay={400}>
            <Link 
              href="/register"
              className="inline-block px-14 py-5 rounded-2xl text-xl font-semibold"
              style={{ 
                background: 'linear-gradient(135deg, #00D4FF 0%, #8B5CF6 100%)', 
                color: '#030308',
                letterSpacing: '0.05em',
                boxShadow: '0 0 60px rgba(0,212,255,0.3)'
              }}
            >
              窺見命運
            </Link>
          </RevealText>

          <RevealText delay={600}>
            <p className="text-xs mt-8" style={{ color: '#444460' }}>
              僅供參考 · 命運掌握在自己手中
            </p>
          </RevealText>
        </div>
      </section>

      {/* Footer */}
      <footer className="px-8 py-12" style={{ borderTop: '1px solid rgba(0,212,255,0.06)' }}>
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold" style={{ background: 'linear-gradient(135deg, #00D4FF, #FF006E)', color: 'white', fontFamily: 'var(--font-mono)' }}>象</div>
            <span className="text-sm" style={{ color: '#666680' }}>Fatexi © 2026</span>
          </div>
          <div className="text-sm" style={{ color: '#444460' }}>命的形狀，萬象承載</div>
        </div>
      </footer>

      <style>{`
        @keyframes bounce {
          0%, 100% { transform: translateX(-50%) translateY(0); }
          50% { transform: translateX(-50%) translateY(8px); }
        }
      `}</style>
    </div>
  );
}
