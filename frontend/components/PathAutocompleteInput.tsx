"use client";

import { useEffect, useMemo, useRef, useState } from "react";

type FsEntry = {
  name: string;
  path: string; // diretório termina com /
  kind: "dir" | "file";
};

type SuggestResponse = {
  input: string;
  baseDir: string;
  prefix: string;
  exists: boolean;
  entries: FsEntry[];
};

type Props = {
  label: string;
  value: string;
  onChange: (next: string) => void;
  placeholder?: string;
  required?: boolean;
  helpText?: string;
};

export default function PathAutocompleteInput({
  label,
  value,
  onChange,
  placeholder,
  required,
  helpText,
}: Props) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [resp, setResp] = useState<SuggestResponse | null>(null);
  const [error, setError] = useState<string>("");
  const rootRef = useRef<HTMLDivElement>(null);

  const debouncedValue = useDebounced(value, 120);

  const fetchSuggest = async (pathValue: string) => {
    setLoading(true);
    setError("");
    try {
      const qs = new URLSearchParams({ path: pathValue, limit: "80" });
      const r = await fetch(`/api/fs/suggest?${qs.toString()}`);
      if (!r.ok) throw new Error("Falha ao buscar sugestões");
      const data = (await r.json()) as SuggestResponse;
      setResp(data);
    } catch (e: any) {
      setError(e?.message || "Falha ao buscar sugestões");
      setResp(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!open) return;
    fetchSuggest(debouncedValue);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedValue, open]);

  useEffect(() => {
    const onDown = (ev: MouseEvent) => {
      if (!rootRef.current) return;
      if (!rootRef.current.contains(ev.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, []);

  const header = useMemo(() => {
    if (!resp) return "";
    if (!resp.exists) return "Caminho base não existe";
    return `Sugestões em: ${resp.baseDir}`;
  }, [resp]);

  return (
    <div className="space-y-1" ref={rootRef}>
      <label className="block text-sm font-medium text-gray-700">{label}</label>
      <div className="relative">
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => {
            setOpen(true);
            fetchSuggest(value);
          }}
          required={required}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder={placeholder}
          autoComplete="off"
          spellCheck={false}
        />

        {open && (
          <div className="absolute z-20 mt-2 w-full rounded-lg border border-gray-200 bg-white shadow-lg">
            <div className="flex items-center justify-between px-3 py-2 border-b border-gray-100">
              <div className="text-xs text-gray-600 truncate">{header}</div>
              {loading && <div className="text-xs text-gray-500">Carregando…</div>}
            </div>

            {error && (
              <div className="px-3 py-2 text-sm text-red-600">{error}</div>
            )}

            {!error && resp && resp.entries.length === 0 && (
              <div className="px-3 py-2 text-sm text-gray-500">
                Nenhuma sugestão.
              </div>
            )}

            {!error && resp && resp.entries.length > 0 && (
              <ul className="max-h-64 overflow-auto py-1">
                {resp.entries.map((e) => (
                  <li key={e.path}>
                    <button
                      type="button"
                      onClick={() => {
                        onChange(e.path);
                      }}
                      className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 flex items-center gap-2"
                      title={e.path}
                    >
                      <span
                        className={`inline-flex items-center justify-center w-8 h-6 rounded text-xs ${
                          e.kind === "dir"
                            ? "bg-blue-50 text-blue-700"
                            : "bg-gray-100 text-gray-700"
                        }`}
                      >
                        {e.kind === "dir" ? "DIR" : "ARQ"}
                      </span>
                      <span className="truncate">{e.name}</span>
                      <span className="ml-auto text-xs text-gray-400 truncate">
                        {e.path}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>

      {helpText && <p className="text-xs text-gray-500">{helpText}</p>}
    </div>
  );
}

function useDebounced<T>(value: T, ms: number) {
  const [v, setV] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setV(value), ms);
    return () => clearTimeout(t);
  }, [value, ms]);
  return v;
}
