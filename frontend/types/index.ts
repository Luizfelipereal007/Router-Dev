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

export type GitRepository = {
  id: number;
  name: string;
  full_name?: string;
  path_with_namespace?: string;
  html_url?: string;
  web_url?: string;
  default_branch: string;
  fork?: boolean;
  forked_from_project?: {
    path_with_namespace: string;
    web_url: string;
    default_branch: string;
  };
  parent?: {
    full_name: string;
    html_url: string;
    default_branch: string;
  };
};
