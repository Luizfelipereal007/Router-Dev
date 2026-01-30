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
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
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
    } catch (error: any) {
      console.error("Erro ao abrir terminal:", error);
      alert(error.message || "Erro ao abrir terminal");
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
    } catch (error) {
      console.error("Erro ao abrir link:", error);
      alert("Erro ao abrir link");
    }
  };

  return (
    <div className="relative inline-block" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700 flex items-center gap-1"
      >
        Terminal
        <svg
          className={`w-4 h-4 transition-transform ${isOpen ? "rotate-180" : ""}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute left-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-10">
          <button
            onClick={handleOpenTerminal}
            disabled={loading}
            className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-t-lg disabled:opacity-50"
          >
            {loading ? "Abrindo..." : "Abrir Projeto"}
          </button>
          <button
            onClick={handleOpenLink}
            className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-b-lg"
          >
            Acessar Link
          </button>
        </div>
      )}
    </div>
  );
}
