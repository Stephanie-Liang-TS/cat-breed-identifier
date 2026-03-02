"use client";

import { useState, useRef } from "react";

interface IdentifyResult {
  is_cat: boolean;
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
    title: "Meow Identifier",
    subtitle: "Drop a kitty photo and our AI will sniff out the breed~",
    dragActive: "Drop it right here!",
    dragIdle: "Click or drag a cat photo",
    formats: "JPG · PNG · GIF · WebP",
    choosePhoto: "Choose photo",
    identifyBtn: "Identify this kitty!",
    loading: "Sniffing out the breed…",
    errorTitle: "Oops, something went wrong",
    notCatTitle: "Hmm, is that a cat?",
    breedIdentified: "Breed identified",
    traitsLabel: "Traits",
    funFactLabel: "Fun fact",
    priceLabel: "Price Estimate",
    priceUsd: "USD",
    priceCny: "CNY",
    qualityLabel: "Appearance Quality",
    tryAnother: "Try another kitty",
    history: "History",
    footer: "Made with 🧡 for cat lovers everywhere",
    langToggleEn: "EN",
    langToggleZh: "中文",
  },
  zh: {
    title: "猫咪识别器",
    subtitle: "上传一张猫咪照片，AI 来帮你鉴别品种~",
    dragActive: "放在这里！",
    dragIdle: "点击或拖拽猫咪照片",
    formats: "JPG · PNG · GIF · WebP",
    choosePhoto: "选择照片",
    identifyBtn: "识别这只猫！",
    loading: "正在嗅探品种…",
    errorTitle: "哎呀，出了点问题",
    notCatTitle: "这是猫吗？",
    breedIdentified: "品种识别",
    traitsLabel: "特征",
    funFactLabel: "趣味小知识",
    priceLabel: "价格估算",
    priceUsd: "美元",
    priceCny: "人民币",
    qualityLabel: "品相评价",
    tryAnother: "再试一只猫",
    history: "历史记录",
    footer: "用 🧡 为全球猫咪爱好者制作",
    langToggleEn: "EN",
    langToggleZh: "中文",
  },
} as const;

// Scattered paw print positions for the background decoration
const PAW_POSITIONS = [
  { top: "4%",  left: "3%",  rotate: "15deg",  size: "1.6rem" },
  { top: "8%",  left: "88%", rotate: "-20deg", size: "1.2rem" },
  { top: "18%", left: "94%", rotate: "40deg",  size: "1.8rem" },
  { top: "30%", left: "1%",  rotate: "-10deg", size: "1.4rem" },
  { top: "45%", left: "96%", rotate: "25deg",  size: "1.1rem" },
  { top: "55%", left: "5%",  rotate: "-35deg", size: "1.5rem" },
  { top: "68%", left: "91%", rotate: "10deg",  size: "1.3rem" },
  { top: "78%", left: "2%",  rotate: "50deg",  size: "1.2rem" },
  { top: "85%", left: "89%", rotate: "-15deg", size: "1.7rem" },
  { top: "93%", left: "10%", rotate: "30deg",  size: "1.1rem" },
  { top: "92%", left: "75%", rotate: "-40deg", size: "1.4rem" },
  { top: "12%", left: "50%", rotate: "20deg",  size: "0.9rem" },
];

function PawBackground() {
  return (
    <div className="paw-bg" aria-hidden="true">
      {PAW_POSITIONS.map((p, i) => (
        <span
          key={i}
          style={{
            top: p.top,
            left: p.left,
            transform: `rotate(${p.rotate})`,
            fontSize: p.size,
          }}
        >
          🐾
        </span>
      ))}
    </div>
  );
}

function LoadingPaws({ label }: { label: string }) {
  return (
    <div className="flex flex-col items-center gap-3 py-2">
      <div className="paw-loading flex gap-3 text-3xl">
        <span>🐾</span>
        <span>🐾</span>
        <span>🐾</span>
      </div>
      <p className="text-[#c97b5a] text-sm font-medium tracking-wide">
        {label}
      </p>
    </div>
  );
}

