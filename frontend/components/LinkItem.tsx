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
    <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50">
      <div className="flex-1">
        <div className="flex items-center gap-3">
          <span className="font-medium text-gray-900">{link.name}</span>
          <span className={`px-2 py-1 text-xs rounded ${link.terminal ? "bg-blue-100 text-blue-700" : "bg-gray-200 text-gray-700"}`}>
            {link.terminal ? "TERMINAL" : "NORMAL"}
          </span>
        </div>
        {!link.terminal && (
          <a
            href={link.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-blue-600 hover:underline mt-1 block"
          >
            {link.url}
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
          className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
        >
          Editar
        </button>
        <button
          onClick={handleDelete}
          disabled={deleting}
          className="px-3 py-1 text-sm bg-red-100 text-red-700 rounded hover:bg-red-200 disabled:opacity-50"
        >
          {deleting ? "Deletando..." : "Deletar"}
        </button>
      </div>
    </div>
  );
}
