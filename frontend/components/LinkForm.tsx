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
          const data = await res.json();
          throw new Error(data.error || "Erro ao atualizar link");
        }
      } else {
        const res = await fetch(`/api/projects/${projectId}/links`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });

        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || "Erro ao criar link");
        }
      }

      onSuccess();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        {link ? "Editar Link" : "Novo Link"}
      </h3>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Nome
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Ex: DEV, HOM, PRD"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            URL
          </label>
          <input
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="https://exemplo.com"
          />
          <p className="text-xs text-gray-500 mt-1">
            Para links TERMINAL, essa URL será usada na opção Acessar Link.
          </p>
        </div>

        <div className="flex items-center">
          <input
            type="checkbox"
            id="terminal"
            checked={terminal}
            onChange={(e) => setTerminal(e.target.checked)}
            className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
          />
          <label
            htmlFor="terminal"
            className="ml-2 block text-sm text-gray-700"
          >
            Link TERMINAL
          </label>
        </div>

        {error && <div className="text-red-600 text-sm">{error}</div>}

        <div className="flex gap-2">
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? "Salvando..." : link ? "Atualizar" : "Criar"}
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
          >
            Cancelar
          </button>
        </div>
      </form>
    </div>
  );
}
