export type UserProfile = {
  id: number;
  name: string;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
};

export type LinkedAccount = {
  id: number;
  user_id: number;
  provider: "github" | "gitlab";
  provider_username: string;
  provider_avatar_url: string | null;
  linked_at: string;
};

export type Project = {
  id: number;
  name: string;
  path: string;
  links?: Link[];
  git_provider?: "github" | "gitlab" | null;
  git_repo_id?: string | null;
  git_repo_full_name?: string | null;
  git_repo_url?: string | null;
  git_is_fork?: boolean | null;
  git_fork_of_full_name?: string | null;
  git_fork_of_url?: string | null;
  git_default_branch?: string | null;
  git_last_commit_sha?: string | null;
  git_last_commit_message?: string | null;
  git_last_commit_date?: string | null;
  git_ahead_count?: number | null;
  git_behind_count?: number | null;
  git_sync_status?: "synced" | "ahead" | "behind" | "diverged" | null;
};

export type Link = {
  id: number;
  project_id: number;
  name: string;
  url: string;
  terminal: boolean;
};
