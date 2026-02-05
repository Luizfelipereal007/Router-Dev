export type GitLabRepo = {
  id: number;
  name: string;
  path_with_namespace: string;
  web_url: string;
  http_url_to_repo: string;
  default_branch: string;
  forked_from_project?: {
    path_with_namespace: string;
    web_url: string;
    default_branch: string;
  };
  last_activity_at: string;
};

export type GitLabCommit = {
  id: string;
  message: string;
  committed_date: string;
};

export type GitLabCompareResponse = {
  commits: Array<{ id: string }>;
  commits_behind: number;
  commits_ahead: number;
};

export class GitLabService {
  private token: string;
  private baseUrl: string;

  constructor(token: string, instanceUrl: string = "https://gitlab.com") {
    this.token = token;
    this.baseUrl = instanceUrl.replace(/\/$/, "");
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const response = await fetch(`${this.baseUrl}/api/v4${endpoint}`, {
      ...options,
      headers: {
        "PRIVATE-TOKEN": this.token,
        ...options.headers,
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: response.statusText }));
      throw new Error(`GitLab API error: ${error.message || response.statusText}`);
    }

    return response.json();
  }

  async listRepositories(): Promise<GitLabRepo[]> {
    const repos: GitLabRepo[] = [];
    let page = 1;
    let hasMore = true;

    while (hasMore) {
      const response = await fetch(
        `${this.baseUrl}/api/v4/projects?membership=true&per_page=100&page=${page}&order_by=last_activity_at&sort=desc`,
        {
          headers: {
            "PRIVATE-TOKEN": this.token,
          },
        }
      );

      if (!response.ok) {
        const error = await response.json().catch(() => ({ message: response.statusText }));
        throw new Error(`GitLab API error: ${error.message || response.statusText}`);
      }

      const pageRepos: GitLabRepo[] = await response.json();
      repos.push(...pageRepos);

      hasMore = pageRepos.length === 100;
      page++;
    }

    return repos;
  }

  async getRepository(projectId: string | number): Promise<GitLabRepo> {
    return this.request<GitLabRepo>(`/projects/${encodeURIComponent(projectId)}`);
  }

  async getLastCommit(projectId: string | number, branch: string): Promise<GitLabCommit | null> {
    try {
      const commits = await this.request<GitLabCommit[]>(
        `/projects/${encodeURIComponent(projectId)}/repository/commits?ref_name=${branch}&per_page=1`
      );
      return commits[0] || null;
    } catch (error) {
      return null;
    }
  }

  async compareBranches(
    projectId: string | number,
    from: string,
    to: string
  ): Promise<{ ahead_by: number; behind_by: number; status: "ahead" | "behind" | "identical" | "diverged" }> {
    try {
      const compare = await this.request<GitLabCompareResponse>(
        `/projects/${encodeURIComponent(projectId)}/repository/compare?from=${from}&to=${to}`
      );

      const ahead_by = compare.commits_ahead || 0;
      const behind_by = compare.commits_behind || 0;

      let status: "ahead" | "behind" | "identical" | "diverged" = "identical";
      if (ahead_by > 0 && behind_by > 0) {
        status = "diverged";
      } else if (ahead_by > 0) {
        status = "ahead";
      } else if (behind_by > 0) {
        status = "behind";
      }

      return { ahead_by, behind_by, status };
    } catch (error) {
      return {
        ahead_by: 0,
        behind_by: 0,
        status: "diverged",
      };
    }
  }

  async syncFork(projectId: string | number, branch: string = "main"): Promise<void> {
    const repo = await this.getRepository(projectId);

    if (!repo.forked_from_project) {
      throw new Error("Repositório não é um fork");
    }

    // GitLab permite criar merge requests via API
    // Vamos criar um MR do repositório original para o fork
    try {
      await this.request<{ id: number }>(`/projects/${encodeURIComponent(projectId)}/merge_requests`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          source_branch: repo.forked_from_project.default_branch,
          target_branch: branch,
          title: `Sync fork from ${repo.forked_from_project.path_with_namespace}`,
          description: "Sincronização automática do fork",
        }),
      });
    } catch (error: any) {
      // Se já existe um MR aberto, não é erro
      if (error.message?.includes("already exists")) {
        return;
      }
      throw error;
    }
  }
}
