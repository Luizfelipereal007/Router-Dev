"use client";

import { Project } from "@/types";
import useSWR from "swr";

const fetcher = async (url: string) => {
  const res = await fetch(url);
  if (!res.ok) throw new Error("Falha ao carregar");
  return res.json();
};

export const PROJECTS_KEY = "/api/projects";

export function useProjects() {
  const swr = useSWR<Project[]>(PROJECTS_KEY, fetcher);
  return swr;
}

