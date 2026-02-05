"use client";

import { UserProfile } from "@/types/user";
import { useEffect, useState } from "react";
import useSWR, { mutate } from "swr";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function ProfilePage() {
  const {
    data: profile,
    error,
    isLoading,
  } = useSWR<UserProfile>("/api/user/profile", fetcher);
  const [isSaving, setIsSaving] = useState(false);
  const [name, setName] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");

  // Initialize form when profile loads
  useEffect(() => {
    if (profile) {
      setName(profile.name || "");
      setAvatarUrl(profile.avatar_url || "");
    }
  }, [profile]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      const response = await fetch("/api/user/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, avatar_url: avatarUrl || null }),
      });

      if (response.ok) {
        mutate("/api/user/profile");
        alert("Perfil atualizado com sucesso!");
      } else {
        alert("Erro ao atualizar perfil");
      }
    } catch (error) {
      console.error("Error saving profile:", error);
      alert("Erro ao atualizar perfil");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-100">
        <div className="spinner" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-500">Erro ao carregar perfil</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="page-header">
        <h1 className="page-title">Perfil</h1>
        <p className="page-description">
          Gerencie suas informações pessoais e foto de perfil
        </p>
      </div>

      <div className="form-container">
        <form onSubmit={handleSave} className="space-y-6">
          {/* Avatar Preview */}
          <div className="flex items-center gap-6">
            <div className="w-24 h-24 rounded-full bg-indigo-600 flex items-center justify-center overflow-hidden border-4 border-slate-200 dark:border-slate-700">
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt="Avatar preview"
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-3xl font-bold text-white">
                  {name?.charAt(0)?.toUpperCase() || "U"}
                </span>
              )}
            </div>
            <div>
              <h3 className="text-lg font-medium text-slate-900 dark:text-slate-100">
                Foto de Perfil
              </h3>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Use uma URL de imagem para sua foto de perfil
              </p>
            </div>
          </div>

          {/* Name Field */}
          <div>
            <label htmlFor="name" className="label">
              Nome
            </label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Seu nome"
              className="input"
            />
          </div>

          {/* Avatar URL Field */}
          <div>
            <label htmlFor="avatarUrl" className="label">
              URL do Avatar
            </label>
            <input
              id="avatarUrl"
              type="url"
              value={avatarUrl}
              onChange={(e) => setAvatarUrl(e.target.value)}
              placeholder="https://exemplo.com/avatar.jpg"
              className="input"
            />
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Cole a URL de uma imagem para usar como foto de perfil
            </p>
          </div>

          {/* Save Button */}
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={isSaving}
              className="btn btn-primary"
            >
              {isSaving ? (
                <>
                  <svg
                    className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
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
              ) : (
                "Salvar"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
