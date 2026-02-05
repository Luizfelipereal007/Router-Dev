"use client";

import { LinkedAccount, UserProfile } from "@/types/user";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import useSWR from "swr";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function Topbar() {
  const pathname = usePathname();
  const [isAvatarOpen, setIsAvatarOpen] = useState(false);
  const avatarRef = useRef<HTMLDivElement>(null);

  const {
    data: profile,
    error: profileError,
    isLoading: profileLoading,
    mutate: mutateProfile,
  } = useSWR<UserProfile>("/api/user/profile", fetcher);

  const {
    data: linkedAccounts,
    error: accountsError,
    isLoading: accountsLoading,
    mutate: mutateAccounts,
  } = useSWR<LinkedAccount[]>("/api/user/linked-accounts", fetcher);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        avatarRef.current &&
        !avatarRef.current.contains(event.target as Node)
      ) {
        setIsAvatarOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleUnlinkAccount = async (account: LinkedAccount) => {
    if (
      !confirm(
        `Tem certeza que deseja desvincular a conta ${account.provider_username} do ${account.provider}?`,
      )
    ) {
      return;
    }

    try {
      await fetch(
        `/api/user/linked-accounts?provider=${account.provider}&username=${account.provider_username}`,
        { method: "DELETE" },
      );
      mutateAccounts();
    } catch (error) {
      console.error("Error unlinking account:", error);
    }
  };

  const githubAccounts =
    linkedAccounts?.filter((a) => a.provider === "github") || [];
  const gitlabAccounts =
    linkedAccounts?.filter((a) => a.provider === "gitlab") || [];

  return (
    <header className="fixed top-0 right-0 left-64 h-19.25 bg-primary dark:bg-slate-900 border-b border-background dark:border-slate-800 z-40 px-6 flex items-center justify-between">
      {/* Left side - Page title or breadcrumb could go here */}
      <div className="flex-1" />

      {/* Right side - Settings and Profile */}
      <div className="flex items-center gap-4">
        {/* Settings Button */}
        <Link
          href="/settings"
          className={`p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors ${
            pathname === "/settings"
              ? "text-indigo-600 dark:text-indigo-400"
              : "text-slate-600 dark:text-slate-400"
          }`}
          title="Configurações"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
            />
          </svg>
        </Link>

        {/* Avatar Menu */}
        <div className="relative" ref={avatarRef}>
          <button
            onClick={() => setIsAvatarOpen(!isAvatarOpen)}
            className="flex items-center gap-2 p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center overflow-hidden">
              {profile?.avatar_url ? (
                <img
                  src={profile.avatar_url}
                  alt="Avatar"
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-sm font-medium text-white">
                  {profile?.name?.charAt(0)?.toUpperCase() || "U"}
                </span>
              )}
            </div>
            <svg
              className={`w-4 h-4 text-slate-500 transition-transform ${
                isAvatarOpen ? "rotate-180" : ""
              }`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </button>

          {/* Dropdown Menu */}
          {isAvatarOpen && (
            <div className="absolute right-0 top-full mt-2 w-80 bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 overflow-hidden animate-fade-in">
              {/* Linked Accounts Section */}
              <div className="p-4 border-b border-slate-200 dark:border-slate-700">
                <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
                  Contas Vinculadas
                </h3>

                {accountsLoading ? (
                  <div className="text-sm text-slate-500">Carregando...</div>
                ) : githubAccounts.length === 0 &&
                  gitlabAccounts.length === 0 ? (
                  <div className="text-sm text-slate-500 dark:text-slate-400">
                    Nenhuma conta vinculada
                  </div>
                ) : (
                  <div className="space-y-2">
                    {/* GitHub Accounts */}
                    {githubAccounts.map((account) => (
                      <div
                        key={account.id}
                        className="flex items-center gap-3 p-2 rounded-lg bg-slate-50 dark:bg-slate-700/50"
                      >
                        <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-600 overflow-hidden">
                          {account.provider_avatar_url ? (
                            <img
                              src={account.provider_avatar_url}
                              alt={account.provider_username}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <svg
                              className="w-5 h-5 text-slate-500 m-1.5"
                              viewBox="0 0 24 24"
                              fill="currentColor"
                            >
                              <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                            </svg>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-slate-900 dark:text-slate-100 truncate">
                            {account.provider_username}
                          </p>
                          <p className="text-xs text-slate-500">GitHub</p>
                        </div>
                        <button
                          onClick={() => handleUnlinkAccount(account)}
                          className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                          title="Desvincular conta"
                        >
                          <svg
                            className="w-4 h-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M6 18L18 6M6 6l12 12"
                            />
                          </svg>
                        </button>
                      </div>
                    ))}

                    {/* GitLab Accounts */}
                    {gitlabAccounts.map((account) => (
                      <div
                        key={account.id}
                        className="flex items-center gap-3 p-2 rounded-lg bg-slate-50 dark:bg-slate-700/50"
                      >
                        <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-600 overflow-hidden">
                          {account.provider_avatar_url ? (
                            <img
                              src={account.provider_avatar_url}
                              alt={account.provider_username}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <svg
                              className="w-5 h-5 text-orange-500 m-1.5"
                              viewBox="0 0 24 24"
                              fill="currentColor"
                            >
                              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
                            </svg>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-slate-900 dark:text-slate-100 truncate">
                            {account.provider_username}
                          </p>
                          <p className="text-xs text-slate-500">GitLab</p>
                        </div>
                        <button
                          onClick={() => handleUnlinkAccount(account)}
                          className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                          title="Desvincular conta"
                        >
                          <svg
                            className="w-4 h-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M6 18L18 6M6 6l12 12"
                            />
                          </svg>
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="p-3 bg-slate-50 dark:bg-slate-700/50">
                <Link
                  href="/profile"
                  className="flex items-center justify-center gap-2 w-full py-2 px-4 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium transition-colors"
                  onClick={() => setIsAvatarOpen(false)}
                >
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                    />
                  </svg>
                  Editar Perfil
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
