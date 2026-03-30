"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import FatexiBall from "@/components/FatexiBall";
import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import { doc, getDoc } from "firebase/firestore";

function RevealSection({ children, delay = 0, className = "" }: { children: React.ReactNode; delay?: number; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setVisible(true); observer.disconnect(); } },
      { threshold: 0.1 }
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
        transform: visible ? 'translateY(0)' : 'translateY(50px)',
        transitionDelay: `${delay}ms`,
      }}
    >
      {children}
    </div>
  );
}

const METRICS = [
  { key: 'wealth', emoji: '💰', name: '財富', color: '#00FF88', desc: '投資、薪資、意外之財' },
  { key: 'career', emoji: '💼', name: '事業', color: '#00D4FF', desc: '權力、效率、人際支持' },
  { key: 'love', emoji: '❤️', name: '感情', color: '#FF006E', desc: '吸引力、和諧度、脫單機率' },
  { key: 'vitality', emoji: '⚡', name: '能量', color: '#FFB800', desc: '身心健康、情緒穩定度' },
];

function generateMockData() {
  const now = new Date();
  return {
    total: Math.floor(Math.random() * 40) + 55,
    wealth: Math.floor(Math.random() * 50) + 40,
    career: Math.floor(Math.random() * 45) + 45,
    love: Math.floor(Math.random() * 55) + 35,
    vitality: Math.floor(Math.random() * 40) + 50,
    time: now.toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit' }),
  };
}

// ── Bazi Element Calculation ──────────────────────────────────────────────
const GAN = ['甲','乙','丙','丁','戊','己','庚','辛','壬','癸'];
const ZHI = ['子','丑','寅','卯','辰','巳','午','未','申','酉','戌','亥'];
const WUXING_GAN: Record<string,string> = { '甲':'木','乙':'木','丙':'火','丁':'火','戊':'土','己':'土','庚':'金','辛':'金','壬':'水','癸':'水' };
const WUXING_ZHI: Record<string,string> = {
  '子':'水','丑':'土','寅':'木','卯':'木',
  '辰':'土','巳':'火','午':'火','未':'土',
  '申':'金','酉':'金','戌':'土','亥':'水'
};
const WUXING_SCORE: Record<string,number> = { '金':75,'木':80,'水':70,'火':72,'土':73 };
const GENERATING: Record<string,string[]> = { '木':['水'],'火':['木'],'土':['火'],'金':['土'],'水':['金'] };
const OVERCOMING: Record<string,string[]> = { '木':['土'],'火':['金'],'土':['水'],'金':['木'],'水':['火'] };
const OVERCOME_BY: Record<string,string[]> = { '木':['金'],'火':['水'],'土':['木'],'金':['火'],'水':['土'] };

function getGanZhiIndex(ganzhi: string): number {
  const g = ganzhi[0], z = ganzhi[1];
  return GAN.indexOf(g) * 12 + ZHI.indexOf(z);
}

// heavenly stems cycle relative to day master
function ganRelation(dmGan: string, otherGan: string): number {
  if (dmGan === otherGan) return 50;
  if (GENERATING[dmGan]?.includes(WUXING_GAN[otherGan])) return 80;
  if (GENERATING[WUXING_GAN[otherGan]]?.includes(dmGan)) return 30;
  if (OVERCOMING[dmGan]?.includes(WUXING_GAN[otherGan])) return 90;
  if (OVERCOME_BY[dmGan]?.includes(WUXING_GAN[otherGan])) return 20;
  return 50;
}

// ── 流年天干地支週期（60甲子）──────────────────────────────────────────────
// 從 1984 甲子年開始算，流年 = (targetYear - 1984) % 60
function liuNianGanZhi(targetYear: number): string {
  const offset = (targetYear - 1984 + 60) % 60;
  const gan = GAN[offset % 10];
  const zhi = ZHI[offset % 12];
  return gan + zhi;
}

// 根據日主五行，計算某流年的能量強度（相對成長指數，返回偏離基準的分數）
// 正數=加分，負數=減分，範圍大約 -25 ~ +35
function liuNianPower(dm: string, liuNianGZ: string): number {
  const dmWx = WUXING_GAN[dm] || '火';
  const lNgan = liuNianGZ[0]; // 天干
  const lNzhi = liuNianGZ[1]; // 地支
  const lNWx = WUXING_ZHI[lNzhi];
  
  // 天干合化（化氣五行）
  const heHua: Record<string,string> = {
    '甲己':'土','乙庚':'金','丙辛':'水','丁壬':'木','戊癸':'火'
  };
  const heHuaWx = heHua[dm + lNgan] || null;
  
  // 地支會方（地支三合局）
  const huiFang: Record<string,string> = {
    '申子辰':'水','亥卯未':'木','寅午戌':'火','巳酉丑':'金'
  };
  let huiFangBonus = 0;
  for (const [ Combo, wx ] of Object.entries(huiFang)) {
    if (Combo.includes(lNzhi) && (Combo[0] === dm || Combo[1] === dm || Combo[2] === dm)) {
      huiFangBonus += 8;
    }
  }
  
  // 生助日主（+分）
  let power = 0;
  if (heHuaWx === dmWx) power += 15; // 天干化氣助日主
  if (GENERATING[dmWx]?.includes(lNWx)) power += 10; // 地支生
  if (lNWx === dmWx) power += 12; // 地支同五行
  
  // 剋泄日主（-分）
  if (OVERCOMING[dmWx]?.includes(lNWx)) power -= 12; // 地支剋
  if (OVERCOME_BY[dmWx]?.includes(lNWx)) power -= 8; // 被地支剋
  if (OVERCOME_BY[dmWx]?.includes(WUXING_GAN[lNgan] || '')) power -= 6; // 天干被剋
  
  // 三合局加成
  power += huiFangBonus;
  
  return Math.max(-25, Math.min(35, power));
}

