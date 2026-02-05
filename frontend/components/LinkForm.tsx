"use client";

import { Link } from "@/types";
import { useEffect, useState } from "react";

type LinkFormProps = {
  projectId: number;
  link?: Link | null;
  onSuccess: () => void;
  onCancel: () => void;
};

export default function LinkForm({
  projectId,
  link,
  onSuccess,
  onCancel,
}: LinkFormProps) {
  const [name, setName] = useState("");
  const [url, setUrl] = useState("");
  const [terminal, setTerminal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (link) {
      setName(link.name);
      setUrl(link.url);
      setTerminal(link.terminal);
    }
  }, [link]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const body = { name, url, terminal };

      if (link) {
        const res = await fetch(`/api/links/${link.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });

        if (!res.ok) {
          let errorMessage = "Erro ao atualizar link";
          try {
            const data = await res.json();
            errorMessage = data.error || errorMessage;
          } catch {
            // Response body is empty or not valid JSON
          }
          throw new Error(errorMessage);
        }
      } else {
        const res = await fetch(`/api/projects/${projectId}/links`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });

        if (!res.ok) {
          let errorMessage = "Erro ao criar link";
          try {
            const data = await res.json();
            errorMessage = data.error || errorMessage;
          } catch {
            // Response body is empty or not valid JSON
          }
          throw new Error(errorMessage);
        }
      }

      onSuccess();
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Erro desconhecido");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="form-container animate-fade-in">
      <h3 className="section-title mb-4">
        {link ? "Editar Link" : "Novo Link"}
      </h3>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="label">Nome</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="input"
            placeholder="Ex: DEV, HOM, PRD"
          />
        </div>

        <div>
          <label className="label">URL</label>
          <input
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            required
            className="input"
            placeholder="https://exemplo.com"
          />
          <p className="text-xs text-slate-500 mt-1">
            Para links TERMINAL, essa URL será usada na opção Acessar Link.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <input
            type="checkbox"
            id="terminal"
            checked={terminal}
            onChange={(e) => setTerminal(e.target.checked)}
            className="w-4 h-4 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500"
          />
          <label htmlFor="terminal" className="text-sm text-slate-700">
            Link TERMINAL
          </label>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
            {error}
          </div>
        )}

        <div className="flex gap-3 pt-2">
          <button type="submit" disabled={loading} className="btn btn-primary">
            {loading ? (
              <>
                <svg
                  className="animate-spin -ml-1 mr-2 h-4 w-4"
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
                Salvando...
              </>
            ) : link ? (
              "Atualizar"
            ) : (
              "Criar"
            )}
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="btn btn-secondary"
          >
            Cancelar
          </button>
        </div>
      </form>
    </div>
  );
}