function ConfidenceBadge({ confidence }: { confidence: string }) {
  const cls =
    confidence === "high"
      ? "badge-high"
      : confidence === "medium"
      ? "badge-medium"
      : "badge-low";
  const emoji =
    confidence === "high" ? "✨" : confidence === "medium" ? "🌙" : "🔍";
  return (
    <span className={`${cls} px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wide`}>
      {emoji} {confidence}
    </span>
  );
}

function QualityGrade({ rating }: { rating: string }) {
  const gradeColors: Record<string, { bg: string; text: string; border: string }> = {
    "S":  { bg: "#fff0f0", text: "#d4145a", border: "#ff7eb3" },
    "A+": { bg: "#fff0f5", text: "#c0175a", border: "#f9a8c9" },
    "A":  { bg: "#fff3e8", text: "#b85c00", border: "#ffb97a" },
    "B+": { bg: "#fffbe8", text: "#8a6d00", border: "#f5d675" },
    "B":  { bg: "#f0faf0", text: "#2d6a2d", border: "#86c986" },
    "C":  { bg: "#f0f4ff", text: "#3a4db8", border: "#a0b0f0" },
  };
  const colors = gradeColors[rating] ?? { bg: "#f5f5f5", text: "#666", border: "#ccc" };
  return (
    <div
      className="flex items-center justify-center w-16 h-16 rounded-2xl font-extrabold text-3xl shrink-0"
      style={{
        background: colors.bg,
        color: colors.text,
        border: `2px solid ${colors.border}`,
        boxShadow: `0 4px 12px ${colors.border}55`,
      }}
    >
      {rating}
    </div>
  );
}