// 星座月度能量（每個星座的旺點）
const ZODIAC_MONTH_BONUS: Record<string, { wealth: number; career: number; love: number; vitality: number }> = {
  '牡羊': { wealth: 12, career: 18, love: 8,  vitality: 15 },
  '金牛': { wealth: 20, career: 6,  love: -5, vitality: 8  },
  '雙子': { wealth: 8,  career: 20, love: 12, vitality: 5  },
  '巨蟹': { wealth: 5,  career: 8,  love: 22, vitality: 10 },
  '獅子': { wealth: 15, career: 15, love: 15, vitality: 20 },
  '處女': { wealth: 22, career: 10, love: 18, vitality: 5  },
  '天秤': { wealth: 10, career: 22, love: 12, vitality: 8  },
  '天蠍': { wealth: 8,  career: 12, love: 20, vitality: 10 },
  '射手': { wealth: 5,  career: 8,  love: 10, vitality: 22 },
  '摩羯': { wealth: 20, career: 22, love: 5,  vitality: 12 },
  '水瓶': { wealth: 8,  career: 15, love: 8,  vitality: 18 },
  '雙魚': { wealth: 10, career: 5,  love: 22, vitality: 8  },
};

// 將 0-100 分數轉換為「相對成長指數」（以 65 為基準 = 100）
// 高於 65 指數 >100，低於 65 指數 <100
function toGrowthIndex(score: number): number {
  const baseline = 65;
  return Math.round(100 + (score - baseline) * (100 / 35));
}

// 計算單一維度的成長指數
// baseOffset = 該維度相對於基準的分數偏移
function metricIndex(baseOffset: number, cycleBonus: number): number {
  const raw = 65 + baseOffset + cycleBonus;
  return toGrowthIndex(raw);
}

// Calculate 4 metrics for a specific time point (growth index, baseline=100)
function calcMetrics(
  bazi: any,
  western: any,
  targetYear: number,
  targetMonth: number,
  targetDay: number,
  _currentYear: number,
  _currentMonth: number,
  _currentDay: number,
  firestoreMonthly?: any
) {
  const dm = bazi?.dayPillar?.[0] || '丙';
  const dmWx = WUXING_GAN[dm] || '火';
  const birthYear = bazi?.birthYear || targetYear;
  const yearDiff = targetYear - birthYear;
  const liuNianGZ = liuNianGanZhi(targetYear);
  const lNPower = liuNianPower(dm, liuNianGZ);
  
  // 流年干支組合的額外能量
  const lNgan = liuNianGZ[0];
  const lNzhHua = WUXING_GAN[lNgan] || '土';
  const ganHe = GENERATING[lNzhHua]?.includes(dmWx) ? 6 : 0;
  const ganKe = OVERCOMING[lNzhHua]?.includes(dmWx) ? -5 : 0;
  
  // 十年大運（每10年一切換，取年干陰陽順逆）
  const dayunOffset = Math.floor(yearDiff / 10) % 10;
  const dayunBonus = Math.sin(dayunOffset * Math.PI / 5) * 8;
  
  // 月份能量（星座旺點）- 優先使用 Firestore 設定，否則用預設值
  const monthKey = western?.sunSign || '天秤';
  let monthBonus = ZODIAC_MONTH_BONUS[monthKey] || { wealth: 0, career: 0, love: 0, vitality: 0 };
  if (firestoreMonthly && firestoreMonthly[monthKey]) {
    monthBonus = firestoreMonthly[monthKey];
  }
  
  // ── 財富：年柱 + 財帛宮 + 流年能量 ──────────────────────────────
  // 財帛宮在月支，流年天干為用神時加分
  const wealth = metricIndex(
    lNPower * 0.8 + ganHe - ganKe * 0.5 + dayunBonus * 0.6,
    monthBonus.wealth
  );
  
  // ── 事業：月柱 + 官殺星 + 土星周期（約29年）────────────────────
  const saturnCycle = Math.sin(2 * Math.PI * yearDiff / 29) * 10;
  const career = metricIndex(
    lNPower * 0.6 + ganHe * 0.8 + dayunBonus * 0.8 + saturnCycle * 0.5,
    monthBonus.career
  );
  
  // ── 愛情：日支夫妻宮 + 金星周期（每8年） + 月亮周期 ─────────────
  const venusCycle = Math.sin(2 * Math.PI * yearDiff / 8) * 10;
  const love = metricIndex(
    lNPower * 0.5 + ganHe * 0.6 + dayunBonus * 0.4 + venusCycle * 0.8,
    monthBonus.love
  );
  
  // ── 能量：時柱 + 天王星周期（約7年） + 上升點 ───────────────────
  const uranusCycle = Math.sin(2 * Math.PI * yearDiff / 7) * 8;
  const vitality = metricIndex(
    lNPower * 0.4 + dayunBonus + uranusCycle + 5, // 時柱基礎加成
    monthBonus.vitality
  );

  return { wealth, career, love, vitality };
}

