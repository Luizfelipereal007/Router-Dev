export type Project = {
  id: number;
  name: string;
  path: string;
  links?: Link[];
};

export type Link = {
  id: number;
  project_id: number;
  name: string;
  url: string;
  terminal: boolean;
};
