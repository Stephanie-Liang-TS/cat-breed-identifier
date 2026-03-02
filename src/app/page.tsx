"use client";

import { useState, useRef } from "react";

interface IdentifyResult {
  is_cat: boolean;
  breed: string;
  confidence: string;
  description: string;
  traits: string[];
  fun_fact: string;
}

export default function Home() {
  const [image, setImage] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [result, setResult] = useState<IdentifyResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (!selected) return;

    setFile(selected);
    setResult(null);
    setError(null);

    const reader = new FileReader();
    reader.onload = (ev) => {
      setImage(ev.target?.result as string);
    };
    reader.readAsDataURL(selected);
  };

  const handleIdentify = async () => {
    if (!file) return;

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const formData = new FormData();
      formData.append("image", file);

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
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const confidenceColor = (c: string) => {
    if (c === "high") return "bg-green-100 text-green-800";
    if (c === "medium") return "bg-yellow-100 text-yellow-800";
    return "bg-red-100 text-red-800";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-amber-50">
      <div className="max-w-2xl mx-auto px-4 py-12">
        {/* Header */}
        <div className="text-center mb-10">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            <span className="text-5xl mr-2">🐱</span> Cat Breed Identifier
          </h1>
          <p className="text-gray-500 text-lg">
            Upload a photo and AI will identify the breed
          </p>
        </div>

        {/* Upload Area */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
          {!image ? (
            <label className="flex flex-col items-center justify-center h-64 border-2 border-dashed border-gray-200 rounded-xl cursor-pointer hover:border-orange-300 hover:bg-orange-50/50 transition-all">
              <div className="text-center">
                <div className="text-5xl mb-3">📷</div>
                <p className="text-gray-600 font-medium">
                  Click to upload a cat photo
                </p>
                <p className="text-gray-400 text-sm mt-1">
                  JPG, PNG, GIF or WebP
                </p>
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
            <div className="relative">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={image}
                alt="Uploaded cat"
                className="w-full max-h-96 object-contain rounded-xl"
              />
              <button
                onClick={handleReset}
                className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm rounded-full p-2 shadow-md hover:bg-white transition-all"
                title="Remove image"
              >
                ✕
              </button>
            </div>
          )}
        </div>

        {/* Action Button */}
        {image && !result && (
          <button
            onClick={handleIdentify}
            disabled={loading}
            className="w-full py-4 bg-orange-500 hover:bg-orange-600 disabled:bg-orange-300 text-white font-semibold rounded-xl text-lg transition-all shadow-sm"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="animate-spin inline-block">🔍</span> Identifying...
              </span>
            ) : (
              "Identify Breed"
            )}
          </button>
        )}

        {/* Error */}
        {error && (
          <div className="mt-4 p-4 bg-red-50 border border-red-100 rounded-xl text-red-700">
            {error}
          </div>
        )}

        {/* Result */}
        {result && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mt-4">
            {result.is_cat ? (
              <>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-2xl font-bold text-gray-900">
                    {result.breed}
                  </h2>
                  <span
                    className={`px-3 py-1 rounded-full text-sm font-medium ${confidenceColor(result.confidence)}`}
                  >
                    {result.confidence} confidence
                  </span>
                </div>

                <p className="text-gray-600 mb-4 leading-relaxed">
                  {result.description}
                </p>

                {result.traits.length > 0 && (
                  <div className="mb-4">
                    <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">
                      Traits
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {result.traits.map((trait, i) => (
                        <span
                          key={i}
                          className="px-3 py-1 bg-orange-50 text-orange-700 rounded-full text-sm"
                        >
                          {trait}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {result.fun_fact && (
                  <div className="bg-amber-50 rounded-xl p-4 mt-4">
                    <p className="text-sm text-amber-800">
                      <span className="font-semibold">Fun fact:</span>{" "}
                      {result.fun_fact}
                    </p>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-4">
                <div className="text-4xl mb-3">🤔</div>
                <p className="text-gray-600">{result.description}</p>
              </div>
            )}

            <button
              onClick={handleReset}
              className="w-full mt-6 py-3 border border-gray-200 text-gray-600 font-medium rounded-xl hover:bg-gray-50 transition-all"
            >
              Try another photo
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