function seededRand(seed: number): number {
  return Math.abs(Math.sin(seed * 9999));
}

function generateKLineData(
  bazi: any,
  western: any,
  tabKey: string,
  count: number,
  yearlyConfigs?: any,
  monthlyConfigs?: any,
  now: Date = new Date()
) {
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;
  const currentDay = now.getDate();

  const data: Array<{
    label: string;
    open: number; current: number; close: number;
    high: number; low: number;
    isUp: boolean; isCurrent: boolean;
    wealth: number; career: number; love: number; vitality: number;
    ma5?: number; ma10?: number;
  }> = [];

  for (let i = 0; i < count; i++) {
    let ty = currentYear, tm = currentMonth, td = currentDay;
    let label = '';
    
    if (tabKey === 'year') {
      ty = 2020 + i;
      label = `${ty}`;
    } else if (tabKey === 'month') {
      tm = (i % 12) + 1;
      label = `${tm}月`;
    } else if (tabKey === 'week') {
      td = i + 1;
      label = `第${i + 1}天`;
    } else {
      label = `${String(i).padStart(2,'0')}:00`;
    }

    // 四個維度成長指數（基準100）
    const m = calcMetrics(bazi, western, ty, tm, td, currentYear, currentMonth, currentDay, monthlyConfigs);
    const totalIndex = Math.round((m.wealth + m.career + m.love + m.vitality) / 4);

    // Open = 前一期 close，current = 期間中間值，close = 成長指數
    const prevIndex = i === 0 ? totalIndex : data[i - 1].close;
    const noise = (seededRand(ty * 1000 + tm * 10 + td) - 0.5) * 5;
    const open = Math.max(75, Math.min(165, prevIndex + noise));
    const current = Math.max(75, Math.min(165, (open + totalIndex) / 2 + (seededRand(ty * 2000 + tm * 20 + td) - 0.5) * 3));
    const close = totalIndex;
    const high = Math.max(open, current, close) + seededRand(ty * 3000 + i) * 3;
    const low = Math.min(open, current, close) - seededRand(ty * 4000 + i) * 3;

    const isCurrent = (tabKey === 'year' && ty === currentYear) ||
                      (tabKey === 'month' && tm === currentMonth) ||
                      (tabKey === 'week' && td === currentDay) ||
                      (tabKey === 'day' && i === now.getHours());

    // 陽線（紅）= 成長，陰線（綠）= 回落
    const isUp = close > open;

    data.push({
      label,
      open: Math.round(open),
      current: Math.round(current),
      close: Math.round(close),
      high: Math.round(Math.min(170, high)),
      low: Math.round(Math.max(70, low)),
      isUp,
      isCurrent,
      wealth: m.wealth,
      career: m.career,
      love: m.love,
      vitality: m.vitality,
    });
  }

  // MA5 / MA10（成長指數均線）
  for (let i = 0; i < data.length; i++) {
    if (i >= 4) {
      data[i].ma5 = Math.round(data.slice(i - 4, i + 1).reduce((s, d) => s + d.close, 0) / 5);
    }
    if (i >= 9) {
      data[i].ma10 = Math.round(data.slice(i - 9, i + 1).reduce((s, d) => s + d.close, 0) / 10);
    }
  }

  return data;
}

// Derive current 4 metrics from analysis
function generateMetricsFromAnalysis(analysisData: any, firestoreMonthly?: any) {
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;
  const currentDay = now.getDate();
  const time = now.toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit' });
  
  const m = calcMetrics(
    analysisData?.bazi,
    analysisData?.western,
    currentYear, currentMonth, currentDay,
    currentYear, currentMonth, currentDay,
    firestoreMonthly
  );
  
  const total = Math.round((m.wealth + m.career + m.love + m.vitality) / 4);
  
  return { ...m, total, time };
}

