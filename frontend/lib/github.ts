export type GitHubRepo = {
  id: number;
  name: string;
  full_name: string;
  html_url: string;
  clone_url: string;
  default_branch: string;
  fork: boolean;
  parent?: {
    full_name: string;
    html_url: string;
    default_branch: string;
  };
  updated_at: string;
};

export type GitHubCommit = {
  sha: string;
  commit: {
    message: string;
    author: {
      date: string;
    };
  };
};

export type GitHubCompareResponse = {
  ahead_by: number;
  behind_by: number;
  status: "ahead" | "behind" | "identical" | "diverged";
};

export class GitHubService {
  private token: string;
  private baseUrl = "https://api.github.com";

  constructor(token: string) {
    this.token = token;
  }

  private async request<T>(endpoint: string): Promise<T> {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      headers: {
        Authorization: `token ${this.token}`,
        Accept: "application/vnd.github.v3+json",
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: response.statusText }));
      throw new Error(`GitHub API error: ${error.message || response.statusText}`);
    }

    return response.json();
  }

  async listRepositories(): Promise<GitHubRepo[]> {
    const repos: GitHubRepo[] = [];
    let page = 1;
    let hasMore = true;

    while (hasMore) {
      const response = await fetch(
        `${this.baseUrl}/user/repos?per_page=100&page=${page}&sort=updated`,
        {
          headers: {
            Authorization: `token ${this.token}`,
            Accept: "application/vnd.github.v3+json",
          },
        }
      );

      if (!response.ok) {
        const error = await response.json().catch(() => ({ message: response.statusText }));
        throw new Error(`GitHub API error: ${error.message || response.statusText}`);
      }

      const pageRepos: GitHubRepo[] = await response.json();
      repos.push(...pageRepos);

      hasMore = pageRepos.length === 100;
      page++;
    }

    return repos;
  }

  async getRepository(fullName: string): Promise<GitHubRepo> {
    return this.request<GitHubRepo>(`/repos/${fullName}`);
  }

  async getLastCommit(fullName: string, branch: string): Promise<GitHubCommit | null> {
    try {
      const commits = await this.request<GitHubCommit[]>(
        `/repos/${fullName}/commits?sha=${branch}&per_page=1`
      );
      return commits[0] || null;
    } catch (error) {
      return null;
    }
  }

  async compareBranches(
    repoFullName: string,
    base: string,
    head: string
  ): Promise<GitHubCompareResponse> {
    try {
      // GitHub API permite comparar branches de repositórios diferentes
      // usando o formato owner:branch no parâmetro head
      // base deve ser do repositório especificado em repoFullName
      const compare = await this.request<{
        ahead_by: number;
        behind_by: number;
        status: string;
      }>(`/repos/${repoFullName}/compare/${base}...${head}`);

      return {
        ahead_by: compare.ahead_by,
        behind_by: compare.behind_by,
        status: compare.status as "ahead" | "behind" | "identical" | "diverged",
      };
    } catch (error) {
      // Se não conseguir comparar, assume que está divergido
      return {
        ahead_by: 0,
        behind_by: 0,
        status: "diverged",
      };
    }
  }

  async syncFork(fullName: string, branch: string = "main"): Promise<void> {
    // GitHub não permite sincronizar forks diretamente via API sem usar merge
    // Vamos usar a API de merge para sincronizar
    const repo = await this.getRepository(fullName);
    
    if (!repo.fork || !repo.parent) {
      throw new Error("Repositório não é um fork");
    }

    // Buscar o último commit da branch principal do repositório original
    const parentCommit = await this.getLastCommit(repo.parent.full_name, repo.parent.default_branch);
    
    if (!parentCommit) {
      throw new Error("Não foi possível obter o último commit do repositório original");
    }

    // Criar uma branch de atualização e fazer merge
    // Nota: GitHub não permite merge direto via API sem criar uma PR ou branch
    // Por enquanto, vamos apenas retornar sucesso e deixar o usuário fazer manualmente
    // ou implementar via GitHub Actions/workflows
    throw new Error(
      "Sincronização automática de forks requer GitHub Actions ou merge manual. " +
      "Use a interface web do GitHub para sincronizar o fork."
    );
  }
}
