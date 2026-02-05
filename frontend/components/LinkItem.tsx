"use client";

import { Link } from "@/types";
import { useState } from "react";
import TerminalDropdown from "./TerminalDropdown";

type LinkItemProps = {
  link: Link;
  onEdit: () => void;
  onDelete: () => void;
};

export default function LinkItem({ link, onEdit, onDelete }: LinkItemProps) {
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    if (!confirm("Tem certeza que deseja deletar este link?")) {
      return;
    }

    setDeleting(true);
    try {
      const res = await fetch(`/api/links/${link.id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        throw new Error("Erro ao deletar link");
      }

      onDelete();
    } catch (error) {
      console.error("Erro ao deletar link:", error);
      alert("Erro ao deletar link");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-white dark:hover:bg-slate-800 hover:border-slate-300 dark:hover:border-slate-600 transition-all duration-200 group">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-3">
          <span className="font-medium text-slate-900 dark:text-slate-100">
            {link.name}
          </span>
          <span
            className={`badge ${link.terminal ? "badge-primary" : "badge-neutral"}`}
          >
            {link.terminal ? "TERMINAL" : "NORMAL"}
          </span>
        </div>
        {!link.terminal && (
          <a
            href={link.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 mt-1 block truncate flex items-center gap-1"
          >
            <svg
              className="w-4 h-4 flex-shrink-0"
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
            <span className="truncate">{link.url}</span>
          </a>
        )}
        {link.terminal && (
          <div className="mt-2">
            <TerminalDropdown linkId={link.id} />
          </div>
        )}
      </div>
      <div className="flex gap-2 ml-4">
        <button
          onClick={onEdit}
          className="btn btn-secondary text-sm py-1.5 px-3"
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
              d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
            />
          </svg>
          Editar
        </button>
        <button
          onClick={handleDelete}
          disabled={deleting}
          className="btn btn-danger text-sm py-1.5 px-3"
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
              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
            />
          </svg>
          {deleting ? "Deletando..." : "Deletar"}
        </button>
      </div>
    </div>
  );
}
