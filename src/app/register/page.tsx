"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { db } from "@/lib/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";

const SHI_CHEN = [
  { value: "子", label: "子 (23:00-00:59)" },
  { value: "丑", label: "丑 (01:00-02:59)" },
  { value: "寅", label: "寅 (03:00-04:59)" },
  { value: "卯", label: "卯 (05:00-06:59)" },
  { value: "辰", label: "辰 (07:00-08:59)" },
  { value: "巳", label: "巳 (09:00-10:59)" },
  { value: "午", label: "午 (11:00-12:59)" },
  { value: "未", label: "未 (13:00-14:59)" },
  { value: "申", label: "申 (15:00-16:59)" },
  { value: "酉", label: "酉 (17:00-18:59)" },
  { value: "戌", label: "戌 (19:00-20:59)" },
  { value: "亥", label: "亥 (21:00-22:59)" },
];

export default function RegisterPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: "",
    year: "",
    month: "",
    day: "",
    hour: "",
    gender: "",
    location: "",
  });

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 100 }, (_, i) => currentYear - 80 + i);
  const months = Array.from({ length: 12 }, (_, i) => i + 1);
  const days = Array.from({ length: 31 }, (_, i) => i + 1);

  const canProceed = () => {
    if (step === 1) return form.name.trim().length > 0;
    if (step === 2) return form.year && form.month && form.day && form.hour && form.gender;
    return true;
  };

  const handleNext = async () => {
    if (!canProceed()) return;
    if (step < 3) {
      setStep(step + 1);
    } else {
      // Submit and go to onboarding
      setLoading(true);
      localStorage.setItem('fatexi_user', JSON.stringify(form));

      // Save to Firestore with timeout
      if (db) {
        try {
          const writePromise = addDoc(collection(db, "users"), {
            ...form,
            registeredAt: serverTimestamp(),
            status: "active",
          });
          const timeoutPromise = new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Firestore timeout')), 5000)
          );
          await Promise.race([writePromise, timeoutPromise]);
        } catch (e) {
          console.warn("Firestore write failed, continuing anyway:", e);
        }
      }

      await new Promise(r => setTimeout(r, 500));
      router.push('/onboarding');
    }
  };

  return (
    <div className="min-h-screen flex flex-col" style={{ background: '#030308' }}>
      {/* Header */}
      <header className="px-6 py-5 flex items-center justify-between" style={{ borderBottom: '1px solid rgba(0,212,255,0.06)' }}>
        <Link href="/" className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold" style={{ background: 'linear-gradient(135deg, #00D4FF, #FF006E)', color: 'white', fontFamily: 'var(--font-mono)' }}>象</div>
          <span className="text-sm font-medium" style={{ color: '#666680' }}>Fatexi</span>
        </Link>
        <span className="text-sm" style={{ color: '#666680' }}>
          已有帳戶？<Link href="/onboarding" className="underline" style={{ color: '#00D4FF' }}>登入</Link>
        </span>
      </header>

      {/* Progress */}
      <div className="px-6 pt-8 pb-4">
        <div className="max-w-md mx-auto">
          <div className="flex items-center gap-2 mb-4">
            {[1, 2, 3].map(s => (
              <div key={s} className="flex-1 h-1 rounded-full" style={{ background: s <= step ? '#00D4FF' : 'rgba(0,212,255,0.1)' }} />
            ))}
          </div>
          <p className="text-sm" style={{ color: '#666680' }}>
            {step === 1 && '步驟 1/3：基本資料'}
            {step === 2 && '步驟 2/3：出生資訊'}
            {step === 3 && '步驟 3/3：確認位置'}
          </p>
        </div>
      </div>

      {/* Form */}
      <div className="flex-1 px-6 pb-10">
        <div className="max-w-md mx-auto">
          {step === 1 && (
            <div className="space-y-8 fade-up">
              <div>
                <h1 className="text-4xl font-bold mb-3" style={{ color: '#FFFFFF' }}>你叫什麼名字？</h1>
                <p className="text-base" style={{ color: '#666680' }}>系統會以姓名學為你分析</p>
              </div>
              <div>
                <label className="block text-sm font-medium mb-3" style={{ color: '#9999AA' }}>姓名</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={e => setForm({ ...form, name: e.target.value })}
                  placeholder="請輸入你的姓名"
                  autoFocus
                  className="w-full px-5 py-4 rounded-xl text-lg"
                  style={{ background: '#0D0D1A', border: '1px solid rgba(0,212,255,0.2)', color: '#FFFFFF', fontSize: '18px' }}
                />
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-8 fade-up">
              <div>
                <h1 className="text-4xl font-bold mb-3" style={{ color: '#FFFFFF' }}>何時出生？</h1>
                <p className="text-base" style={{ color: '#666680' }}>精確生辰用於八字與占星分析</p>
              </div>
              <div>
                <label className="block text-sm font-medium mb-3" style={{ color: '#9999AA' }}>出生年月日時（公曆）</label>
                <div className="grid grid-cols-2 gap-3 mb-4">
                  <select
                    value={form.year}
                    onChange={e => setForm({ ...form, year: e.target.value })}
                    className="px-4 py-4 rounded-xl text-base"
                    style={{ background: '#0D0D1A', border: '1px solid rgba(0,212,255,0.2)', color: form.year ? '#FFFFFF' : '#666680', fontSize: '16px' }}
                  >
                    <option value="">年</option>
                    {years.map(y => <option key={y} value={y}>{y}</option>)}
                  </select>
                  <select
                    value={form.month}
                    onChange={e => setForm({ ...form, month: e.target.value })}
                    className="px-4 py-4 rounded-xl text-base"
                    style={{ background: '#0D0D1A', border: '1px solid rgba(0,212,255,0.2)', color: form.month ? '#FFFFFF' : '#666680', fontSize: '16px' }}
                  >
                    <option value="">月</option>
                    {months.map(m => <option key={m} value={m}>{m}</option>)}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-3 mb-4">
                  <select
                    value={form.day}
                    onChange={e => setForm({ ...form, day: e.target.value })}
                    className="px-4 py-4 rounded-xl text-base"
                    style={{ background: '#0D0D1A', border: '1px solid rgba(0,212,255,0.2)', color: form.day ? '#FFFFFF' : '#666680', fontSize: '16px' }}
                  >
                    <option value="">日</option>
                    {days.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                  <select
                    value={form.hour}
                    onChange={e => setForm({ ...form, hour: e.target.value })}
                    className="px-4 py-4 rounded-xl text-base"
                    style={{ background: '#0D0D1A', border: '1px solid rgba(0,212,255,0.2)', color: form.hour ? '#FFFFFF' : '#666680', fontSize: '16px' }}
                  >
                    <option value="">時辰</option>
                    {SHI_CHEN.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-3" style={{ color: '#9999AA' }}>性別</label>
                <div className="grid grid-cols-2 gap-3">
                  {['男', '女'].map(g => (
                    <button
                      key={g}
                      onClick={() => setForm({ ...form, gender: g })}
                      className="p-4 rounded-xl text-lg font-medium text-center transition-all"
                      style={{
                        background: form.gender === g ? 'rgba(0,212,255,0.15)' : '#0D0D1A',
                        border: form.gender === g ? '1px solid rgba(0,212,255,0.5)' : '1px solid rgba(0,212,255,0.2)',
                        color: form.gender === g ? '#00D4FF' : '#666680',
                        fontSize: '18px'
                      }}
                    >
                      {g}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-8 fade-up">
              <div>
                <h1 className="text-4xl font-bold mb-3" style={{ color: '#FFFFFF' }}>住在哪裡？</h1>
                <p className="text-base" style={{ color: '#666680' }}>用於奇門遁甲與地理方位分析</p>
              </div>
              <div>
                <label className="block text-sm font-medium mb-3" style={{ color: '#9999AA' }}>出生/居住地（城市即可）</label>
                <input
                  type="text"
                  value={form.location}
                  onChange={e => setForm({ ...form, location: e.target.value })}
                  placeholder="例如：台北市"
                  autoFocus
                  className="w-full px-5 py-4 rounded-xl text-lg"
                  style={{ background: '#0D0D1A', border: '1px solid rgba(0,212,255,0.2)', color: '#FFFFFF', fontSize: '18px' }}
                />
              </div>
            </div>
          )}

          {/* Navigation */}
          <div className="mt-12 space-y-4">
            <button
              onClick={handleNext}
              disabled={!canProceed() || loading}
              className="w-full py-5 rounded-xl text-lg font-semibold transition-all"
              style={{ 
                background: canProceed() ? 'linear-gradient(135deg, #00D4FF 0%, #8B5CF6 100%)' : 'rgba(0,212,255,0.1)',
                color: canProceed() ? '#030308' : 'rgba(0,212,255,0.3)',
                fontSize: '18px',
                cursor: canProceed() ? 'pointer' : 'not-allowed'
              }}
            >
              {loading ? '處理中...' : step < 3 ? '繼續' : '開始分析'}
            </button>
            {step > 1 && (
              <button
                onClick={() => setStep(step - 1)}
                className="w-full py-4 rounded-xl text-base"
                style={{ background: 'transparent', border: '1px solid rgba(0,212,255,0.1)', color: '#666680' }}
              >
                上一步
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
