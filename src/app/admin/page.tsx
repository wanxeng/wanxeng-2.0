"use client";

import { useState, useEffect } from "react";
import { signInWithPopup, signOut, onAuthStateChanged } from "firebase/auth";
import { auth, googleProvider } from "@/lib/firebase";
import {
  collection,
  getDocs,
  query,
  orderBy,
  limit,
  startAfter,
  where,
  Timestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";

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

const ADMIN_EMAIL = "yowaytsao@gmail.com";

export default function AdminPage() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<User[]>([]);
  const [lastDoc, setLastDoc] = useState<any>(null);
  const [hasMore, setHasMore] = useState(true);
  const [search, setSearch] = useState("");
  const [stats, setStats] = useState({ total: 0, today: 0 });

  useEffect(() => {
    if (!auth) {
      setLoading(false);
      return;
    }
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
    });
    return unsub;
  }, []);

  useEffect(() => {
    if (user && user.email === ADMIN_EMAIL) {
      fetchUsers();
      fetchStats();
    }
  }, [user]);

  async function fetchUsers(isNextPage = false) {
    if (!db) return;
    try {
      let q = query(
        collection(db, "users"),
        orderBy("registeredAt", "desc"),
        limit(20)
      );

      if (isNextPage && lastDoc) {
        q = query(
          collection(db, "users"),
          orderBy("registeredAt", "desc"),
          startAfter(lastDoc),
          limit(20)
        );
      }

      if (search.trim()) {
        q = query(
          collection(db, "users"),
          where("name", ">=", search),
          where("name", "<=", search + "\uf8ff"),
          orderBy("name"),
          limit(20)
        );
      }

      const snap = await getDocs(q);
      const data = snap.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as User[];

      if (isNextPage) {
        setUsers((prev) => [...prev, ...data]);
      } else {
        setUsers(data);
      }

      setLastDoc(snap.docs[snap.docs.length - 1] || null);
      setHasMore(snap.docs.length === 20);
    } catch (e) {
      console.error("Fetch users error:", e);
    }
  }

  async function fetchStats() {
    if (!db) return;
    try {
      const snap = await getDocs(collection(db, "users"));
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayCount = snap.docs.filter((doc) => {
        const data = doc.data() as User;
        if (!data.registeredAt) return false;
        const regDate = data.registeredAt.toDate();
        return regDate >= today;
      }).length;
      setStats({ total: snap.size, today: todayCount });
    } catch (e) {
      console.error("Fetch stats error:", e);
    }
  }

  async function handleSignIn() {
    if (!auth || !googleProvider) return;
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (e) {
      console.error("Sign in error:", e);
    }
  }

  async function handleSignOut() {
    if (!auth) return;
    await signOut(auth);
    setUsers([]);
  }

  function formatDate(ts: Timestamp | null) {
    if (!ts) return "-";
    return ts.toDate().toLocaleString("zh-TW", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "#030308" }}>
        <p style={{ color: "#666680" }}>載入中...</p>
      </div>
    );
  }

  // Login screen
  if (!user || user.email !== ADMIN_EMAIL) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-6" style={{ background: "#030308" }}>
        <div className="w-full max-w-sm">
          <div className="text-center mb-8">
            <div className="w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center text-2xl font-bold"
              style={{ background: "linear-gradient(135deg, #00D4FF, #FF006E)", color: "white" }}>
              象
            </div>
            <h1 className="text-2xl font-bold mb-2" style={{ color: "#FFFFFF" }}>Fatexi 管理後台</h1>
            <p className="text-sm" style={{ color: "#666680" }}>請以管理員帳號登入</p>
          </div>

          {user && user.email !== ADMIN_EMAIL && (
            <div className="mb-4 p-4 rounded-xl text-sm text-center" style={{ background: "rgba(255,51,102,0.1)", border: "1px solid rgba(255,51,102,0.3)", color: "#FF3366" }}>
              無權限：{user.email}
            </div>
          )}

          <button
            onClick={handleSignIn}
            className="w-full py-4 rounded-xl text-base font-semibold flex items-center justify-center gap-3"
            style={{ background: "#FFFFFF", color: "#030308" }}
          >
            <svg width="18" height="18" viewBox="0 0 18 18"><path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 01-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z"/><path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z"/><path fill="#FBBC05" d="M3.964 10.71A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 000 9c0 1.452.348 2.827.957 4.042l3.007-2.332z"/><path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z"/></svg>
            以 Google 登入
          </button>

          {user && (
            <button
              onClick={handleSignOut}
              className="w-full mt-3 py-3 rounded-xl text-sm"
              style={{ background: "transparent", border: "1px solid rgba(0,212,255,0.2)", color: "#666680" }}
            >
              登出 ({user.email})
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: "#030308" }}>
      {/* Header */}
      <header className="px-6 py-4 flex items-center justify-between" style={{ borderBottom: "1px solid rgba(0,212,255,0.06)" }}>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold"
            style={{ background: "linear-gradient(135deg, #00D4FF, #FF006E)", color: "white" }}>象</div>
          <div>
            <span className="text-sm font-medium" style={{ color: "#FFFFFF" }}>Fatexi 管理後台</span>
            <p className="text-xs" style={{ color: "#666680" }}>{user.email}</p>
          </div>
        </div>
        <button
          onClick={handleSignOut}
          className="px-4 py-2 rounded-lg text-xs"
          style={{ background: "rgba(255,51,102,0.1)", border: "1px solid rgba(255,51,102,0.3)", color: "#FF3366" }}
        >
          登出
        </button>
      </header>

      <div className="px-6 py-6 max-w-6xl mx-auto">
        {/* Stats */}
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

        {/* Search */}
        <div className="mb-4 flex gap-3">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && fetchUsers()}
            placeholder="搜尋姓名..."
            className="flex-1 px-4 py-3 rounded-xl text-sm"
            style={{ background: "#0D0D1A", border: "1px solid rgba(0,212,255,0.15)", color: "#FFFFFF" }}
          />
          <button
            onClick={() => fetchUsers()}
            className="px-5 py-3 rounded-xl text-sm font-medium"
            style={{ background: "rgba(0,212,255,0.15)", border: "1px solid rgba(0,212,255,0.3)", color: "#00D4FF" }}
          >
            搜尋
          </button>
          {search && (
            <button
              onClick={() => { setSearch(""); fetchUsers(); }}
              className="px-5 py-3 rounded-xl text-sm"
              style={{ background: "transparent", border: "1px solid rgba(255,51,102,0.2)", color: "#666680" }}
            >
              清除
            </button>
          )}
        </div>

        {/* Table */}
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
                <tr>
                  <td colSpan={5} className="text-center px-4 py-10" style={{ color: "#666680" }}>
                    {search ? "找不到符合的會員" : "尚無會員資料"}
                  </td>
                </tr>
              ) : (
                users.map((u) => (
                  <tr key={u.id} style={{ borderBottom: "1px solid rgba(0,212,255,0.03)" }}>
                    <td className="px-4 py-3 font-medium" style={{ color: "#FFFFFF" }}>{u.name || "-"}</td>
                    <td className="px-4 py-3" style={{ color: "#9999AA" }}>{u.gender === "男" ? "男性" : u.gender === "女" ? "女性" : "-"}</td>
                    <td className="px-4 py-3" style={{ color: "#9999AA" }}>
                      {u.year && u.month && u.day ? `${u.year}/${u.month}/${u.day}` : "-"}
                    </td>
                    <td className="px-4 py-3" style={{ color: "#9999AA" }}>{u.location || "-"}</td>
                    <td className="px-4 py-3" style={{ color: "#9999AA" }}>{formatDate(u.registeredAt)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Load More */}
        {hasMore && users.length > 0 && (
          <div className="mt-4 text-center">
            <button
              onClick={() => fetchUsers(true)}
              className="px-6 py-3 rounded-xl text-sm"
              style={{ background: "rgba(0,212,255,0.08)", border: "1px solid rgba(0,212,255,0.15)", color: "#00D4FF" }}
            >
              載入更多
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
