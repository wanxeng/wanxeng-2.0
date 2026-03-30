"use client";

import { useState, useEffect } from "react";
import {
  collection,
  getDocs,
  doc,
  getDoc,
  query,
  orderBy,
  limit,
  startAfter,
  where,
  Timestamp,
  type Firestore,
} from "firebase/firestore";
import type { User as FirebaseUser } from "firebase/auth";

const ADMIN_EMAIL = "yowaytsao@gmail.com";

type Tab = "members" | "formula" | "yearly" | "monthly" | "kline";

interface User {
  id: string;
  name: string;
  year: string;
  month: string;
  day: string;
  hour: string;
  gender: string;
  location: string;
  registeredAt: Timestamp | null;
  status: string;
}

interface FormulaConfig {
  name: string;
  emoji?: string;
  base: number;
  factors?: Record<string, { weight: number; desc: string }>;
  data?: Record<string, any>;
}

interface KLineSettings {
  name: string;
  ma5: number;
  ma10: number;
  goldenCross: string;
  deathCross: string;
  yangLine: string;
  yinLine: string;
}

export default function AdminPage() {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>("members");
  const [error, setError] = useState<string | null>(null);

  // Members data
  const [users, setUsers] = useState<User[]>([]);
  const [lastDoc, setLastDoc] = useState<any>(null);
  const [hasMore, setHasMore] = useState(true);
  const [search, setSearch] = useState("");
  const [stats, setStats] = useState({ total: 0, today: 0 });

  // Formula data
  const [formulas, setFormulas] = useState<Record<string, FormulaConfig>>({});
  const [yearlyData, setYearlyData] = useState<Record<string, any>>({});
  const [monthlyData, setMonthlyData] = useState<Record<string, any>>({});
  const [klineSettings, setKlineSettings] = useState<KLineSettings | null>(null);

  useEffect(() => {
    async function initFirebase() {
      try {
        const { getAuthInstance } = await import("@/lib/firebase");
        const authInstance = getAuthInstance();
        if (!authInstance) {
          setLoading(false);
          return;
        }
        const { onAuthStateChanged } = await import("firebase/auth");
        const unsub = onAuthStateChanged(authInstance, (u: FirebaseUser | null) => {
          setUser(u);
          setLoading(false);
        });
        return unsub;
      } catch (e: any) {
        console.error("Firebase init error:", e);
        setError(e.message || "Firebase initialization failed");
        setLoading(false);
      }
    }
    const cleanup = initFirebase();
    return () => { cleanup.then((unsub: any) => unsub && unsub()); };
  }, []);

  useEffect(() => {
    if (user && user.email === ADMIN_EMAIL) {
      if (activeTab === "members") {
        fetchUsers();
        fetchStats();
      } else if (activeTab === "formula") {
        fetchFormulas();
      } else if (activeTab === "yearly") {
        fetchYearlyData();
      } else if (activeTab === "monthly") {
        fetchMonthlyData();
      } else if (activeTab === "kline") {
        fetchKLineSettings();
      }
    }
  }, [user, activeTab]);

  async function fetchUsers(isNextPage = false) {
    try {
      const { getDB } = await import("@/lib/firebase");
      const dbInstance = getDB();
      if (!dbInstance) return;

      let q = query(collection(dbInstance, "users"), orderBy("registeredAt", "desc"), limit(20));
      if (isNextPage && lastDoc) {
        q = query(collection(dbInstance, "users"), orderBy("registeredAt", "desc"), startAfter(lastDoc), limit(20));
      }
      if (search.trim()) {
        q = query(collection(dbInstance, "users"), where("name", ">=", search), where("name", "<=", search + "\uf8ff"), orderBy("name"), limit(20));
      }

      const snap = await getDocs(q);
      const data = snap.docs.map((doc) => ({ id: doc.id, ...doc.data() })) as User[];
      if (isNextPage) setUsers((prev) => [...prev, ...data]);
      else setUsers(data);
      setLastDoc(snap.docs[snap.docs.length - 1] || null);
      setHasMore(snap.docs.length === 20);
    } catch (e) {
      console.error("Fetch users error:", e);
    }
  }

  async function fetchStats() {
    try {
      const { getDB } = await import("@/lib/firebase");
      const dbInstance = getDB();
      if (!dbInstance) return;
      const snap = await getDocs(collection(dbInstance, "users"));
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayCount = snap.docs.filter((doc) => {
        const data = doc.data() as User;
        if (!data.registeredAt) return false;
        return data.registeredAt.toDate() >= today;
      }).length;
      setStats({ total: snap.size, today: todayCount });
    } catch (e) {
      console.error("Fetch stats error:", e);
    }
  }

  async function fetchFormulas() {
    try {
      const { getDB } = await import("@/lib/firebase");
      const dbInstance = getDB();
      if (!dbInstance) return;
      const keys = ["wealth", "career", "love", "vitality"];
      const result: Record<string, FormulaConfig> = {};
      for (const key of keys) {
        const snap = await getDoc(doc(dbInstance, "formula_configs", key));
        if (snap.exists()) result[key] = snap.data() as FormulaConfig;
      }
      setFormulas(result);
    } catch (e) {
      console.error("Fetch formulas error:", e);
    }
  }

  async function fetchYearlyData() {
    try {
      const { getDB } = await import("@/lib/firebase");
      const dbInstance = getDB();
      if (!dbInstance) return;
      const snap = await getDoc(doc(dbInstance, "formula_configs", "yearly_cycles"));
      if (snap.exists()) setYearlyData(snap.data().data || {});
    } catch (e) {
      console.error("Fetch yearly data error:", e);
    }
  }

  async function fetchMonthlyData() {
    try {
      const { getDB } = await import("@/lib/firebase");
      const dbInstance = getDB();
      if (!dbInstance) return;
      const snap = await getDoc(doc(dbInstance, "formula_configs", "zodiac_monthly"));
      if (snap.exists()) setMonthlyData(snap.data().data || {});
    } catch (e) {
      console.error("Fetch monthly data error:", e);
    }
  }

  async function fetchKLineSettings() {
    try {
      const { getDB } = await import("@/lib/firebase");
      const dbInstance = getDB();
      if (!dbInstance) return;
      const snap = await getDoc(doc(dbInstance, "formula_configs", "kline_settings"));
      if (snap.exists()) setKlineSettings(snap.data() as KLineSettings);
    } catch (e) {
      console.error("Fetch kline settings error:", e);
    }
  }

  async function handleSignIn() {
    try {
      const { getAuthInstance, getGoogleProvider } = await import("@/lib/firebase");
      const authInstance = getAuthInstance();
      const provider = getGoogleProvider();
      if (!authInstance || !provider) return;
      const { signInWithPopup } = await import("firebase/auth");
      await signInWithPopup(authInstance, provider);
    } catch (e) {
      console.error("Sign in error:", e);
    }
  }

  async function handleSignOut() {
    try {
      const { getAuthInstance } = await import("@/lib/firebase");
      const authInstance = getAuthInstance();
      if (!authInstance) return;
      const { signOut } = await import("firebase/auth");
      await signOut(authInstance);
      setUsers([]);
    } catch (e) {
      console.error("Sign out error:", e);
    }
  }

  function formatDate(ts: Timestamp | null) {
    if (!ts) return "-";
    return ts.toDate().toLocaleString("zh-TW", {
      year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit",
    });
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "#030308" }}>
        <p style={{ color: "#666680" }}>載入中...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center" style={{ background: "#030308" }}>
        <p style={{ color: "#FF3366" }}>初始化錯誤: {error}</p>
        <button onClick={() => window.location.reload()} className="mt-4 px-4 py-2 rounded-lg" style={{ background: "rgba(0,212,255,0.15)", color: "#00D4FF" }}>
          重新整理
        </button>
      </div>
    );
  }

  if (!user || user.email !== ADMIN_EMAIL) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-6" style={{ background: "#030308" }}>
        <div className="w-full max-w-sm">
          <div className="text-center mb-8">
            <div className="w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center text-2xl font-bold"
              style={{ background: "linear-gradient(135deg, #00D4FF, #FF006E)", color: "white" }}>象</div>
            <h1 className="text-2xl font-bold mb-2" style={{ color: "#FFFFFF" }}>Fatexi 管理後台</h1>
            <p className="text-sm" style={{ color: "#666680" }}>請以管理員帳號登入</p>
          </div>
          {user && user.email !== ADMIN_EMAIL && (
            <div className="mb-4 p-4 rounded-xl text-sm text-center" style={{ background: "rgba(255,51,102,0.1)", border: "1px solid rgba(255,51,102,0.3)", color: "#FF3366" }}>
              無權限：{user.email}
            </div>
          )}
          <button onClick={handleSignIn} className="w-full py-4 rounded-xl text-base font-semibold flex items-center justify-center gap-3"
            style={{ background: "#FFFFFF", color: "#030308" }}>
            <svg width="18" height="18" viewBox="0 0 18 18"><path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 01-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z"/><path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z"/><path fill="#FBBC05" d="M3.964 10.71A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 000 9c0 1.452.348 2.827.957 4.042l3.007-2.332z"/><path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z"/></svg>
            以 Google 登入
          </button>
          {user && (
            <button onClick={handleSignOut} className="w-full mt-3 py-3 rounded-xl text-sm"
              style={{ background: "transparent", border: "1px solid rgba(0,212,255,0.2)", color: "#666680" }}>
              登出 ({user.email})
            </button>
          )}
        </div>
      </div>
    );
  }

  const tabs: { id: Tab; label: string }[] = [
    { id: "members", label: "👥 會員資料" },
    { id: "formula", label: "📐 四維度公式" },
    { id: "yearly", label: "📅 流年配置" },
    { id: "monthly", label: "🌟 月份星座" },
    { id: "kline", label: "📊 K線參數" },
  ];

  return (
    <div className="min-h-screen" style={{ background: "#030308" }}>
      <header className="px-6 py-4 flex items-center justify-between" style={{ borderBottom: "1px solid rgba(0,212,255,0.06)" }}>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold"
            style={{ background: "linear-gradient(135deg, #00D4FF, #FF006E)", color: "white" }}>象</div>
          <div>
            <span className="text-sm font-medium" style={{ color: "#FFFFFF" }}>Fatexi 管理後台</span>
            <p className="text-xs" style={{ color: "#666680" }}>{user.email}</p>
          </div>
        </div>
        <button onClick={handleSignOut} className="px-4 py-2 rounded-lg text-xs"
          style={{ background: "rgba(255,51,102,0.1)", border: "1px solid rgba(255,51,102,0.3)", color: "#FF3366" }}>
          登出
        </button>
      </header>

      {/* Tabs */}
      <div className="px-6 pt-4 flex gap-2 overflow-x-auto">
        {tabs.map((tab) => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)}
            className="px-4 py-2 rounded-lg text-sm whitespace-nowrap"
            style={{
              background: activeTab === tab.id ? "rgba(0,212,255,0.15)" : "transparent",
              border: `1px solid ${activeTab === tab.id ? "rgba(0,212,255,0.4)" : "rgba(0,212,255,0.1)"}`,
              color: activeTab === tab.id ? "#00D4FF" : "#666680",
            }}>
            {tab.label}
          </button>
        ))}
      </div>

      <div className="px-6 py-6 max-w-6xl mx-auto">
        {/* Members Tab */}
        {activeTab === "members" && (
          <>
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="rounded-xl p-5" style={{ background: "#0D0D1A", border: "1px solid rgba(0,212,255,0.1)" }}>
                <p className="text-xs mb-1" style={{ color: "#666680" }}>總註冊人數</p>
                <p className="text-3xl font-bold" style={{ color: "#00D4FF" }}>{stats.total}</p>
              </div>
              <div className="rounded-xl p-5" style={{ background: "#0D0D1A", border: "1px solid rgba(139,92,246,0.1)" }}>
                <p className="text-xs mb-1" style={{ color: "#666680" }}>今日註冊</p>
                <p className="text-3xl font-bold" style={{ color: "#8B5CF6" }}>{stats.today}</p>
              </div>
            </div>

            <div className="mb-4 flex gap-3">
              <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && fetchUsers()}
                placeholder="搜尋姓名..." className="flex-1 px-4 py-3 rounded-xl text-sm"
                style={{ background: "#0D0D1A", border: "1px solid rgba(0,212,255,0.15)", color: "#FFFFFF" }} />
              <button onClick={() => fetchUsers()} className="px-5 py-3 rounded-xl text-sm font-medium"
                style={{ background: "rgba(0,212,255,0.15)", border: "1px solid rgba(0,212,255,0.3)", color: "#00D4FF" }}>
                搜尋
              </button>
              {search && (
                <button onClick={() => { setSearch(""); fetchUsers(); }} className="px-5 py-3 rounded-xl text-sm"
                  style={{ background: "transparent", border: "1px solid rgba(255,51,102,0.2)", color: "#666680" }}>
                  清除
                </button>
              )}
            </div>

            <div className="rounded-xl overflow-hidden" style={{ background: "#0D0D1A", border: "1px solid rgba(0,212,255,0.08)" }}>
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ borderBottom: "1px solid rgba(0,212,255,0.06)" }}>
                    <th className="text-left px-4 py-3" style={{ color: "#666680" }}>姓名</th>
                    <th className="text-left px-4 py-3" style={{ color: "#666680" }}>性別</th>
                    <th className="text-left px-4 py-3" style={{ color: "#666680" }}>出生</th>
                    <th className="text-left px-4 py-3" style={{ color: "#666680" }}>居住地</th>
                    <th className="text-left px-4 py-3" style={{ color: "#666680" }}>註冊時間</th>
                  </tr>
                </thead>
                <tbody>
                  {users.length === 0 ? (
                    <tr><td colSpan={5} className="text-center px-4 py-10" style={{ color: "#666680" }}>
                      {search ? "找不到符合的會員" : "尚無會員資料"}
                    </td></tr>
                  ) : users.map((u) => (
                    <tr key={u.id} style={{ borderBottom: "1px solid rgba(0,212,255,0.03)" }}>
                      <td className="px-4 py-3 font-medium" style={{ color: "#FFFFFF" }}>{u.name || "-"}</td>
                      <td className="px-4 py-3" style={{ color: "#9999AA" }}>{u.gender === "男" ? "男性" : u.gender === "女" ? "女性" : "-"}</td>
                      <td className="px-4 py-3" style={{ color: "#9999AA" }}>{u.year && u.month && u.day ? `${u.year}/${u.month}/${u.day}` : "-"}</td>
                      <td className="px-4 py-3" style={{ color: "#9999AA" }}>{u.location || "-"}</td>
                      <td className="px-4 py-3" style={{ color: "#9999AA" }}>{formatDate(u.registeredAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {hasMore && users.length > 0 && (
              <div className="mt-4 text-center">
                <button onClick={() => fetchUsers(true)} className="px-6 py-3 rounded-xl text-sm"
                  style={{ background: "rgba(0,212,255,0.08)", border: "1px solid rgba(0,212,255,0.15)", color: "#00D4FF" }}>
                  載入更多
                </button>
              </div>
            )}
          </>
        )}

        {/* Formula Tab */}
        {activeTab === "formula" && (
          <div className="space-y-4">
            {Object.entries(formulas).map(([key, formula]) => (
              <div key={key} className="rounded-xl p-5" style={{ background: "#0D0D1A", border: "1px solid rgba(0,212,255,0.1)" }}>
                <div className="flex items-center gap-3 mb-4">
                  <span className="text-2xl">{formula.emoji}</span>
                  <h3 className="text-lg font-bold" style={{ color: "#FFFFFF" }}>{formula.name}</h3>
                  <span className="text-sm px-3 py-1 rounded-full" style={{ background: "rgba(0,212,255,0.1)", color: "#00D4FF" }}>
                    基準: {formula.base}
                  </span>
                </div>
                {formula.factors && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {Object.entries(formula.factors).map(([factorKey, factor]) => (
                      <div key={factorKey} className="flex items-center justify-between p-3 rounded-lg" style={{ background: "rgba(0,0,0,0.2)" }}>
                        <span style={{ color: "#9999AA" }}>{factor.desc}</span>
                        <span className="font-mono font-bold" style={{ color: "#00D4FF" }}>×{factor.weight}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Yearly Tab */}
        {activeTab === "yearly" && (
          <div className="space-y-3">
            <h3 className="text-lg font-bold mb-4" style={{ color: "#FFFFFF" }}>流年配置 (2020-2030)</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {Object.entries(yearlyData).map(([year, data]: [string, any]) => (
                <div key={year} className="rounded-xl p-4" style={{ background: "#0D0D1A", border: "1px solid rgba(0,212,255,0.08)" }}>
                  <div className="flex items-center gap-3 mb-3">
                    <span className="font-bold text-lg" style={{ color: "#00D4FF" }}>{year}</span>
                    <span className="text-sm" style={{ color: "#666680" }}>{data.ganZhi} ({data.element})</span>
                  </div>
                  <p className="text-xs mb-3" style={{ color: "#9999AA" }}>{data.desc}</p>
                  <div className="grid grid-cols-4 gap-2 text-center text-xs">
                    <div className="p-2 rounded-lg" style={{ background: "rgba(0,255,136,0.1)" }}>
                      <div style={{ color: "#00FF88" }}>💰</div>
                      <div style={{ color: "#666680" }}>{data.wealth}</div>
                    </div>
                    <div className="p-2 rounded-lg" style={{ background: "rgba(0,212,255,0.1)" }}>
                      <div style={{ color: "#00D4FF" }}>💼</div>
                      <div style={{ color: "#666680" }}>{data.career}</div>
                    </div>
                    <div className="p-2 rounded-lg" style={{ background: "rgba(255,0,110,0.1)" }}>
                      <div style={{ color: "#FF006E" }}>❤️</div>
                      <div style={{ color: "#666680" }}>{data.love}</div>
                    </div>
                    <div className="p-2 rounded-lg" style={{ background: "rgba(255,184,0,0.1)" }}>
                      <div style={{ color: "#FFB800" }}>⚡</div>
                      <div style={{ color: "#666680" }}>{data.vitality}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Monthly Tab */}
        {activeTab === "monthly" && (
          <div className="space-y-3">
            <h3 className="text-lg font-bold mb-4" style={{ color: "#FFFFFF" }}>月份星座能量配置</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {Object.entries(monthlyData).map(([zodiac, data]: [string, any]) => (
                <div key={zodiac} className="rounded-xl p-4" style={{ background: "#0D0D1A", border: "1px solid rgba(0,212,255,0.08)" }}>
                  <h4 className="font-bold mb-3" style={{ color: "#FFFFFF" }}>{zodiac}</h4>
                  <div className="space-y-1 text-xs">
                    <div className="flex justify-between">
                      <span style={{ color: "#00FF88" }}>💰 財富</span>
                      <span className={data.wealth >= 0 ? "text-green-400" : "text-red-400"}>{data.wealth > 0 ? "+" : ""}{data.wealth}</span>
                    </div>
                    <div className="flex justify-between">
                      <span style={{ color: "#00D4FF" }}>💼 事業</span>
                      <span className={data.career >= 0 ? "text-green-400" : "text-red-400"}>{data.career > 0 ? "+" : ""}{data.career}</span>
                    </div>
                    <div className="flex justify-between">
                      <span style={{ color: "#FF006E" }}>❤️ 愛情</span>
                      <span className={data.love >= 0 ? "text-green-400" : "text-red-400"}>{data.love > 0 ? "+" : ""}{data.love}</span>
                    </div>
                    <div className="flex justify-between">
                      <span style={{ color: "#FFB800" }}>⚡ 能量</span>
                      <span className={data.vitality >= 0 ? "text-green-400" : "text-red-400"}>{data.vitality > 0 ? "+" : ""}{data.vitality}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* K-line Tab */}
        {activeTab === "kline" && klineSettings && (
          <div className="space-y-4">
            <h3 className="text-lg font-bold" style={{ color: "#FFFFFF" }}>{klineSettings.name}</h3>
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="rounded-xl p-5" style={{ background: "#0D0D1A", border: "1px solid rgba(0,212,255,0.1)" }}>
                <p className="text-xs mb-1" style={{ color: "#666680" }}>MA5</p>
                <p className="text-2xl font-bold" style={{ color: "#00D4FF" }}>{klineSettings.ma5}</p>
              </div>
              <div className="rounded-xl p-5" style={{ background: "#0D0D1A", border: "1px solid rgba(0,212,255,0.1)" }}>
                <p className="text-xs mb-1" style={{ color: "#666680" }}>MA10</p>
                <p className="text-2xl font-bold" style={{ color: "#00D4FF" }}>{klineSettings.ma10}</p>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="rounded-xl p-5" style={{ background: "#0D0D1A", border: "1px solid rgba(0,255,136,0.2)" }}>
                <h4 className="font-bold mb-2" style={{ color: "#00FF88" }}>🌟 金叉（上升訊號）</h4>
                <p className="text-sm" style={{ color: "#9999AA" }}>{klineSettings.goldenCross}</p>
              </div>
              <div className="rounded-xl p-5" style={{ background: "#0D0D1A", border: "1px solid rgba(255,0,110,0.2)" }}>
                <h4 className="font-bold mb-2" style={{ color: "#FF006E" }}>⚠️ 死叉（下降訊號）</h4>
                <p className="text-sm" style={{ color: "#9999AA" }}>{klineSettings.deathCross}</p>
              </div>
              <div className="rounded-xl p-5" style={{ background: "#0D0D1A", border: "1px solid rgba(255,184,0,0.2)" }}>
                <h4 className="font-bold mb-2" style={{ color: "#FFB800" }}>☀️ 陽線</h4>
                <p className="text-sm" style={{ color: "#9999AA" }}>{klineSettings.yangLine}</p>
              </div>
              <div className="rounded-xl p-5" style={{ background: "#0D0D1A", border: "1px solid rgba(100,100,150,0.2)" }}>
                <h4 className="font-bold mb-2" style={{ color: "#666680" }}>🌙 陰線</h4>
                <p className="text-sm" style={{ color: "#9999AA" }}>{klineSettings.yinLine}</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