const THEORIES = [
  { system: "八字", content: "庚金逢沖，月柱見財官。流年傷官見官，主變動與機遇並存。", detail: "天干庚金受歲運丁火煉化，地支寅申衝，動盪中孕育轉機。" },
  { system: "占星", content: "太陽刑克土星，人生方向與責任課題交織，挑戰與成熟同步。", detail: "外行星土星行運至第四宮，家庭與事業的張力達到臨界點。" },
  { system: "紫微", content: "紫微星入僕役宮，化權。貴人運強，但小人亦不可不防。", detail: "貪狼與武曲同宮，財帛宮見左輔右弼，財務迎來新周期。" },
];

const COMPASS_DIRS = [
  { name: "財富位", emoji: "💰", angle: 45, color: "#00FF88", desc: "東南方" },
  { name: "事業位", emoji: "💼", angle: 135, color: "#00D4FF", desc: "西南方" },
  { name: "愛情位", emoji: "❤️", angle: 225, color: "#FF006E", desc: "西北方" },
  { name: "健康位", emoji: "⚡", angle: 315, color: "#FFB800", desc: "東北方" },
];

const TIME_TABS = [
  { key: "day", label: "時", count: 24, labelFn: (i: number) => `${String(i).padStart(2,'0')}:00` },
  { key: "week", label: "日", count: 7, labelFn: (i: number) => `第${i+1}天` },
  { key: "month", label: "月", count: 12, labelFn: (i: number) => `${i+1}月` },
  { key: "year", label: "年", count: 11, years: [2020,2021,2022,2023,2024,2025,2026,2027,2028,2029,2030], labelFn: (_: number, i: number) => `${2020+i}` },
] as const;

