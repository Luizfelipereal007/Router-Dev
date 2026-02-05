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
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Falha ao buscar sugestões");
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
      <label className="label">{label}</label>
      <div className="relative">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <svg
              className="h-5 w-5 text-slate-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"
              />
            </svg>
          </div>
          <input
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onFocus={() => {
              setOpen(true);
              fetchSuggest(value);
            }}
            required={required}
            className="input pl-10"
            placeholder={placeholder}
            autoComplete="off"
            spellCheck={false}
          />
          {loading && (
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
              <svg
                className="animate-spin h-4 w-4 text-slate-400"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
            </div>
          )}
        </div>

        {open && (
          <div className="absolute z-20 mt-2 w-full rounded-lg border border-slate-200 bg-white shadow-lg">
            <div className="flex items-center justify-between px-3 py-2 border-b border-slate-100">
              <div className="text-xs text-slate-600 truncate">{header}</div>
              <div className="text-xs text-slate-500">Use / para navegar</div>
            </div>

            {error && (
              <div className="px-3 py-2 text-sm text-red-600">{error}</div>
            )}

            {!error && resp && resp.entries.length === 0 && (
              <div className="px-3 py-2 text-sm text-slate-500">
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
                      className="w-full text-left px-3 py-2 text-sm hover:bg-slate-50 flex items-center gap-2"
                      title={e.path}
                    >
                      <span
                        className={`inline-flex items-center justify-center w-8 h-6 rounded text-xs ${
                          e.kind === "dir"
                            ? "bg-indigo-50 text-indigo-700"
                            : "bg-slate-100 text-slate-700"
                        }`}
                      >
                        {e.kind === "dir" ? "DIR" : "ARQ"}
                      </span>
                      <span className="truncate text-slate-700">{e.name}</span>
                      <span className="ml-auto text-xs text-slate-400 truncate">
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

      {helpText && <p className="text-xs text-slate-500">{helpText}</p>}
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