export default function Home() {
  const [lang, setLang] = useState<Lang>("en");
  const [image, setImage] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [result, setResult] = useState<IdentifyResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const t = I18N[lang];

  const processFile = (selected: File) => {
    setFile(selected);
    setResult(null);
    setError(null);
    const reader = new FileReader();
    reader.onload = (ev) => setImage(ev.target?.result as string);
    reader.readAsDataURL(selected);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (selected) processFile(selected);
  };

  const handleDrop = (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    setDragging(false);
    const selected = e.dataTransfer.files?.[0];
    if (selected && selected.type.startsWith("image/")) processFile(selected);
  };

  // Generate a compressed thumbnail from the current image
  const generateThumbnail = (imgSrc: string): Promise<string> => {
    return new Promise((resolve) => {
      const img = new window.Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const maxSize = 200;
        const scale = Math.min(maxSize / img.width, maxSize / img.height, 1);
        canvas.width = img.width * scale;
        canvas.height = img.height * scale;
        const ctx = canvas.getContext("2d")!;
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL("image/jpeg", 0.6));
      };
      img.src = imgSrc;
    });
  };

  const handleIdentify = async () => {
    if (!file) return;
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const formData = new FormData();
      formData.append("image", file);
      formData.append("lang", lang);

      const res = await fetch("/api/identify", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Identification failed");
      }

      const data: IdentifyResult = await res.json();
      setResult(data);

      // Auto-save to history if it's a cat
      if (data.is_cat && image) {
        try {
          const thumbnail = await generateThumbnail(image);
          await fetch("/api/history", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ ...data, image_thumbnail: thumbnail, lang }),
          });
        } catch {
          // Silently fail — history save is non-critical
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setImage(null);
    setFile(null);
    setResult(null);
    setError(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <div
      className="relative min-h-screen"
      style={{ background: "linear-gradient(160deg, #fff8f5 0%, #fde8e0 50%, #fff3ec 100%)" }}
    >
      <PawBackground />

      <div className="relative z-10 max-w-xl mx-auto px-4 py-10 pb-16">

        {/* ── Header ── */}
        <div className="text-center mb-9 relative">
          {/* Top-right controls: History + Language toggle */}
          <div className="absolute top-0 right-0 flex items-center gap-2 z-10">
            <a
              href="/history"
              className="flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-semibold transition-all"
              style={{
                background: "rgba(255,255,255,0.75)",
                border: "1.5px solid rgba(255,185,151,0.55)",
                color: "#c97b5a",
                backdropFilter: "blur(8px)",
                boxShadow: "0 2px 8px rgba(255,150,120,0.12)",
              }}
            >
              📚 {t.history}
            </a>
            <button
              onClick={() => setLang(lang === "en" ? "zh" : "en")}
              className="flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-semibold transition-all duration-200"
              style={{
                background: "rgba(255,255,255,0.75)",
                border: "1.5px solid rgba(255,185,151,0.55)",
                color: "#c97b5a",
                backdropFilter: "blur(8px)",
                boxShadow: "0 2px 8px rgba(255,150,120,0.12)",
              }}
              title="Switch language / 切换语言"
            >
              <span style={{ opacity: lang === "en" ? 1 : 0.45 }}>EN</span>
              <span style={{ color: "#ffb997" }}>|</span>
              <span style={{ opacity: lang === "zh" ? 1 : 0.45 }}>中文</span>
            </button>
          </div>

          {/* Cat silhouette strip */}
          <div className="flex justify-center gap-1 text-2xl mb-3 opacity-40 select-none" aria-hidden="true">
            🐈 🐱 🐈‍⬛ 🐱 🐈
          </div>

          <h1
            className="text-4xl font-extrabold mb-2 leading-tight"
            style={{ color: "#7c3a2d", textShadow: "0 2px 8px rgba(255,150,120,0.18)" }}
          >
            {t.title}
            <span className="text-3xl ml-2">🐾</span>
          </h1>

          <p className="text-base" style={{ color: "#c97b5a" }}>
            {t.subtitle}
          </p>

          {/* Decorative whisker line */}
          <div className="flex items-center justify-center gap-3 mt-3 select-none" aria-hidden="true">
            <span className="text-xs opacity-30" style={{ color: "#c97b5a" }}>—— ✦ ——</span>
            <span className="text-lg">🐱</span>
            <span className="text-xs opacity-30" style={{ color: "#c97b5a" }}>—— ✦ ——</span>
          </div>
        </div>

        {/* ── Upload Card ── */}
        <div
          className="rounded-3xl p-5 mb-5"
          style={{
            background: "rgba(255,255,255,0.82)",
            backdropFilter: "blur(12px)",
            boxShadow: "0 8px 32px rgba(255,150,120,0.14), 0 1px 0 rgba(255,255,255,0.9) inset",
            border: "1.5px solid rgba(255,185,151,0.35)",
          }}
        >
          {!image ? (
            /* Drop zone */
            <label
              className={`upload-zone flex flex-col items-center justify-center h-60 rounded-2xl cursor-pointer transition-all duration-300 ${
                dragging ? "scale-[1.02]" : ""
              }`}
              style={{
                border: `2px dashed ${dragging ? "#f5a623" : "#ffb997"}`,
                background: dragging ? "#fde8e0" : "#fff8f5",
              }}
              onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
              onDragLeave={() => setDragging(false)}
              onDrop={handleDrop}
            >
              <div className="text-center px-4">
                <div className="text-5xl mb-3 select-none">
                  {dragging ? "🐾" : "📷"}
                </div>
                <p className="font-semibold text-base mb-1" style={{ color: "#7c3a2d" }}>
                  {dragging ? t.dragActive : t.dragIdle}
                </p>
                <p className="text-sm" style={{ color: "#c97b5a" }}>
                  {t.formats}
                </p>
                <div className="mt-3 inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm font-medium"
                  style={{ background: "linear-gradient(135deg,#ffb997,#f9c4c4)", color: "#7c3a2d" }}>
                  <span>🐱</span> {t.choosePhoto}
                </div>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/gif,image/webp"
                onChange={handleFileChange}
                className="hidden"
              />
            </label>
          ) : (
            /* Photo preview — cozy frame */
            <div className="relative group">
              <div
                className="rounded-2xl overflow-hidden"
                style={{
                  padding: "8px",
                  background: "linear-gradient(135deg,#fde8e0,#ffd6d6,#fde8e0)",
                  boxShadow: "0 4px 20px rgba(255,120,100,0.15)",
                }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={image}
                  alt="Your cat"
                  className="w-full max-h-80 object-contain rounded-xl"
                  style={{ background: "#fff8f5" }}
                />
              </div>
              {/* Corner decoration */}
              <div className="absolute top-1 left-2 text-lg select-none opacity-60" aria-hidden="true">🌸</div>
              <div className="absolute top-1 right-10 text-lg select-none opacity-60" aria-hidden="true">🌸</div>

              <button
                onClick={handleReset}
                className="absolute top-2 right-2 w-8 h-8 flex items-center justify-center rounded-full text-sm font-bold transition-all"
                style={{ background: "rgba(255,255,255,0.9)", color: "#c97b5a", boxShadow: "0 2px 8px rgba(0,0,0,0.12)" }}
                title="Remove photo"
              >
                ✕
              </button>
            </div>
          )}
        </div>

        {/* ── Identify Button ── */}
        {image && !result && (
          <button
            onClick={handleIdentify}
            disabled={loading}
            className="w-full py-4 rounded-2xl text-white font-bold text-lg transition-all duration-200 mb-4"
            style={{
              background: loading
                ? "linear-gradient(135deg,#ffcab4,#f9d6d6)"
                : "linear-gradient(135deg,#ff8c6b,#f5a623)",
              boxShadow: loading ? "none" : "0 6px 20px rgba(255,120,80,0.35)",
              color: loading ? "#c97b5a" : "white",
              transform: loading ? "none" : undefined,
            }}
          >
            {loading ? (
              <LoadingPaws label={t.loading} />
            ) : (
              <span className="flex items-center justify-center gap-2">
                <span>🔍</span> {t.identifyBtn}
              </span>
            )}
          </button>
        )}

        {/* ── Error ── */}
        {error && (
          <div
            className="mb-4 px-5 py-4 rounded-2xl flex items-start gap-3"
            style={{ background: "#ffe4e6", border: "1.5px solid #fca5a5", color: "#9f1239" }}
          >
            <span className="text-xl shrink-0">😿</span>
            <div>
              <p className="font-semibold text-sm">{t.errorTitle}</p>
              <p className="text-sm mt-0.5 opacity-80">{error}</p>
            </div>
          </div>
        )}

        {/* ── Result Card ── */}
        {result && (
          <div
            className="result-pop rounded-3xl overflow-hidden"
            style={{
              background: "rgba(255,255,255,0.88)",
              backdropFilter: "blur(12px)",
              boxShadow: "0 8px 40px rgba(255,150,120,0.18), 0 1px 0 rgba(255,255,255,0.9) inset",
              border: "1.5px solid rgba(255,185,151,0.35)",
            }}
          >
            {result.is_cat ? (
              <>
                {/* Profile header strip */}
                <div
                  className="px-6 py-5"
                  style={{ background: "linear-gradient(135deg,#fde8e0 0%,#ffd6d6 100%)" }}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-2xl">🐱</span>
                        <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: "#c97b5a" }}>
                          {t.breedIdentified}
                        </p>
                      </div>
                      <h2
                        className="text-2xl font-extrabold leading-tight"
                        style={{ color: "#7c3a2d" }}
                      >
                        {lang === "zh" && result.breed_zh ? result.breed_zh : result.breed}
                      </h2>
                      {lang === "zh" && result.breed_zh && (
                        <p className="text-xs mt-1 opacity-60" style={{ color: "#7c3a2d" }}>
                          {result.breed}
                        </p>
                      )}
                    </div>
                    <div className="shrink-0 mt-1">
                      <ConfidenceBadge confidence={result.confidence} />
                    </div>
                  </div>
                </div>

                {/* Body */}
                <div className="px-6 py-5 space-y-5">
                  {/* Description */}
                  <p className="text-sm leading-relaxed" style={{ color: "#5c3d30" }}>
                    {result.description}
                  </p>

                  {/* Traits */}
                  {result.traits.length > 0 && (
                    <div>
                      <p
                        className="text-xs font-bold uppercase tracking-widest mb-2"
                        style={{ color: "#c97b5a" }}
                      >
                        🏷 {t.traitsLabel}
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {result.traits.map((trait, i) => (
                          <span key={i} className="trait-pill">
                            🐾 {trait}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Fun fact */}
                  {result.fun_fact && (
                    <div
                      className="rounded-2xl px-5 py-4 flex gap-3"
                      style={{
                        background: "linear-gradient(135deg,#fff8e7,#fde8e0)",
                        border: "1.5px solid rgba(245,166,35,0.25)",
                      }}
                    >
                      <span className="text-xl shrink-0">💡</span>
                      <div>
                        <p className="text-xs font-bold uppercase tracking-wider mb-1" style={{ color: "#c97b5a" }}>
                          {t.funFactLabel}
                        </p>
                        <p className="text-sm leading-relaxed" style={{ color: "#7c3a2d" }}>
                          {result.fun_fact}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* ── Price Estimation ── */}
                  {(result.price_range_usd || result.price_range_cny) && (
                    <div
                      className="rounded-2xl px-5 py-4"
                      style={{
                        background: "linear-gradient(135deg,#f0fff4,#e8f9ec)",
                        border: "1.5px solid rgba(72,187,120,0.3)",
                      }}
                    >
                      <p className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color: "#276749" }}>
                        💰 {t.priceLabel}
                      </p>
                      <div className="flex flex-col gap-2">
                        {result.price_range_usd && (
                          <div className="flex items-center justify-between">
                            <span
                              className="text-xs font-semibold px-2 py-0.5 rounded-full"
                              style={{ background: "rgba(72,187,120,0.15)", color: "#276749" }}
                            >
                              {t.priceUsd}
                            </span>
                            <span className="text-base font-extrabold" style={{ color: "#22543d" }}>
                              {result.price_range_usd}
                            </span>
                          </div>
                        )}
                        {result.price_range_cny && (
                          <div className="flex items-center justify-between">
                            <span
                              className="text-xs font-semibold px-2 py-0.5 rounded-full"
                              style={{ background: "rgba(72,187,120,0.15)", color: "#276749" }}
                            >
                              {t.priceCny}
                            </span>
                            <span className="text-base font-extrabold" style={{ color: "#22543d" }}>
                              {result.price_range_cny}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* ── Appearance Quality Rating ── */}
                  {result.quality_rating && (
                    <div
                      className="rounded-2xl px-5 py-4"
                      style={{
                        background: "linear-gradient(135deg,#fdf4ff,#f5e8ff)",
                        border: "1.5px solid rgba(192,23,90,0.18)",
                      }}
                    >
                      <p className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color: "#7b3092" }}>
                        ⭐ {t.qualityLabel}
                      </p>
                      <div className="flex items-start gap-4">
                        <QualityGrade rating={result.quality_rating} />
                        {result.quality_comment && (
                          <p className="text-sm leading-relaxed flex-1" style={{ color: "#5c3d6e" }}>
                            {result.quality_comment}
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </>
            ) : (
              /* Not a cat */
              <div className="px-6 py-10 text-center">
                <div className="text-5xl mb-3">🙈</div>
                <h3 className="text-lg font-bold mb-2" style={{ color: "#7c3a2d" }}>
                  {t.notCatTitle}
                </h3>
                <p className="text-sm leading-relaxed" style={{ color: "#c97b5a" }}>
                  {result.description}
                </p>
              </div>
            )}

            {/* Footer action */}
            <div className="px-6 pb-6">
              <button
                onClick={handleReset}
                className="w-full py-3 rounded-2xl text-sm font-semibold transition-all"
                style={{
                  background: "linear-gradient(135deg,#fff0eb,#ffe4dc)",
                  color: "#c97b5a",
                  border: "1.5px solid rgba(255,185,151,0.5)",
                }}
              >
                🐾 {t.tryAnother}
              </button>
            </div>
          </div>
        )}

        {/* ── Footer ── */}
        <p
          className="text-center text-xs mt-8 select-none"
          style={{ color: "rgba(201,123,90,0.5)" }}
          aria-hidden="true"
        >
          {t.footer}
        </p>
      </div>
    </div>
  );
}