export default function DashboardPage() {
  const [user, setUser] = useState<any>(null);
  const [analysis, setAnalysis] = useState<any>(null);
  const [timeTab, setTimeTab] = useState<"day" | "week" | "month" | "year">("day");
  const [scrollProgress, setScrollProgress] = useState(0);
  const [metrics, setMetrics] = useState<any>(null);
  const [analysisLoading, setAnalysisLoading] = useState(false);
  const [formulaConfigs, setFormulaConfigs] = useState<any>(null);
  const [yearlyConfigs, setYearlyConfigs] = useState<any>(null);
  const [monthlyConfigs, setMonthlyConfigs] = useState<any>(null);
  const mainRef = useRef<HTMLDivElement>(null);

  // Load formula configs from Firestore
  useEffect(() => {
    async function loadConfigs() {
      try {
        const { getDB } = await import("@/lib/firebase");
        const dbInstance = getDB();
        if (!dbInstance) return;

        const [wealthSnap, careerSnap, loveSnap, vitalitySnap, yearlySnap, monthlySnap] = await Promise.all([
          getDoc(doc(dbInstance, "formula_configs", "wealth")),
          getDoc(doc(dbInstance, "formula_configs", "career")),
          getDoc(doc(dbInstance, "formula_configs", "love")),
          getDoc(doc(dbInstance, "formula_configs", "vitality")),
          getDoc(doc(dbInstance, "formula_configs", "yearly_cycles")),
          getDoc(doc(dbInstance, "formula_configs", "zodiac_monthly")),
        ]);

        if (wealthSnap.exists()) {
          setFormulaConfigs({
            wealth: wealthSnap.data(),
            career: careerSnap.exists() ? careerSnap.data() : null,
            love: loveSnap.exists() ? loveSnap.data() : null,
            vitality: vitalitySnap.exists() ? vitalitySnap.data() : null,
          });
        }
        if (yearlySnap.exists()) {
          setYearlyConfigs(yearlySnap.data().data || {});
        }
        if (monthlySnap.exists()) {
          setMonthlyConfigs(monthlySnap.data().data || {});
        }
      } catch (e) {
        console.warn("Failed to load formula configs from Firestore:", e);
      }
    }
    loadConfigs();
  }, []);

  const kData = analysis
    ? generateKLineData(analysis.bazi, analysis.western, timeTab, TIME_TABS.find(t => t.key === timeTab)!.count, yearlyConfigs, monthlyConfigs)
    : generateKLineData(null, null, timeTab, TIME_TABS.find(t => t.key === timeTab)!.count, yearlyConfigs, monthlyConfigs);

  useEffect(() => {
    const stored = localStorage.getItem('fatexi_user');
    if (stored) {
      const userData = JSON.parse(stored);
      setUser(userData);
      
      // Try to read cached analysis
      const cached = localStorage.getItem('fatexi_analysis');
      if (cached) {
        const parsed = JSON.parse(cached);
        setAnalysis(parsed);
        setMetrics(generateMetricsFromAnalysis(parsed, monthlyConfigs));
      }
      
      // Fetch fresh analysis only if no cached result
      if (!cached) {
        setAnalysisLoading(true);
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 120000);
        
        fetch('/api/analyze', {
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
        })
          .then(r => r.json())
          .then(result => {
            clearTimeout(timeout);
            setAnalysisLoading(false);
            if (result.success && result.data) {
              setAnalysis(result.data);
              localStorage.setItem('fatexi_analysis', JSON.stringify(result.data));
              setMetrics(generateMetricsFromAnalysis(result.data, monthlyConfigs));
            }
          })
          .catch(() => {
            clearTimeout(timeout);
            setAnalysisLoading(false);
          });
      }
    }
  }, [monthlyConfigs]);

  // Refresh metrics every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      if (analysis) {
        setMetrics(generateMetricsFromAnalysis(analysis, monthlyConfigs));
      }
    }, 30000);
    return () => clearInterval(interval);
  }, [analysis, monthlyConfigs]);

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
      {/* Progress bar */}
      <div className="fixed top-0 left-0 right-0 z-[100] h-px">
        <div 
          className="h-full"
          style={{ 
            width: `${scrollProgress * 100}%`,
            background: 'linear-gradient(90deg, #00D4FF, #8B5CF6)',
            transition: 'width 0.1s linear',
            boxShadow: '0 0 15px rgba(0,212,255,0.4)'
          }}
        />
      </div>

      {/* Top Nav */}
      <header className="fixed top-0 left-0 right-0 z-50 px-6 md:px-8 py-3 flex items-center justify-between" style={{ background: 'rgba(3,3,8,0.9)', backdropFilter: 'blur(16px)', borderBottom: '1px solid rgba(0,212,255,0.06)' }}>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold" style={{ background: 'linear-gradient(135deg, #00D4FF 0%, #FF006E 100%)', color: 'white', fontFamily: 'var(--font-mono)' }}>象</div>
          <span className="text-sm font-medium" style={{ color: '#666680' }}>Fatexi</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs" style={{ color: '#666680' }}>{user?.name || '用戶'} · {metrics?.time || '--:--'}</span>
          <button onClick={() => { localStorage.removeItem('fatexi_user'); window.location.href = '/'; }} className="px-4 py-2 rounded-lg text-sm" style={{ color: '#666680', border: '1px solid rgba(0,212,255,0.1)' }}>
            登出
          </button>
        </div>
      </header>

      <div className="pt-16">
        {/* ── SECTION 1: HERO ── */}
        <section className="min-h-[60vh] flex items-center justify-center px-6 pb-16 relative overflow-hidden">
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[700px] h-[700px] rounded-full" style={{ background: 'radial-gradient(circle, rgba(0,212,255,0.06) 0%, transparent 65%)' }} />
          </div>
          <div className="text-center relative z-10 max-w-3xl mx-auto">
            <RevealSection>
              <div className="text-sm tracking-[0.5em] mb-4" style={{ color: '#666680' }}>{user?.name || '用戶'} 的命運</div>
            </RevealSection>
            <RevealSection delay={150}>
              <div className="mb-6 flex justify-center">
                <FatexiBall score={metrics?.total ?? 65} />
              </div>
            </RevealSection>
            <RevealSection delay={300}>
              <div className="text-sm" style={{ color: '#666680' }}>綜合萬象值 · 更新 {metrics?.time || '--:--'}</div>
            </RevealSection>
          </div>
        </section>

        {/* ── SECTION 2: FOUR METRICS ── */}
        <section className="py-16 px-6">
          <div className="max-w-5xl mx-auto">
            <RevealSection>
              <div className="text-center mb-12">
                <div className="text-sm tracking-[0.4em] mb-3" style={{ color: '#666680' }}>FOUR INDICATORS</div>
                <h2 className="text-[2rem] md:text-[3rem] font-bold" style={{ color: '#FFFFFF' }}>四維命運指數</h2>
              </div>
            </RevealSection>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {METRICS.map((m, i) => {
                const val = metrics?.[m.key] ?? 100;
                // 成長指數：100 = 基準，>100 = 成長，<100 = 低於基準
                const growthLabel = val > 100 ? `+${val - 100}` : val < 100 ? `${val - 100}` : '0';
                // Progress bar：70-170 映射到 0-100%
                const barWidth = Math.min(100, Math.max(0, ((val - 70) / 100) * 100));
                return (
                  <RevealSection key={m.key} delay={i * 100}>
                    <div 
                      className="rounded-2xl p-6 text-center"
                      style={{ 
                        background: 'linear-gradient(135deg, #0D0D1A 0%, #080814 100%)',
                        border: `1px solid ${m.color}20`,
                        boxShadow: `0 0 20px ${m.color}08`
                      }}
                    >
                      <div className="text-3xl mb-3">{m.emoji}</div>
                      <div className="text-3xl font-bold mb-0.5" style={{ color: m.color, fontFamily: 'var(--font-mono)' }}>{val}</div>
                      <div className="text-xs mb-1" style={{ color: val > 115 ? '#00FF88' : val < 90 ? '#FF3366' : '#666680' }}>
                        {growthLabel}%
                      </div>
                      <div className="text-xs mb-2" style={{ color: '#666680' }}>{m.name}</div>
                      <div className="h-1 rounded-full" style={{ background: 'rgba(255,255,255,0.05)' }}>
                        <div className="h-full rounded-full" style={{ width: barWidth + '%', background: m.color, boxShadow: `0 0 6px ${m.color}` }} />
                      </div>
                    </div>
                  </RevealSection>
                );
              })}
            </div>
          </div>
        </section>

        {/* ── SECTION 3: K-LINE CHART ── */}
        <section className="py-16 px-6">
          <div className="max-w-5xl mx-auto">
            <RevealSection>
              <div className="mb-8">
                <div className="text-sm tracking-[0.4em] mb-3" style={{ color: '#00D4FF' }}>K LINE TREND</div>
                <h2 className="text-[2rem] md:text-[3rem] font-bold mb-6" style={{ color: '#FFFFFF' }}>萬象 K 線</h2>
                
                {/* Time tabs */}
                <div className="flex gap-2 mb-8">
                  {TIME_TABS.map(t => (
                    <button
                      key={t.key}
                      onClick={() => setTimeTab(t.key)}
                      className="px-5 py-2 rounded-lg text-sm font-medium transition-all"
                      style={{
                        background: timeTab === t.key ? 'rgba(0,212,255,0.15)' : 'rgba(0,0,0,0.2)',
                        border: timeTab === t.key ? '1px solid rgba(0,212,255,0.4)' : '1px solid rgba(0,212,255,0.1)',
                        color: timeTab === t.key ? '#00D4FF' : '#666680'
                      }}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="rounded-2xl overflow-hidden" style={{ background: 'linear-gradient(135deg, #0D0D1A 0%, #080814 100%)', border: '1px solid rgba(0,212,255,0.1)' }}>
                <div className="h-72 md:h-96 p-6">
                  <ResponsiveContainer width="100%" height="100%" minHeight={240}>
                    <ComposedChart data={kData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,212,255,0.05)" />
                      <XAxis 
                        dataKey="label" 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{ fill: '#666680', fontSize: 11 }} 
                        interval="preserveStartEnd"
                      />
                      <YAxis 
                        domain={[70, 170]} 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{ fill: '#666680', fontSize: 11 }}
                        tickFormatter={v => `${v}`}
                      />
                      
                      {/* Reference line at 100 (baseline) */}
                      <ReferenceLine y={100} stroke="rgba(255,255,255,0.1)" strokeDasharray="4 4" label={{ value: '基準100', position: 'insideTopRight', fill: 'rgba(255,255,255,0.25)', fontSize: 10 }} />

                      <Tooltip 
                        contentStyle={{ background: '#0D0D1A', border: '1px solid rgba(0,212,255,0.3)', borderRadius: '8px', color: '#E0E0E0', fontFamily: 'var(--font-mono)', fontSize: '12px' }}
                        formatter={(value: any, name: any) => {
                          const names: Record<string, string> = { open: '開盤', current: '現在', close: '收盤', ma5: 'MA5', ma10: 'MA10', wealth: '💰財富', career: '💼事業', love: '❤️感情', vitality: '⚡能量' };
                          return [`${value}`, `${names[String(name)] || String(name)}`];
                        }}
                        labelFormatter={(label: any) => `${label}`}
                      />
                      
                      {/* MA5 line */}
                      <Line type="monotone" dataKey="ma5" stroke="#8B5CF6" strokeWidth={1.5} dot={false} strokeDasharray="5 3" strokeOpacity={0.7} name="MA5" />
                      
                      {/* MA10 line */}
                      <Line type="monotone" dataKey="ma10" stroke="#FF006E" strokeWidth={1.5} dot={false} strokeDasharray="5 3" strokeOpacity={0.5} name="MA10" />
                      
                      {/* 金叉死叉標記 */}
                      {kData.map((d, i) => {
                        if (i < 9 || !d.ma5 || !d.ma10) return null;
                        const prev = kData[i - 1];
                        if (!prev.ma5 || !prev.ma10) return null;
                        const goldCross = prev.ma5 <= prev.ma10 && d.ma5 > d.ma10;
                        const deathCross = prev.ma5 >= prev.ma10 && d.ma5 < d.ma10;
                        if (!goldCross && !deathCross) return null;
                        return (
                          <ReferenceLine
                            key={`cross-${d.label}`}
                            x={d.label}
                            stroke={goldCross ? '#00FF88' : '#FF3366'}
                            strokeWidth={2}
                            label={{
                              value: goldCross ? '金叉' : '死叉',
                              position: 'top',
                              fill: goldCross ? '#00FF88' : '#FF3366',
                              fontSize: 10,
                              fontFamily: 'var(--font-mono)',
                            }}
                          />
                        );
                      })}
                      
                      {/* 3 candles: open / current / close */}
                      <Bar dataKey="open" fill="#444460" opacity={0.6} />
                      <Bar dataKey="current" fill="#00D4FF" opacity={0.85} />
                      <Bar dataKey="close" fill="#FF3366" opacity={0.9} />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex flex-wrap gap-4 px-6 pb-3" style={{ borderTop: '1px solid rgba(0,212,255,0.06)' }}>
                  <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-sm" style={{ background: '#444460', opacity: 0.6 }} /><span className="text-xs" style={{ color: '#666680' }}>開盤</span></div>
                  <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-sm" style={{ background: '#00D4FF' }} /><span className="text-xs" style={{ color: '#666680' }}>現在</span></div>
                  <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-sm" style={{ background: '#FF3366' }} /><span className="text-xs" style={{ color: '#666680' }}>陽線（成長）</span></div>
                  <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-sm" style={{ background: '#00FF88' }} /><span className="text-xs" style={{ color: '#666680' }}>陰線（回落）</span></div>
                  <div className="flex items-center gap-2"><div className="w-4 h-0.5 rounded" style={{ borderTop: '1.5px dashed #8B5CF6' }} /><span className="text-xs" style={{ color: '#666680' }}>MA5</span></div>
                  <div className="flex items-center gap-2"><div className="w-4 h-0.5 rounded" style={{ borderTop: '1.5px dashed #FF006E' }} /><span className="text-xs" style={{ color: '#666680' }}>MA10</span></div>
                  <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-sm" style={{ background: '#00FF88' }} /><span className="text-xs" style={{ color: '#666680' }}>金叉</span></div>
                  <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-sm" style={{ background: '#FF3366' }} /><span className="text-xs" style={{ color: '#666680' }}>死叉</span></div>
                </div>
                <div className="px-6 pb-4 text-xs space-y-1" style={{ color: '#555570', borderTop: '1px solid rgba(0,212,255,0.04)' }}>
                  <div>指數 100 = 出生基準點　　&gt;100 = 成長低於基準　　&lt;100 = 低於基準</div>
                  <div>陽線（紅）= 收盤 &gt; 開盤（能量累積，後期做決策）　　陰線（綠）= 收盤 &lt; 開盤（能量流失，建議及早處理）</div>
                  <div>金叉（MA5上穿MA10）= 能量轉折上升　　死叉（MA5下穿MA10）= 能量轉折下降</div>
                </div>
              </div>
            </RevealSection>
          </div>
        </section>

        {/* ── SECTION 4: AI INTERPRETATION ── */}
        <section className="py-16 px-6">
          <div className="max-w-4xl mx-auto">
            <RevealSection>
              <div className="mb-8">
                <div className="text-sm tracking-[0.4em] mb-3" style={{ color: '#8B5CF6' }}>AI INTERPRETATION</div>
                <h2 className="text-[2rem] md:text-[3rem] font-bold mb-8" style={{ color: '#FFFFFF' }}>AI 萬象解讀</h2>
              </div>

              {/* Theory cards - from real analysis or show loading */}
              <div className="space-y-4 mb-8">
                {analysis?.bazi ? (
                  <>
                    <div className="rounded-2xl p-6" style={{ background: 'linear-gradient(135deg, #0D0D1A 0%, #111128 100%)', border: '1px solid rgba(139,92,246,0.15)' }}>
                      <div className="flex items-center gap-2 mb-3">
                        <span className="text-xs px-2 py-0.5 rounded" style={{ background: 'rgba(139,92,246,0.15)', color: '#8B5CF6' }}>八字</span>
                      </div>
                      <p className="text-sm mb-1" style={{ color: '#E0E0E0' }}>四柱：{analysis.bazi.yearPillar} / {analysis.bazi.monthPillar} / {analysis.bazi.dayPillar} / {analysis.bazi.hourPillar}</p>
                      <p className="text-xs" style={{ color: '#666680' }}>日主 {analysis.bazi.dayPillar[0]} — 命盤已根據你的出生年月日時重新計算</p>
                    </div>
                    <div className="rounded-2xl p-6" style={{ background: 'linear-gradient(135deg, #0D0D1A 0%, #111128 100%)', border: '1px solid rgba(0,212,255,0.15)' }}>
                      <div className="flex items-center gap-2 mb-3">
                        <span className="text-xs px-2 py-0.5 rounded" style={{ background: 'rgba(0,212,255,0.15)', color: '#00D4FF' }}>星座</span>
                      </div>
                      <p className="text-sm mb-1" style={{ color: '#E0E0E0' }}>太陽 {analysis.western.sunSign} · 月亮 {analysis.western.moonSign}</p>
                      <p className="text-xs" style={{ color: '#666680' }}>星座已根據公曆日期計算</p>
                    </div>
                    {analysis.analysis && (
                      <div className="rounded-2xl p-6" style={{ background: 'linear-gradient(135deg, #0D0D1A 0%, #111128 100%)', border: '1px solid rgba(0,255,136,0.15)' }}>
                        <div className="flex items-center gap-2 mb-3">
                          <span className="text-xs px-2 py-0.5 rounded" style={{ background: 'rgba(0,255,136,0.15)', color: '#00FF88' }}>命書</span>
                        </div>
                        <div className="text-sm leading-loose whitespace-pre-wrap" style={{ color: '#CCCCDD', lineHeight: 2, maxHeight: '300px', overflowY: 'auto' }}>
                          {analysis.analysis}
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="rounded-2xl p-8 text-center" style={{ background: 'linear-gradient(135deg, #0D0D1A 0%, #111128 100%)', border: '1px solid rgba(0,212,255,0.08)' }}>
                    <p className="text-sm" style={{ color: '#666680' }}>命書分析載入中...</p>
                  </div>
                )}
              </div>

              {/* 宜忌 */}
              <div className="grid grid-cols-2 gap-4 mb-8">
                {[
                  { label: "宜", items: ["洽談合作", "主動表達", "處理財務"], color: '#00FF88' },
                  { label: "忌", items: ["衝動投資", "借貸保證", "激烈談判"], color: '#FF3366' },
                ].map(g => (
                  <div key={g.label} className="rounded-2xl p-5" style={{ background: 'linear-gradient(135deg, #0D0D1A 0%, #111128 100%)', border: `1px solid ${g.color}20` }}>
                    <div className="text-sm font-medium mb-3" style={{ color: g.color }}>{g.label}</div>
                    <div className="space-y-2">
                      {g.items.map(item => (
                        <div key={item} className="flex items-center gap-2 text-sm" style={{ color: '#9999AA' }}>
                          <div className="w-1 h-1 rounded-full" style={{ background: g.color }} />
                          {item}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              {/* AI Quote - from analysis or default */}
              <blockquote className="text-[1.3rem] md:text-[1.8rem] font-light leading-relaxed p-8 rounded-2xl" style={{ background: 'rgba(0,212,255,0.03)', border: '1px solid rgba(0,212,255,0.1)', color: '#CCCCDD', fontFamily: 'var(--font-mono)', textShadow: '0 0 30px rgba(0,212,255,0.1)' }}>
                「此刻你是社交核心，大膽提出你的想法。行星能量正在支持你的表達，太陽與火星形成有利相位。」
              </blockquote>
            </RevealSection>
          </div>
        </section>

        {/* ── SECTION 5: COMPASS ── */}
        <section className="py-16 px-6">
          <div className="max-w-3xl mx-auto">
            <RevealSection>
              <div className="text-center mb-12">
                <div className="text-sm tracking-[0.4em] mb-3" style={{ color: '#FF006E' }}>SPATIAL FATE</div>
                <h2 className="text-[2rem] md:text-[3rem] font-bold mb-12" style={{ color: '#FFFFFF' }}>萬象羅盤</h2>
              </div>

              {/* Compass visual */}
              <div className="flex justify-center mb-12">
                <div className="relative w-56 h-56">
                  <svg viewBox="0 0 300 300" className="w-full h-full">
                    {[60, 100, 140].map(r => (
                      <circle key={r} cx="150" cy="150" r={r} fill="none" stroke="rgba(0,212,255,0.05)" strokeWidth="1" />
                    ))}
                    {['N', 'E', 'S', 'W'].map((d, i) => {
                      const angle = i * 90;
                      const rad = (angle - 90) * Math.PI / 180;
                      const x = 150 + 130 * Math.cos(rad);
                      const y = 150 + 130 * Math.sin(rad);
                      return (
                        <text key={d} x={x} y={y} textAnchor="middle" dominantBaseline="middle" fill={d === 'N' ? '#FF3366' : 'rgba(0,212,255,0.4)'} fontSize="14" fontFamily="var(--font-mono)" fontWeight="600">
                          {d}
                        </text>
                      );
                    })}
                    <g transform="rotate(45 150 150)">
                      <polygon points="150,40 145,150 155,150" fill="#FF3366" opacity="0.9" />
                      <polygon points="150,260 145,150 155,150" fill="#00D4FF" opacity="0.4" />
                    </g>
                    <circle cx="150" cy="150" r="5" fill="#0D0D1A" stroke="#00D4FF" strokeWidth="2" />
                    <circle cx="150" cy="150" r="2" fill="#00D4FF" />
                  </svg>
                </div>
              </div>

              {/* Direction cards */}
              <div className="grid grid-cols-2 gap-4">
                {COMPASS_DIRS.map((dir, i) => (
                  <RevealSection key={dir.name} delay={i * 100}>
                    <div className="rounded-2xl p-5 text-center transition-all duration-500" style={{ background: 'linear-gradient(135deg, #0D0D1A 0%, #080814 100%)', border: `1px solid ${dir.color}20`, boxShadow: `0 0 20px ${dir.color}08` }}>
                      <div className="text-3xl mb-2">{dir.emoji}</div>
                      <div className="text-sm font-medium mb-1" style={{ color: dir.color }}>{dir.name}</div>
                      <div className="text-xs" style={{ color: '#666680' }}>{dir.desc}</div>
                    </div>
                  </RevealSection>
                ))}
              </div>
            </RevealSection>
          </div>
        </section>

        {/* ── FOOTER ── */}
        <footer className="px-6 py-12 text-center" style={{ borderTop: '1px solid rgba(0,212,255,0.06)' }}>
          <p className="text-xs" style={{ color: '#444460' }}>命的形狀，萬象承載 · Fatexi © 2026</p>
        </footer>
      </div>
    </div>
  );
}
