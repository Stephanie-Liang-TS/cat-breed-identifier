"use client";

import { useState, useEffect, useCallback } from "react";

interface HistoryItem {
  id: string;
  created_at: string;
  image_thumbnail: string;
  breed: string;
  breed_zh: string;
  confidence: string;
  description: string;
  traits: string[];
  fun_fact: string;
  price_range_usd: string;
  price_range_cny: string;
  quality_rating: string;
  quality_comment: string;
}

type Lang = "en" | "zh";

const I18N = {
  en: {
    title: "Identification History",
    subtitle: "Your furry friends collection",
    empty: "No identifications yet! Go identify some kitties~",
    goIdentify: "Identify a kitty",
    loading: "Loading history…",
    deleteConfirm: "Delete this record?",
    deleted: "Deleted!",
    error: "Failed to load history",
    confidence: "Confidence",
    traits: "Traits",
    funFact: "Fun fact",
    price: "Price",
    quality: "Quality",
    langEn: "EN",
    langZh: "中文",
  },
  zh: {
    title: "识别历史",
    subtitle: "你的猫咪图鉴",
    empty: "还没有识别记录哦！去识别一些猫咪吧~",
    goIdentify: "去识别猫咪",
    loading: "加载中…",
    deleteConfirm: "确定删除这条记录？",
    deleted: "已删除！",
    error: "加载历史记录失败",
    confidence: "置信度",
    traits: "特征",
    funFact: "趣味小知识",
    price: "价格",
    quality: "品相",
    langEn: "EN",
    langZh: "中文",
  },
} as const;

const GRADE_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  S:    { bg: "#fff0f0", text: "#d4145a", border: "#ff7eb3" },
  "A+": { bg: "#fff0f5", text: "#c0175a", border: "#f9a8c9" },
  A:    { bg: "#fff3e8", text: "#b85c00", border: "#ffb97a" },
  "B+": { bg: "#fffbe8", text: "#8a6d00", border: "#f5d675" },
  B:    { bg: "#f0faf0", text: "#2d6a2d", border: "#86c986" },
  C:    { bg: "#f0f4ff", text: "#3a4db8", border: "#a0b0f0" },
};

function QualityBadge({ rating }: { rating: string }) {
  const c = GRADE_COLORS[rating] ?? { bg: "#f5f5f5", text: "#666", border: "#ccc" };
  return (
    <span
      className="inline-flex items-center justify-center w-10 h-10 rounded-xl font-extrabold text-lg shrink-0"
      style={{ background: c.bg, color: c.text, border: `2px solid ${c.border}` }}
    >
      {rating}
    </span>
  );
}

function ConfidenceDot({ confidence }: { confidence: string }) {
  const color = confidence === "high" ? "#48bb78" : confidence === "medium" ? "#ecc94b" : "#fc8181";
  return (
    <span className="inline-flex items-center gap-1 text-xs font-semibold" style={{ color }}>
      <span className="w-2 h-2 rounded-full inline-block" style={{ background: color }} />
      {confidence}
    </span>
  );
}

function formatDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

