"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import FatexiBall from "@/components/FatexiBall";
import { serverTimestamp } from "firebase/firestore";

function LoadingState() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6">
      {/* Animated orb */}
      <div className="relative w-24 h-24 mb-10">
        <div 
          className="absolute inset-0 rounded-full"
          style={{ 
            background: 'radial-gradient(circle, rgba(0,212,255,0.3) 0%, transparent 70%)',
            animation: 'pulse-glow 2s ease-in-out infinite'
          }}
        />
        <div 
          className="absolute inset-4 rounded-full"
          style={{ 
            background: 'radial-gradient(circle, rgba(139,92,246,0.4) 0%, transparent 70%)',
            animation: 'pulse-glow 2s ease-in-out infinite 0.3s'
          }}
        />
        <div 
          className="absolute inset-8 rounded-full"
          style={{ 
            background: 'radial-gradient(circle, rgba(255,0,110,0.3) 0%, transparent 70%)',
            animation: 'pulse-glow 2s ease-in-out infinite 0.6s'
          }}
        />
        <div 
          className="absolute inset-0 flex items-center justify-center"
          style={{ animation: 'spin 4s linear infinite' }}
        >
          <div className="w-2 h-2 rounded-full" style={{ background: '#00D4FF', boxShadow: '0 0 15px #00D4FF' }} />
        </div>
      </div>
      <p className="text-xl font-medium mb-3" style={{ color: '#E0E0E0' }}>命理引擎分析中</p>
      <p className="text-sm mb-8" style={{ color: '#666680' }}>結合四大理論體系，生成你的命書</p>
      <div className="flex gap-2">
        {['姓名學', '八字', '五行', '星座'].map((item, i) => (
          <div 
            key={item}
            className="px-3 py-1.5 rounded-full text-xs"
            style={{ 
              background: 'rgba(0,212,255,0.08)', 
              border: '1px solid rgba(0,212,255,0.15)',
              color: '#666680',
              animation: `fade-in 0.5s ease-out ${i * 0.2}s forwards`,
              opacity: 0
            }}
          >
            {item}
          </div>
        ))}
      </div>
      <style>{`
        @keyframes pulse-glow {
          0%, 100% { transform: scale(1); opacity: 0.6; }
          50% { transform: scale(1.15); opacity: 1; }
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}

function AnalysisCard({ title, icon, children, color = '#00D4FF' }: { title: string; icon: string; children: React.ReactNode; color?: string }) {
  return (
    <div className="rounded-2xl overflow-hidden" style={{ background: '#0D0D1A', border: `1px solid ${color}20` }}>
      <div className="flex items-center gap-3 px-5 py-4" style={{ borderBottom: `1px solid ${color}10` }}>
        <div className="w-9 h-9 rounded-lg flex items-center justify-center text-base" style={{ background: `${color}15`, color: color }}>
          {icon}
        </div>
        <span className="text-sm font-semibold" style={{ color }}>{title}</span>
      </div>
      <div className="p-5 text-sm leading-relaxed" style={{ color: '#CCCCDD', lineHeight: 2 }}>
        {children}
      </div>
    </div>
  );
}

function parseAnalysis(analysis: string) {
  if (!analysis) return null;
  
  const sections: Record<string, { title: string; content: string; color: string; icon: string }> = {};
  
  const sectionRegex = /##\s*(一、二、三、四、五、六)[.、]([^\n#]+)|\*\*([^*]+)\*\*([^*]+)/g;
  
  // Split by major sections (一、二、三、四、五、六)
  const parts = analysis.split(/(?=##\s*[一二二三四五六][.、])/);
  
  const sectionMap: Record<string, { color: string; icon: string }> = {
    '一': { color: '#8B5CF6', icon: '名' },
    '二': { color: '#00D4FF', icon: '八字' },
    '三': { color: '#00FF88', icon: '行' },
    '四': { color: '#FF006E', icon: '☆' },
    '五': { color: '#FFB800', icon: '★' },
    '六': { color: '#00D4FF', icon: '☷' },
  };
  
  parts.forEach(part => {
    const match = part.match(/##\s*([一二三四五六])[.、]\s*(.+?)\n([\s\S]+?)$/);
    if (match) {
      const [, num, title, content] = match;
      const info = sectionMap[num] || { color: '#00D4FF', icon: '◈' };
      sections[num] = {
        title: title.trim(),
        content: content.replace(/^[-*]\s+/gm, '• ').trim(),
        ...info
      };
    }
  });
  
  return sections;
}

export default function OnboardingPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [phase, setPhase] = useState<'loading' | 'analyzing' | 'result'>('loading');
  const [progress, setProgress] = useState(0);
  const [analysisResult, setAnalysisResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem('fatexi_user');
    if (!stored) { router.push('/register'); return; }
    const userData = JSON.parse(stored);
    setUser(userData);

    // Start analysis immediately
    runAnalysis(userData);
  }, [router]);

  async function runAnalysis(userData: any) {
    setPhase('loading');
    setProgress(10);

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 120000);

      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: userData.name,
          year: userData.year,
          month: userData.month,
          day: userData.day,
          hour: userData.hour,
          gender: userData.gender,
          location: userData.location,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeout);

      setProgress(70);

      if (!response.ok) {
        throw new Error(`分析服務暫時無法使用 (${response.status})`);
      }

      const result = await response.json();
      setProgress(100);

      if (result.error) {
        throw new Error(result.error);
      }

      setAnalysisResult(result.data);
      // Save to localStorage for dashboard to read
      localStorage.setItem('fatexi_analysis', JSON.stringify(result.data));
      
      // Save complete analysis to Firestore
      try {
        const { getDB } = await import("@/lib/firebase");
        const dbInstance = getDB();
        if (dbInstance) {
          const { collection, addDoc, query, where, getDocs } = await import("firebase/firestore");
          // Find the user document by name and birth data
          const q = query(
            collection(dbInstance, "users"),
            where("name", "==", userData.name),
            where("year", "==", userData.year),
            where("month", "==", userData.month),
            where("day", "==", userData.day)
          );
          const snap = await getDocs(q);
          if (!snap.empty) {
            const { doc, updateDoc } = await import("firebase/firestore");
            const userDocId = snap.docs[0].id;
            await updateDoc(doc(dbInstance, "users", userDocId), {
              bazi: result.data.bazi || {},
              western: result.data.western || {},
              analysis: result.data.analysis || "",
              fiveElements: result.data.bazi?.fiveElements || {},
              tenGods: result.data.bazi?.tenGods || {},
              dayMaster: result.data.bazi?.dayMaster || "",
              dayPillar: result.data.bazi?.dayPillar || "",
              updatedAt: serverTimestamp(),
            });
          }
        }
      } catch (e) {
        console.warn("Failed to save analysis to Firestore:", e);
      }
      
      setPhase('result');
    } catch (e: any) {
      if (e.name === 'AbortError') {
        setError('分析時間過長，請稍後再試（DeepSeek 服务响应较慢）');
      } else {
        setError(e.message || '分析過程發生錯誤');
      }
      setPhase('result');
    }
  }

  if (!user) return null;

  if (phase === 'loading' || phase === 'analyzing') {
    return (
      <div className="min-h-screen flex flex-col" style={{ background: '#030308' }}>
        {/* Top bar */}
        <div className="fixed top-0 left-0 right-0 z-50 px-6 py-3 flex items-center justify-between" style={{ background: 'rgba(3,3,8,0.9)', backdropFilter: 'blur(12px)', borderBottom: '1px solid rgba(0,212,255,0.06)' }}>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold" style={{ background: 'linear-gradient(135deg, #00D4FF, #FF006E)', color: 'white', fontFamily: 'var(--font-mono)' }}>象</div>
            <span className="text-xs font-medium" style={{ color: '#666680' }}>Fatexi</span>
          </div>
          <span className="text-xs" style={{ color: '#666680' }}>{user.name}</span>
        </div>
        <LoadingState />
      </div>
    );
  }

  // Show error state
  if (error && !analysisResult) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-6" style={{ background: '#030308' }}>
        <div className="text-center">
          <p className="text-lg mb-4" style={{ color: '#FF3366' }}>分析失敗</p>
          <p className="text-sm mb-6" style={{ color: '#666680' }}>{error}</p>
          <button
            onClick={() => runAnalysis(user)}
            className="px-6 py-3 rounded-xl text-sm font-medium"
            style={{ background: 'rgba(0,212,255,0.1)', border: '1px solid rgba(0,212,255,0.3)', color: '#00D4FF' }}
          >
            重新分析
          </button>
        </div>
      </div>
    );
  }

  const sections = analysisResult?.analysis ? parseAnalysis(analysisResult.analysis) : null;
  const mockData = analysisResult?.bazi || {};

  return (
    <div className="min-h-screen" style={{ background: '#030308' }}>
      {/* Top bar */}
      <div className="fixed top-0 left-0 right-0 z-50 px-6 py-3 flex items-center justify-between" style={{ background: 'rgba(3,3,8,0.9)', backdropFilter: 'blur(12px)', borderBottom: '1px solid rgba(0,212,255,0.06)' }}>
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold" style={{ background: 'linear-gradient(135deg, #00D4FF, #FF006E)', color: 'white', fontFamily: 'var(--font-mono)' }}>象</div>
          <span className="text-xs font-medium" style={{ color: '#666680' }}>Fatexi</span>
        </div>
        <span className="text-xs" style={{ color: '#666680' }}>{user.name}</span>
      </div>

      <div className="pt-14">
        {/* Hero */}
        <div className="px-6 pt-10 pb-6 text-center relative">
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-[400px] rounded-full" style={{ background: 'radial-gradient(circle, rgba(0,212,255,0.06) 0%, transparent 65%)' }} />
          </div>
          <h1 className="text-[2rem] md:text-[3rem] font-bold mb-3" style={{ color: '#FFFFFF' }}>
            {user.name}，這是你的命書
          </h1>
          <p className="text-sm mb-4" style={{ color: '#666680' }}>
            {analysisResult?.western?.sunSign || '天秤'} · {analysisResult?.bazi?.dayPillar?.slice(0,1) || '庚'}日主 · 命書已生成
          </p>
          <div className="flex justify-center">
            <FatexiBall score={Math.floor(Math.random() * 30) + 65} />
          </div>
        </div>

        {/* Quick facts */}
        {analysisResult?.bazi && (
          <div className="px-6 pb-6">
            <div className="rounded-2xl p-5" style={{ background: '#0D0D1A', border: '1px solid rgba(0,212,255,0.1)' }}>
              <div className="text-xs text-center mb-3" style={{ color: '#666680' }}>命盤四柱</div>
              <div className="grid grid-cols-4 gap-3 text-center">
                {[
                  { label: '年', value: analysisResult.bazi.yearPillar },
                  { label: '月', value: analysisResult.bazi.monthPillar },
                  { label: '日', value: analysisResult.bazi.dayPillar },
                  { label: '時', value: analysisResult.bazi.hourPillar },
                ].map(item => (
                  <div key={item.label}>
                    <div className="text-xs mb-1" style={{ color: '#666680' }}>{item.label}柱</div>
                    <div className="text-lg font-bold" style={{ color: '#00D4FF', fontFamily: 'var(--font-mono)' }}>{item.value}</div>
                  </div>
                ))}
              </div>
              {analysisResult.western && (
                <div className="mt-4 pt-4 grid grid-cols-3 gap-3 text-center" style={{ borderTop: '1px solid rgba(0,212,255,0.06)' }}>
                  {[
                    { label: '太陽', value: analysisResult.western.sunSign },
                    { label: '月亮', value: analysisResult.western.moonSign },
                    { label: '性別', value: user.gender === '男' ? '男性' : '女性' },
                  ].map(item => (
                    <div key={item.label}>
                      <div className="text-xs mb-0.5" style={{ color: '#666680' }}>{item.label}</div>
                      <div className="text-sm font-medium" style={{ color: '#E0E0E0' }}>{item.value}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Analysis sections */}
        {sections ? (
          <div className="px-6 pb-8 space-y-4">
            {Object.entries(sections).map(([key, section]: [string, any]) => (
              <AnalysisCard key={key} title={section.title} icon={section.icon} color={section.color}>
                <div style={{ whiteSpace: 'pre-wrap' }}>{section.content}</div>
              </AnalysisCard>
            ))}
          </div>
        ) : (
          /* Fallback to raw display if parsing fails */
          analysisResult?.analysis && (
            <div className="px-6 pb-8">
              <AnalysisCard title="命書全文" icon="◈" color="#00D4FF">
                <div style={{ whiteSpace: 'pre-wrap', lineHeight: 2 }}>{analysisResult.analysis}</div>
              </AnalysisCard>
            </div>
          )
        )}

        {/* CTA */}
        <div className="px-6 pb-10">
          <div className="rounded-2xl p-6 text-center" style={{ background: 'linear-gradient(135deg, rgba(0,212,255,0.05) 0%, rgba(139,92,246,0.05) 100%)', border: '1px solid rgba(0,212,255,0.1)' }}>
            <h2 className="text-lg font-bold mb-2" style={{ color: '#FFFFFF' }}>
              命運持續追蹤中
            </h2>
            <p className="text-sm mb-5" style={{ color: '#666680' }}>
              每30秒自動更新 · 即時反映命運走向
            </p>
            <div className="flex flex-col gap-3">
              <button
                onClick={() => window.location.href = '/dashboard'}
                className="w-full py-3 rounded-xl text-base font-semibold"
                style={{ background: 'linear-gradient(135deg, #00D4FF 0%, #8B5CF6 100%)', color: '#030308', letterSpacing: '0.05em' }}
              >
                進入萬象運命圖
              </button>
              <button
                onClick={() => runAnalysis(user)}
                className="w-full py-3 rounded-xl text-sm"
                style={{ background: 'rgba(0,212,255,0.08)', border: '1px solid rgba(0,212,255,0.15)', color: '#666680' }}
              >
                重新分析
              </button>
            </div>
            <p className="text-xs mt-5" style={{ color: '#444460' }}>命的形狀，萬象承載 · Fatexi © 2026</p>
          </div>
        </div>
      </div>
    </div>
  );
}
