"use client";

import GitRepositoryForm from "@/components/GitRepositoryForm";
import GitRepositoryInfo from "@/components/GitRepositoryInfo";
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
  const [showGitForm, setShowGitForm] = useState(false);
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

  const handleGitLinked = () => {
    setShowGitForm(false);
    mutate(PROJECTS_KEY);
  };

  const handleGitUnlinked = async () => {
    try {
      const response = await fetch(`/api/projects/${projectId}/git`, {
        method: "DELETE",
      });
      if (response.ok) {
        mutate(PROJECTS_KEY);
      }
    } catch (error) {
      console.error("Erro ao desvincular repositório:", error);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex items-center gap-3 text-slate-600">
          <svg className="animate-spin h-6 w-6" fill="none" viewBox="0 0 24 24">
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
          <span>Carregando projeto...</span>
        </div>
      </div>
    );
  }

  if (!project) {
    router.push("/");
    return null;
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="page-title">{project.name}</h1>
            <p className="page-description flex items-center gap-2 mt-2">
              <svg
                className="w-4 h-4 text-slate-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
                />
              </svg>
              {project.path}
            </p>
          </div>
          <button
            onClick={() => router.push("/")}
            className="btn btn-secondary"
          >
            <svg
              className="w-4 h-4 mr-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10 19l-7-7m0 0l7-7m-7 7h18"
              />
            </svg>
            Voltar
          </button>
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-wrap gap-3 mb-8">
        <button
          onClick={() => {
            setEditingLink(null);
            setShowLinkForm(true);
          }}
          className="btn btn-primary"
        >
          <svg
            className="w-4 h-4 mr-2"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
            />
          </svg>
          Cadastrar Link
        </button>
        {!project.git_provider && (
          <button
            onClick={() => setShowGitForm(true)}
            className="btn btn-secondary"
          >
            <svg
              className="w-4 h-4 mr-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"
              />
            </svg>
            Vincular Repositório Git
          </button>
        )}
      </div>

      {/* Git Repository Section */}
      {project.git_provider ? (
        <GitRepositoryInfo project={project} onUnlink={handleGitUnlinked} />
      ) : showGitForm ? (
        <div className="mb-8 animate-fade-in">
          <GitRepositoryForm
            project={project}
            onSuccess={handleGitLinked}
            onCancel={() => setShowGitForm(false)}
          />
        </div>
      ) : null}

      {/* Link Form */}
      {showLinkForm && (
        <div className="mb-8 animate-fade-in">
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

      {/* Links Section */}
      <div className="card">
        <div className="p-5 border-b border-slate-200">
          <h2 className="section-title">Links</h2>
        </div>
        <div className="p-5">
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
            <div className="empty-state py-8">
              <svg
                className="empty-state-icon"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
                />
              </svg>
              <h3 className="empty-state-title">Nenhum link cadastrado</h3>
              <p className="empty-state-description">
                Adicione links para facilitar o acesso aos ambientes do seu
                projeto.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