export default function HistoryPage() {
  const [lang, setLang] = useState<Lang>("en");
  const [items, setItems] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const t = I18N[lang];

  const fetchHistory = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/history?limit=50");
      if (!res.ok) throw new Error("Failed to fetch");
      const json = await res.json();
      setItems(json.data ?? []);
    } catch {
      setError(t.error);
    } finally {
      setLoading(false);
    }
  }, [t.error]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  const handleDelete = async (id: string) => {
    if (!confirm(t.deleteConfirm)) return;
    try {
      const res = await fetch(`/api/history/${id}`, { method: "DELETE" });
      if (res.ok) {
        setItems((prev) => prev.filter((item) => item.id !== id));
      }
    } catch {
      // silently fail
    }
  };

  return (
    <div
      className="min-h-screen"
      style={{ background: "linear-gradient(160deg, #fff8f5 0%, #fde8e0 50%, #fff3ec 100%)" }}
    >
      <div className="max-w-2xl mx-auto px-4 py-10 pb-16">
        {/* Header */}
        <div className="text-center mb-8 relative">
          <div className="absolute top-0 right-0 flex gap-2">
            <button
              onClick={() => setLang(lang === "en" ? "zh" : "en")}
              className="flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-semibold"
              style={{
                background: "rgba(255,255,255,0.75)",
                border: "1.5px solid rgba(255,185,151,0.55)",
                color: "#c97b5a",
                backdropFilter: "blur(8px)",
              }}
            >
              <span style={{ opacity: lang === "en" ? 1 : 0.45 }}>EN</span>
              <span style={{ color: "#ffb997" }}>|</span>
              <span style={{ opacity: lang === "zh" ? 1 : 0.45 }}>中文</span>
            </button>
          </div>

          <div className="text-2xl mb-2 select-none opacity-40">📚 🐱 📚</div>
          <h1 className="text-3xl font-extrabold mb-1" style={{ color: "#7c3a2d" }}>
            {t.title} <span className="text-2xl">🐾</span>
          </h1>
          <p className="text-sm" style={{ color: "#c97b5a" }}>{t.subtitle}</p>
        </div>

        {/* Back link */}
        <a
          href="/"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold mb-6 transition-all"
          style={{
            background: "rgba(255,255,255,0.75)",
            border: "1.5px solid rgba(255,185,151,0.35)",
            color: "#c97b5a",
          }}
        >
          ← 🐱 {lang === "zh" ? "返回识别" : "Back to Identify"}
        </a>

        {/* Loading */}
        {loading && (
          <div className="text-center py-16">
            <div className="text-4xl mb-3 animate-bounce">🐾</div>
            <p className="text-sm" style={{ color: "#c97b5a" }}>{t.loading}</p>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="px-5 py-4 rounded-2xl mb-4" style={{ background: "#ffe4e6", border: "1.5px solid #fca5a5", color: "#9f1239" }}>
            <span className="text-xl mr-2">😿</span>{error}
          </div>
        )}

        {/* Empty state */}
        {!loading && !error && items.length === 0 && (
          <div className="text-center py-16">
            <div className="text-6xl mb-4">🐱</div>
            <p className="text-base font-semibold mb-4" style={{ color: "#7c3a2d" }}>{t.empty}</p>
            <a
              href="/"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl text-sm font-semibold"
              style={{ background: "linear-gradient(135deg,#ff8c6b,#f5a623)", color: "white" }}
            >
              🐾 {t.goIdentify}
            </a>
          </div>
        )}

        {/* History cards */}
        <div className="space-y-4">
          {items.map((item) => {
            const isExpanded = expandedId === item.id;
            return (
              <div
                key={item.id}
                className="rounded-2xl overflow-hidden transition-all"
                style={{
                  background: "rgba(255,255,255,0.85)",
                  backdropFilter: "blur(12px)",
                  border: "1.5px solid rgba(255,185,151,0.3)",
                  boxShadow: "0 4px 16px rgba(255,150,120,0.1)",
                }}
              >
                {/* Card header — always visible */}
                <button
                  onClick={() => setExpandedId(isExpanded ? null : item.id)}
                  className="w-full px-4 py-3 flex items-center gap-3 text-left"
                >
                  {/* Thumbnail */}
                  {item.image_thumbnail && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={item.image_thumbnail}
                      alt={item.breed}
                      className="w-14 h-14 rounded-xl object-cover shrink-0"
                      style={{ border: "2px solid rgba(255,185,151,0.3)" }}
                    />
                  )}

                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-bold truncate" style={{ color: "#7c3a2d" }}>
                      {lang === "zh" && item.breed_zh ? item.breed_zh : item.breed}
                    </h3>
                    <div className="flex items-center gap-2 mt-0.5">
                      <ConfidenceDot confidence={item.confidence} />
                      <span className="text-xs opacity-50" style={{ color: "#c97b5a" }}>
                        {formatDate(item.created_at)}
                      </span>
                    </div>
                  </div>

                  {item.quality_rating && <QualityBadge rating={item.quality_rating} />}

                  <span className="text-xs opacity-40 transition-transform" style={{ transform: isExpanded ? "rotate(180deg)" : "" }}>
                    ▼
                  </span>
                </button>

                {/* Expanded details */}
                {isExpanded && (
                  <div className="px-4 pb-4 space-y-3 border-t" style={{ borderColor: "rgba(255,185,151,0.2)" }}>
                    {/* English subtitle in zh mode */}
                    {lang === "zh" && item.breed_zh && (
                      <p className="text-xs opacity-50 pt-2" style={{ color: "#7c3a2d" }}>{item.breed}</p>
                    )}

                    {/* Description */}
                    <p className="text-sm leading-relaxed pt-2" style={{ color: "#5c3d30" }}>
                      {item.description}
                    </p>

                    {/* Traits */}
                    {item.traits?.length > 0 && (
                      <div>
                        <p className="text-xs font-bold uppercase tracking-wider mb-1" style={{ color: "#c97b5a" }}>
                          🏷 {t.traits}
                        </p>
                        <div className="flex flex-wrap gap-1.5">
                          {item.traits.map((trait, i) => (
                            <span
                              key={i}
                              className="px-2 py-0.5 rounded-full text-xs font-medium"
                              style={{ background: "#fff0eb", color: "#c97b5a", border: "1px solid rgba(255,185,151,0.3)" }}
                            >
                              {trait}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Fun fact */}
                    {item.fun_fact && (
                      <div className="rounded-xl px-4 py-3" style={{ background: "#fff8e7", border: "1px solid rgba(245,166,35,0.2)" }}>
                        <p className="text-xs font-bold mb-1" style={{ color: "#c97b5a" }}>💡 {t.funFact}</p>
                        <p className="text-sm" style={{ color: "#7c3a2d" }}>{item.fun_fact}</p>
                      </div>
                    )}

                    {/* Price */}
                    {(item.price_range_usd || item.price_range_cny) && (
                      <div className="rounded-xl px-4 py-3" style={{ background: "#f0fff4", border: "1px solid rgba(72,187,120,0.2)" }}>
                        <p className="text-xs font-bold mb-1" style={{ color: "#276749" }}>💰 {t.price}</p>
                        {item.price_range_usd && <p className="text-sm" style={{ color: "#22543d" }}>USD: {item.price_range_usd}</p>}
                        {item.price_range_cny && <p className="text-sm" style={{ color: "#22543d" }}>CNY: {item.price_range_cny}</p>}
                      </div>
                    )}

                    {/* Quality comment */}
                    {item.quality_comment && (
                      <div className="rounded-xl px-4 py-3" style={{ background: "#fdf4ff", border: "1px solid rgba(192,23,90,0.15)" }}>
                        <p className="text-xs font-bold mb-1" style={{ color: "#7b3092" }}>⭐ {t.quality}</p>
                        <p className="text-sm" style={{ color: "#5c3d6e" }}>{item.quality_comment}</p>
                      </div>
                    )}

                    {/* Delete button */}
                    <div className="pt-1">
                      <button
                        onClick={(e) => { e.stopPropagation(); handleDelete(item.id); }}
                        className="text-xs px-3 py-1.5 rounded-full transition-all"
                        style={{ background: "#ffe4e6", color: "#9f1239", border: "1px solid #fca5a5" }}
                      >
                        🗑 {lang === "zh" ? "删除" : "Delete"}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
