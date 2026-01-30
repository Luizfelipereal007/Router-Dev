"use client";

import LinkForm from "@/components/LinkForm";
import LinkItem from "@/components/LinkItem";
import { PROJECTS_KEY, useProjects } from "@/hooks/useProjects";
import { Link, Project } from "@/types";
import { useParams, useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { mutate } from "swr";

export default function ProjectPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = Number(params.id);
  const { data, isLoading } = useProjects();
  const projects = data ?? [];
  const [showLinkForm, setShowLinkForm] = useState(false);
  const [editingLink, setEditingLink] = useState<Link | null>(null);

  const project: Project | null = useMemo(() => {
    const found = projects.find((p) => p.id === projectId);
    return found ?? null;
  }, [projects, projectId]);

  const handleLinkCreated = () => {
    setShowLinkForm(false);
    mutate(PROJECTS_KEY);
  };

  const handleLinkUpdated = () => {
    setEditingLink(null);
    mutate(PROJECTS_KEY);
  };

  const handleLinkDeleted = () => {
    mutate(PROJECTS_KEY);
  };

  const handleEditLink = (link: Link) => {
    setEditingLink(link);
    setShowLinkForm(true);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-600">Carregando projeto...</p>
      </div>
    );
  }

  if (!project) {
    // Se não achou no cache, volta para home
    router.push("/");
    return null;
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">{project.name}</h1>
        <p className="text-sm text-gray-600">{project.path}</p>
      </div>

      <div className="mb-6">
        <button
          onClick={() => {
            setEditingLink(null);
            setShowLinkForm(true);
          }}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          + Cadastrar Link
        </button>
      </div>

      {showLinkForm && (
        <div className="mb-6">
          <LinkForm
            projectId={projectId}
            link={editingLink}
            onSuccess={editingLink ? handleLinkUpdated : handleLinkCreated}
            onCancel={() => {
              setShowLinkForm(false);
              setEditingLink(null);
            }}
          />
        </div>
      )}

      <div className="bg-white rounded-lg shadow">
        <div className="p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Links</h2>
          {project.links && project.links.length > 0 ? (
            <div className="space-y-3">
              {project.links.map((link) => (
                <LinkItem
                  key={link.id}
                  link={link}
                  onEdit={() => handleEditLink(link)}
                  onDelete={handleLinkDeleted}
                />
              ))}
            </div>
          ) : (
            <p className="text-gray-500">Nenhum link cadastrado ainda.</p>
          )}
        </div>
      </div>
    </div>
  );
}
