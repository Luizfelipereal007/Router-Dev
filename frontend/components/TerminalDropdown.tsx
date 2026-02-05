"use client";

import { useEffect, useRef, useState } from "react";

type TerminalDropdownProps = {
  linkId: number;
};

export default function TerminalDropdown({ linkId }: TerminalDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleOpenTerminal = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/links/${linkId}/terminal`, {
        method: "POST",
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Erro ao abrir terminal");
      }

      setIsOpen(false);
      alert("Terminal aberto com sucesso!");
    } catch (error: unknown) {
      console.error("Erro ao abrir terminal:", error);
      alert(error instanceof Error ? error.message : "Erro ao abrir terminal");
    } finally {
      setLoading(false);
    }
  };

  const handleOpenLink = async () => {
    try {
      const res = await fetch(`/api/links/${linkId}`);
      if (!res.ok) throw new Error("Erro ao buscar link");
      const link = await res.json();
      window.open(link.url, "_blank");
      setIsOpen(false);
    } catch {
      console.error("Erro ao abrir link");
      alert("Erro ao abrir link");
    }
  };

  return (
    <div className="relative inline-block" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="btn btn-primary text-sm py-1.5 px-3"
      >
        <svg
          className="w-4 h-4 mr-1"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
          />
        </svg>
        Terminal
        <svg
          className={`w-4 h-4 ml-1 transition-transform ${isOpen ? "rotate-180" : ""}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute left-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-slate-200 z-10 animate-fade-in">
          <button
            onClick={handleOpenTerminal}
            disabled={loading}
            className="w-full text-left px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2 rounded-t-lg disabled:opacity-50"
          >
            <svg
              className="w-4 h-4 text-slate-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
            {loading ? "Abrindo..." : "Abrir Projeto"}
          </button>
          <button
            onClick={handleOpenLink}
            className="w-full text-left px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2 rounded-b-lg"
          >
            <svg
              className="w-4 h-4 text-slate-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
              />
            </svg>
            Acessar Link
          </button>
        </div>
      )}
    </div>
  );
}
