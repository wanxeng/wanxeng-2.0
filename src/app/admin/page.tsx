"use client";

import { useState, useEffect } from "react";
import {
  collection,
  getDocs,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  limit,
  startAfter,
  where,
  Timestamp,
  addDoc,
  serverTimestamp,
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
  updatedAt?: Timestamp;
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
  const [sidebarOpen, setSidebarOpen] = useState(true);

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

  // Edit modal state
  const [editModal, setEditModal] = useState<{ type: string; key?: string; data?: any } | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function initFirebase() {
      try {
        const { getAuthInstance } = await import("@/lib/firebase");
        const authInstance = getAuthInstance();
        if (!authInstance) { setLoading(false); return; }
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
      if (activeTab === "members") { fetchUsers(); fetchStats(); }
      else if (activeTab === "formula") fetchFormulas();
      else if (activeTab === "yearly") fetchYearlyData();
      else if (activeTab === "monthly") fetchMonthlyData();
      else if (activeTab === "kline") fetchKLineSettings();
    }
  }, [user, activeTab]);

  async function fetchUsers(isNextPage = false) {
    try {
      const { getDB } = await import("@/lib/firebase");
      const dbInstance = getDB();
      if (!dbInstance) return;
      let q = query(collection(dbInstance, "users"), orderBy("registeredAt", "desc"), limit(20));
      if (isNextPage && lastDoc) q = query(collection(dbInstance, "users"), orderBy("registeredAt", "desc"), startAfter(lastDoc), limit(20));
      if (search.trim()) q = query(collection(dbInstance, "users"), where("name", ">=", search), where("name", "<=", search + "\uf8ff"), orderBy("name"), limit(20));
      const snap = await getDocs(q);
      const data = snap.docs.map((doc) => ({ id: doc.id, ...doc.data() })) as User[];
      if (isNextPage) setUsers((prev) => [...prev, ...data]);
      else setUsers(data);
      setLastDoc(snap.docs[snap.docs.length - 1] || null);
      setHasMore(snap.docs.length === 20);
    } catch (e) { console.error("Fetch users error:", e); }
  }

  async function fetchStats() {
    try {
      const { getDB } = await import("@/lib/firebase");
      const dbInstance = getDB();
      if (!dbInstance) return;
      const snap = await getDocs(collection(dbInstance, "users"));
      const today = new Date(); today.setHours(0, 0, 0, 0);
      const todayCount = snap.docs.filter((doc) => {
        const data = doc.data() as User;
        if (!data.registeredAt) return false;
        return data.registeredAt.toDate() >= today;
      }).length;
      setStats({ total: snap.size, today: todayCount });
    } catch (e) { console.error("Fetch stats error:", e); }
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
    } catch (e) { console.error("Fetch formulas error:", e); }
  }

  async function fetchYearlyData() {
    try {
      const { getDB } = await import("@/lib/firebase");
      const dbInstance = getDB();
      if (!dbInstance) return;
      const snap = await getDoc(doc(dbInstance, "formula_configs", "yearly_cycles"));
      if (snap.exists()) setYearlyData(snap.data().data || {});
    } catch (e) { console.error("Fetch yearly data error:", e); }
  }

  async function fetchMonthlyData() {
    try {
      const { getDB } = await import("@/lib/firebase");
      const dbInstance = getDB();
      if (!dbInstance) return;
      const snap = await getDoc(doc(dbInstance, "formula_configs", "zodiac_monthly"));
      if (snap.exists()) setMonthlyData(snap.data().data || {});
    } catch (e) { console.error("Fetch monthly data error:", e); }
  }

  async function fetchKLineSettings() {
    try {
      const { getDB } = await import("@/lib/firebase");
      const dbInstance = getDB();
      if (!dbInstance) return;
      const snap = await getDoc(doc(dbInstance, "formula_configs", "kline_settings"));
      if (snap.exists()) setKlineSettings(snap.data() as KLineSettings);
    } catch (e) { console.error("Fetch kline settings error:", e); }
  }

  async function deleteUser(id: string) {
    if (!confirm("確定要刪除這個會員嗎？")) return;
    try {
      const { getDB } = await import("@/lib/firebase");
      const dbInstance = getDB();
      if (!dbInstance) return;
      await deleteDoc(doc(dbInstance, "users", id));
      setUsers((prev) => prev.filter((u) => u.id !== id));
      setStats((prev) => ({ ...prev, total: prev.total - 1 }));
    } catch (e) { console.error("Delete user error:", e); alert("刪除失敗"); }
  }

  async function saveEdit() {
    if (!editModal) return;
    setSaving(true);
    try {
      const { getDB } = await import("@/lib/firebase");
      const dbInstance = getDB();
      if (!dbInstance) return;

      const { type, key, data } = editModal;

      if (type === "formula") {
        await setDoc(doc(dbInstance, "formula_configs", key!), {
          ...data,
          updatedAt: serverTimestamp(),
        }, { merge: true });
        await fetchFormulas();
      } else if (type === "yearly") {
        const current = yearlyData;
        current[key!] = data;
        await setDoc(doc(dbInstance, "formula_configs", "yearly_cycles"), {
          name: "流年配置",
          data: current,
          updatedAt: serverTimestamp(),
        }, { merge: true });
        setYearlyData({ ...current });
      } else if (type === "monthly") {
        const current = monthlyData;
        current[key!] = data;
        await setDoc(doc(dbInstance, "formula_configs", "zodiac_monthly"), {
          name: "月份星座能量配置",
          data: current,
          updatedAt: serverTimestamp(),
        }, { merge: true });
        setMonthlyData({ ...current });
      } else if (type === "kline") {
        await setDoc(doc(dbInstance, "formula_configs", "kline_settings"), {
          ...data,
          updatedAt: serverTimestamp(),
        }, { merge: true });
        setKlineSettings(data);
      } else if (type === "formula_factor") {
        const formula = formulas[key!];
        const factors = { ...formula.factors, ...data };
        await setDoc(doc(dbInstance, "formula_configs", key!), {
          ...formula,
          factors,
          updatedAt: serverTimestamp(),
        }, { merge: true });
        await fetchFormulas();
      }

      setEditModal(null);
    } catch (e) {
      console.error("Save error:", e);
      alert("儲存失敗");
    }
    setSaving(false);
  }

  async function handleSignIn() {
    try {
      const { getAuthInstance, getGoogleProvider } = await import("@/lib/firebase");
      const authInstance = getAuthInstance();
      const provider = getGoogleProvider();
      if (!authInstance || !provider) return;
      const { signInWithPopup } = await import("firebase/auth");
      await signInWithPopup(authInstance, provider);
    } catch (e) { console.error("Sign in error:", e); }
  }

  async function handleSignOut() {
    try {
      const { getAuthInstance } = await import("@/lib/firebase");
      const authInstance = getAuthInstance();
      if (!authInstance) return;
      const { signOut } = await import("firebase/auth");
      await signOut(authInstance);
      setUsers([]);
    } catch (e) { console.error("Sign out error:", e); }
  }

  function formatDate(ts: Timestamp | null) {
    if (!ts) return "-";
    return ts.toDate().toLocaleString("zh-TW", {
      year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit",
    });
  }

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: "#030308" }}>
      <p style={{ color: "#666680" }}>載入中...</p>
    </div>
  );

  if (error) return (
    <div className="min-h-screen flex flex-col items-center justify-center" style={{ background: "#030308" }}>
      <p style={{ color: "#FF3366" }}>初始化錯誤: {error}</p>
      <button onClick={() => window.location.reload()} className="mt-4 px-4 py-2 rounded-lg" style={{ background: "rgba(0,212,255,0.15)", color: "#00D4FF" }}>重新整理</button>
    </div>
  );

  if (!user || user.email !== ADMIN_EMAIL) return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6" style={{ background: "#030308" }}>
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center text-2xl font-bold" style={{ background: "linear-gradient(135deg, #00D4FF, #FF006E)", color: "white" }}>象</div>
          <h1 className="text-2xl font-bold mb-2" style={{ color: "#FFFFFF" }}>Fatexi 管理後台</h1>
          <p className="text-sm" style={{ color: "#666680" }}>請以管理員帳號登入</p>
        </div>
        {user && user.email !== ADMIN_EMAIL && (
          <div className="mb-4 p-4 rounded-xl text-sm text-center" style={{ background: "rgba(255,51,102,0.1)", border: "1px solid rgba(255,51,102,0.3)", color: "#FF3366" }}>無權限：{user.email}</div>
        )}
        <button onClick={handleSignIn} className="w-full py-4 rounded-xl text-base font-semibold flex items-center justify-center gap-3" style={{ background: "#FFFFFF", color: "#030308" }}>
          <svg width="18" height="18" viewBox="0 0 18 18"><path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 01-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z"/><path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z"/><path fill="#FBBC05" d="M3.964 10.71A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 000 9c0 1.452.348 2.827.957 4.042l3.007-2.332z"/><path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z"/></svg>
          以 Google 登入
        </button>
        {user && <button onClick={handleSignOut} className="w-full mt-3 py-3 rounded-xl text-sm" style={{ background: "transparent", border: "1px solid rgba(0,212,255,0.2)", color: "#666680" }}>登出 ({user.email})</button>}
      </div>
    </div>
  );

  const navItems: { id: Tab; label: string; icon: string }[] = [
    { id: "members", label: "會員資料", icon: "👥" },
    { id: "formula", label: "四維度公式", icon: "📐" },
    { id: "yearly", label: "流年配置", icon: "📅" },
    { id: "monthly", label: "月份星座", icon: "🌟" },
    { id: "kline", label: "K線參數", icon: "📊" },
  ];

  return (
    <div className="min-h-screen flex" style={{ background: "#030308" }}>
      {/* Sidebar */}
      <aside className={`${sidebarOpen ? "w-64" : "w-20"} min-h-screen flex flex-col transition-all duration-300`} style={{ background: "#0D0D1A", borderRight: "1px solid rgba(0,212,255,0.06)" }}>
        {/* Logo */}
        <div className="p-4 flex items-center gap-3" style={{ borderBottom: "1px solid rgba(0,212,255,0.06)" }}>
          <div className="w-10 h-10 rounded-xl flex items-center justify-center text-lg font-bold flex-shrink-0" style={{ background: "linear-gradient(135deg, #00D4FF, #FF006E)", color: "white" }}>象</div>
          {sidebarOpen && <span className="text-white font-bold">Fatexi</span>}
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className="ml-auto p-2 rounded-lg hover:bg-white/5" style={{ color: "#666680" }}>
            {sidebarOpen ? "◀" : "▶"}
          </button>
        </div>

        {/* User info */}
        <div className="p-4" style={{ borderBottom: "1px solid rgba(0,212,255,0.06)" }}>
          <p className="text-xs truncate" style={{ color: "#666680" }}>{user.email}</p>
        </div>

        {/* Nav items */}
        <nav className="flex-1 py-4">
          {navItems.map((item) => (
            <button key={item.id} onClick={() => setActiveTab(item.id)}
              className="w-full flex items-center gap-3 px-4 py-3 transition-colors"
              style={{
                background: activeTab === item.id ? "rgba(0,212,255,0.1)" : "transparent",
                borderLeft: `3px solid ${activeTab === item.id ? "#00D4FF" : "transparent"}`,
                color: activeTab === item.id ? "#00D4FF" : "#666680",
              }}>
              <span className="text-lg">{item.icon}</span>
              {sidebarOpen && <span className="text-sm font-medium">{item.label}</span>}
            </button>
          ))}
        </nav>

        {/* Sign out */}
        <div className="p-4" style={{ borderTop: "1px solid rgba(0,212,255,0.06)" }}>
          <button onClick={handleSignOut} className="w-full flex items-center gap-3 px-4 py-3 rounded-lg" style={{ color: "#666680" }}>
            <span>🚪</span>
            {sidebarOpen && <span className="text-sm">登出</span>}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 min-h-screen">
        <header className="px-6 py-4 flex items-center justify-between" style={{ borderBottom: "1px solid rgba(0,212,255,0.06)" }}>
          <h1 className="text-lg font-bold" style={{ color: "#FFFFFF" }}>
            {navItems.find((n) => n.id === activeTab)?.icon} {navItems.find((n) => n.id === activeTab)?.label}
          </h1>
        </header>

        <div className="p-6 max-w-7xl mx-auto">
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
                  style={{ background: "rgba(0,212,255,0.15)", border: "1px solid rgba(0,212,255,0.3)", color: "#00D4FF" }}>搜尋</button>
                {search && <button onClick={() => { setSearch(""); fetchUsers(); }} className="px-5 py-3 rounded-xl text-sm"
                  style={{ background: "transparent", border: "1px solid rgba(255,51,102,0.2)", color: "#666680" }}>清除</button>}
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
                      <th className="text-left px-4 py-3" style={{ color: "#666680" }}>操作</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.length === 0 ? (
                      <tr><td colSpan={6} className="text-center px-4 py-10" style={{ color: "#666680" }}>
                        {search ? "找不到符合的會員" : "尚無會員資料"}
                      </td></tr>
                    ) : users.map((u) => (
                      <tr key={u.id} style={{ borderBottom: "1px solid rgba(0,212,255,0.03)" }}>
                        <td className="px-4 py-3 font-medium" style={{ color: "#FFFFFF" }}>{u.name || "-"}</td>
                        <td className="px-4 py-3" style={{ color: "#9999AA" }}>{u.gender === "男" ? "男性" : u.gender === "女" ? "女性" : "-"}</td>
                        <td className="px-4 py-3" style={{ color: "#9999AA" }}>{u.year && u.month && u.day ? `${u.year}/${u.month}/${u.day}` : "-"}</td>
                        <td className="px-4 py-3" style={{ color: "#9999AA" }}>{u.location || "-"}</td>
                        <td className="px-4 py-3" style={{ color: "#9999AA" }}>{formatDate(u.registeredAt)}</td>
                        <td className="px-4 py-3">
                          <button onClick={() => deleteUser(u.id)} className="px-3 py-1 rounded-lg text-xs" style={{ background: "rgba(255,51,102,0.1)", border: "1px solid rgba(255,51,102,0.3)", color: "#FF3366" }}>
                            刪除
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {hasMore && users.length > 0 && <div className="mt-4 text-center">
                <button onClick={() => fetchUsers(true)} className="px-6 py-3 rounded-xl text-sm" style={{ background: "rgba(0,212,255,0.08)", border: "1px solid rgba(0,212,255,0.15)", color: "#00D4FF" }}>載入更多</button>
              </div>}
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
                    <span className="text-sm px-3 py-1 rounded-full" style={{ background: "rgba(0,212,255,0.1)", color: "#00D4FF" }}>基準: {formula.base}</span>
                    <button onClick={() => setEditModal({ type: "formula", key, data: { ...formula } })}
                      className="ml-auto px-4 py-2 rounded-lg text-sm" style={{ background: "rgba(0,212,255,0.15)", color: "#00D4FF" }}>編輯</button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {formula.factors && Object.entries(formula.factors).map(([factorKey, factor]) => (
                      <div key={factorKey} className="flex items-center justify-between p-3 rounded-lg" style={{ background: "rgba(0,0,0,0.2)" }}>
                        <span style={{ color: "#9999AA" }}>{factor.desc}</span>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold" style={{ color: "#00D4FF" }}>×{factor.weight}</span>
                          <button onClick={() => setEditModal({ type: "formula_factor", key, data: { [factorKey]: factor } })}
                            className="text-xs px-2 py-1 rounded" style={{ background: "rgba(0,212,255,0.1)", color: "#00D4FF" }}>改</button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Yearly Tab */}
          {activeTab === "yearly" && (
            <div className="space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {Object.entries(yearlyData).sort(([a], [b]) => Number(a) - Number(b)).map(([year, data]: [string, any]) => (
                  <div key={year} className="rounded-xl p-4" style={{ background: "#0D0D1A", border: "1px solid rgba(0,212,255,0.08)" }}>
                    <div className="flex items-center gap-3 mb-3">
                      <span className="font-bold text-lg" style={{ color: "#00D4FF" }}>{year}</span>
                      <span className="text-sm" style={{ color: "#666680" }}>{data.ganZhi} ({data.element})</span>
                      <button onClick={() => setEditModal({ type: "yearly", key: year, data: { ...data } })}
                        className="ml-auto px-3 py-1 rounded-lg text-xs" style={{ background: "rgba(0,212,255,0.15)", color: "#00D4FF" }}>編輯</button>
                    </div>
                    <p className="text-xs mb-3" style={{ color: "#9999AA" }}>{data.desc}</p>
                    <div className="grid grid-cols-4 gap-2 text-center text-xs">
                      <div className="p-2 rounded-lg" style={{ background: "rgba(0,255,136,0.1)" }}><div style={{ color: "#00FF88" }}>💰</div><div style={{ color: "#666680" }}>{data.wealth}</div></div>
                      <div className="p-2 rounded-lg" style={{ background: "rgba(0,212,255,0.1)" }}><div style={{ color: "#00D4FF" }}>💼</div><div style={{ color: "#666680" }}>{data.career}</div></div>
                      <div className="p-2 rounded-lg" style={{ background: "rgba(255,0,110,0.1)" }}><div style={{ color: "#FF006E" }}>❤️</div><div style={{ color: "#666680" }}>{data.love}</div></div>
                      <div className="p-2 rounded-lg" style={{ background: "rgba(255,184,0,0.1)" }}><div style={{ color: "#FFB800" }}>⚡</div><div style={{ color: "#666680" }}>{data.vitality}</div></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Monthly Tab */}
          {activeTab === "monthly" && (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {Object.entries(monthlyData).map(([zodiac, data]: [string, any]) => (
                <div key={zodiac} className="rounded-xl p-4" style={{ background: "#0D0D1A", border: "1px solid rgba(0,212,255,0.08)" }}>
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-bold" style={{ color: "#FFFFFF" }}>{zodiac}</h4>
                    <button onClick={() => setEditModal({ type: "monthly", key: zodiac, data: { ...data } })}
                      className="px-3 py-1 rounded-lg text-xs" style={{ background: "rgba(0,212,255,0.15)", color: "#00D4FF" }}>編輯</button>
                  </div>
                  <div className="space-y-1 text-xs">
                    <div className="flex justify-between"><span style={{ color: "#00FF88" }}>💰</span><span className={data.wealth >= 0 ? "text-green-400" : "text-red-400"}>{data.wealth > 0 ? "+" : ""}{data.wealth}</span></div>
                    <div className="flex justify-between"><span style={{ color: "#00D4FF" }}>💼</span><span className={data.career >= 0 ? "text-green-400" : "text-red-400"}>{data.career > 0 ? "+" : ""}{data.career}</span></div>
                    <div className="flex justify-between"><span style={{ color: "#FF006E" }}>❤️</span><span className={data.love >= 0 ? "text-green-400" : "text-red-400"}>{data.love > 0 ? "+" : ""}{data.love}</span></div>
                    <div className="flex justify-between"><span style={{ color: "#FFB800" }}>⚡</span><span className={data.vitality >= 0 ? "text-green-400" : "text-red-400"}>{data.vitality > 0 ? "+" : ""}{data.vitality}</span></div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* K-line Tab */}
          {activeTab === "kline" && klineSettings && (
            <div className="space-y-4">
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
                  <h4 className="font-bold mb-2" style={{ color: "#00FF88" }}>🌟 金叉</h4><p className="text-sm" style={{ color: "#9999AA" }}>{klineSettings.goldenCross}</p>
                </div>
                <div className="rounded-xl p-5" style={{ background: "#0D0D1A", border: "1px solid rgba(255,0,110,0.2)" }}>
                  <h4 className="font-bold mb-2" style={{ color: "#FF006E" }}>⚠️ 死叉</h4><p className="text-sm" style={{ color: "#9999AA" }}>{klineSettings.deathCross}</p>
                </div>
                <div className="rounded-xl p-5" style={{ background: "#0D0D1A", border: "1px solid rgba(255,184,0,0.2)" }}>
                  <h4 className="font-bold mb-2" style={{ color: "#FFB800" }}>☀️ 陽線</h4><p className="text-sm" style={{ color: "#9999AA" }}>{klineSettings.yangLine}</p>
                </div>
                <div className="rounded-xl p-5" style={{ background: "#0D0D1A", border: "1px solid rgba(100,100,150,0.2)" }}>
                  <h4 className="font-bold mb-2" style={{ color: "#666680" }}>🌙 陰線</h4><p className="text-sm" style={{ color: "#9999AA" }}>{klineSettings.yinLine}</p>
                </div>
              </div>
              <button onClick={() => setEditModal({ type: "kline", data: { ...klineSettings } })}
                className="px-6 py-3 rounded-xl text-sm font-medium" style={{ background: "rgba(0,212,255,0.15)", border: "1px solid rgba(0,212,255,0.3)", color: "#00D4FF" }}>編輯 K 線參數</button>
            </div>
          )}
        </div>
      </main>

      {/* Edit Modal */}
      {editModal && (
        <div className="fixed inset-0 flex items-center justify-center z-50" style={{ background: "rgba(0,0,0,0.7)" }}>
          <div className="rounded-2xl p-6 w-full max-w-md mx-4" style={{ background: "#0D0D1A", border: "1px solid rgba(0,212,255,0.2)" }}>
            <h2 className="text-lg font-bold mb-4" style={{ color: "#FFFFFF" }}>
              編輯 {editModal.type === "yearly" ? `流年 ${editModal.key}` : editModal.type === "monthly" ? `星座 ${editModal.key}` : editModal.type === "kline" ? "K線參數" : editModal.type === "formula" ? editModal.data?.name : "因子權重"}
            </h2>

            {editModal.type === "formula" && (
              <div className="space-y-4">
                <div>
                  <label className="block text-xs mb-1" style={{ color: "#666680" }}>基準分</label>
                  <input type="number" value={editModal.data.base} onChange={(e) => setEditModal({ ...editModal, data: { ...editModal.data, base: Number(e.target.value) } })}
                    className="w-full px-4 py-3 rounded-xl text-sm" style={{ background: "#030308", border: "1px solid rgba(0,212,255,0.2)", color: "#FFFFFF" }} />
                </div>
                {editModal.data.factors && Object.entries(editModal.data.factors).map(([fk, fv]: [string, any]) => (
                  <div key={fk} className="flex items-center gap-3">
                    <span className="flex-1 text-sm truncate" style={{ color: "#9999AA" }}>{fv.desc}</span>
                    <input type="number" value={fv.weight} onChange={(e) => {
                      const newFactors = { ...editModal.data.factors, [fk]: { ...fv, weight: Number(e.target.value) } };
                      setEditModal({ ...editModal, data: { ...editModal.data, factors: newFactors } });
                    }} className="w-20 px-3 py-2 rounded-lg text-sm text-right" style={{ background: "#030308", border: "1px solid rgba(0,212,255,0.2)", color: "#00D4FF" }} />
                  </div>
                ))}
              </div>
            )}

            {editModal.type === "formula_factor" && (
              <div className="space-y-4">
                {Object.entries(editModal.data).map(([fk, fv]: [string, any]) => (
                  <div key={fk}>
                    <label className="block text-xs mb-1" style={{ color: "#666680" }}>權重</label>
                    <input type="number" value={fv.weight} onChange={(e) => setEditModal({ ...editModal, data: { [fk]: { ...fv, weight: Number(e.target.value) } } })}
                      className="w-full px-4 py-3 rounded-xl text-sm" style={{ background: "#030308", border: "1px solid rgba(0,212,255,0.2)", color: "#00D4FF" }} />
                  </div>
                ))}
              </div>
            )}

            {editModal.type === "yearly" && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div><label className="block text-xs mb-1" style={{ color: "#666680" }}>💰 財富</label><input type="number" value={editModal.data.wealth} onChange={(e) => setEditModal({ ...editModal, data: { ...editModal.data, wealth: Number(e.target.value) } })} className="w-full px-4 py-3 rounded-xl text-sm" style={{ background: "#030308", border: "1px solid rgba(0,212,255,0.2)", color: "#00D4FF" }} /></div>
                  <div><label className="block text-xs mb-1" style={{ color: "#666680" }}>💼 事業</label><input type="number" value={editModal.data.career} onChange={(e) => setEditModal({ ...editModal, data: { ...editModal.data, career: Number(e.target.value) } })} className="w-full px-4 py-3 rounded-xl text-sm" style={{ background: "#030308", border: "1px solid rgba(0,212,255,0.2)", color: "#00D4FF" }} /></div>
                  <div><label className="block text-xs mb-1" style={{ color: "#666680" }}>❤️ 愛情</label><input type="number" value={editModal.data.love} onChange={(e) => setEditModal({ ...editModal, data: { ...editModal.data, love: Number(e.target.value) } })} className="w-full px-4 py-3 rounded-xl text-sm" style={{ background: "#030308", border: "1px solid rgba(0,212,255,0.2)", color: "#00D4FF" }} /></div>
                  <div><label className="block text-xs mb-1" style={{ color: "#666680" }}>⚡ 能量</label><input type="number" value={editModal.data.vitality} onChange={(e) => setEditModal({ ...editModal, data: { ...editModal.data, vitality: Number(e.target.value) } })} className="w-full px-4 py-3 rounded-xl text-sm" style={{ background: "#030308", border: "1px solid rgba(0,212,255,0.2)", color: "#00D4FF" }} /></div>
                </div>
                <div><label className="block text-xs mb-1" style={{ color: "#666680" }}>說明</label><input type="text" value={editModal.data.desc} onChange={(e) => setEditModal({ ...editModal, data: { ...editModal.data, desc: e.target.value } })} className="w-full px-4 py-3 rounded-xl text-sm" style={{ background: "#030308", border: "1px solid rgba(0,212,255,0.2)", color: "#FFFFFF" }} /></div>
              </div>
            )}

            {editModal.type === "monthly" && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div><label className="block text-xs mb-1" style={{ color: "#666680" }}>💰 財富</label><input type="number" value={editModal.data.wealth} onChange={(e) => setEditModal({ ...editModal, data: { ...editModal.data, wealth: Number(e.target.value) } })} className="w-full px-4 py-3 rounded-xl text-sm" style={{ background: "#030308", border: "1px solid rgba(0,212,255,0.2)", color: "#00D4FF" }} /></div>
                  <div><label className="block text-xs mb-1" style={{ color: "#666680" }}>💼 事業</label><input type="number" value={editModal.data.career} onChange={(e) => setEditModal({ ...editModal, data: { ...editModal.data, career: Number(e.target.value) } })} className="w-full px-4 py-3 rounded-xl text-sm" style={{ background: "#030308", border: "1px solid rgba(0,212,255,0.2)", color: "#00D4FF" }} /></div>
                  <div><label className="block text-xs mb-1" style={{ color: "#666680" }}>❤️ 愛情</label><input type="number" value={editModal.data.love} onChange={(e) => setEditModal({ ...editModal, data: { ...editModal.data, love: Number(e.target.value) } })} className="w-full px-4 py-3 rounded-xl text-sm" style={{ background: "#030308", border: "1px solid rgba(0,212,255,0.2)", color: "#00D4FF" }} /></div>
                  <div><label className="block text-xs mb-1" style={{ color: "#666680" }}>⚡ 能量</label><input type="number" value={editModal.data.vitality} onChange={(e) => setEditModal({ ...editModal, data: { ...editModal.data, vitality: Number(e.target.value) } })} className="w-full px-4 py-3 rounded-xl text-sm" style={{ background: "#030308", border: "1px solid rgba(0,212,255,0.2)", color: "#00D4FF" }} /></div>
                </div>
              </div>
            )}

            {editModal.type === "kline" && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div><label className="block text-xs mb-1" style={{ color: "#666680" }}>MA5</label><input type="number" value={editModal.data.ma5} onChange={(e) => setEditModal({ ...editModal, data: { ...editModal.data, ma5: Number(e.target.value) } })} className="w-full px-4 py-3 rounded-xl text-sm" style={{ background: "#030308", border: "1px solid rgba(0,212,255,0.2)", color: "#00D4FF" }} /></div>
                  <div><label className="block text-xs mb-1" style={{ color: "#666680" }}>MA10</label><input type="number" value={editModal.data.ma10} onChange={(e) => setEditModal({ ...editModal, data: { ...editModal.data, ma10: Number(e.target.value) } })} className="w-full px-4 py-3 rounded-xl text-sm" style={{ background: "#030308", border: "1px solid rgba(0,212,255,0.2)", color: "#00D4FF" }} /></div>
                </div>
                <div><label className="block text-xs mb-1" style={{ color: "#666680" }}>金叉說明</label><input type="text" value={editModal.data.goldenCross} onChange={(e) => setEditModal({ ...editModal, data: { ...editModal.data, goldenCross: e.target.value } })} className="w-full px-4 py-3 rounded-xl text-sm" style={{ background: "#030308", border: "1px solid rgba(0,212,255,0.2)", color: "#FFFFFF" }} /></div>
                <div><label className="block text-xs mb-1" style={{ color: "#666680" }}>死叉說明</label><input type="text" value={editModal.data.deathCross} onChange={(e) => setEditModal({ ...editModal, data: { ...editModal.data, deathCross: e.target.value } })} className="w-full px-4 py-3 rounded-xl text-sm" style={{ background: "#030308", border: "1px solid rgba(0,212,255,0.2)", color: "#FFFFFF" }} /></div>
              </div>
            )}

            <div className="flex gap-3 mt-6">
              <button onClick={() => setEditModal(null)} className="flex-1 py-3 rounded-xl text-sm" style={{ background: "transparent", border: "1px solid rgba(255,51,102,0.2)", color: "#666680" }}>取消</button>
              <button onClick={saveEdit} disabled={saving} className="flex-1 py-3 rounded-xl text-sm font-medium" style={{ background: "#00D4FF", color: "#030308" }}>
                {saving ? "儲存中..." : "儲存"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
