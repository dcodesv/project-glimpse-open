
import { toast } from "sonner";

// OpenProject API key
const API_KEY = "b020d400703401a2746a40e959b97672170c1e37d4c92cbb3fdbd8d97b205161";
// Base URL for OpenProject API
const API_BASE_URL = "/api/v3"; // This will be used with the proxy

// Headers required for API calls
const headers = {
  "Content-Type": "application/json",
  Authorization: `Basic ${btoa(`apikey:${API_KEY}`)}`,
};

/**
 * Wrapper function to handle API requests
 */
async function fetchAPI(endpoint: string, options: RequestInit = {}) {
  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers: {
        ...headers,
        ...options.headers,
      },
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.status} ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error("API request failed:", error);
    toast.error(`Error al cargar datos: ${error instanceof Error ? error.message : "Desconocido"}`);
    throw error;
  }
}

/**
 * Get all projects
 */
export async function getProjects() {
  return fetchAPI("/projects");
}

/**
 * Get project details by ID
 */
export async function getProjectById(projectId: string | number) {
  return fetchAPI(`/projects/${projectId}`);
}

/**
 * Get project versions (sprints)
 */
export async function getProjectVersions(projectId: string | number) {
  return fetchAPI(`/projects/${projectId}/versions`);
}

/**
 * Get all work packages for a project
 */
export async function getProjectWorkPackages(projectId: string | number, filters?: Record<string, any>) {
  let queryParams = "";

  if (filters) {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        params.append(key, String(value));
      }
    });
    queryParams = `?${params.toString()}`;
  }

  return fetchAPI(`/projects/${projectId}/work_packages${queryParams}`);
}

/**
 * Get work package details
 */
export async function getWorkPackageById(workPackageId: string | number) {
  return fetchAPI(`/work_packages/${workPackageId}`);
}

/**
 * Get all users
 */
export async function getUsers() {
  return fetchAPI("/users");
}

/**
 * Get user details by ID
 */
export async function getUserById(userId: string | number) {
  return fetchAPI(`/users/${userId}`);
}

/**
 * Get work packages for all projects
 */
export async function getAllWorkPackages(filters?: Record<string, any>) {
  let queryParams = "";

  if (filters) {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        params.append(key, String(value));
      }
    });
    queryParams = `?${params.toString()}`;
  }

  return fetchAPI(`/work_packages${queryParams}`);
}

/**
 * Get work packages for a specific user
 */
export async function getUserWorkPackages(userId: string | number) {
  return fetchAPI(`/users/${userId}/work_packages`);
}

/**
 * Calculate project progress based on work packages
 */
export function calculateProjectProgress(workPackages: any[]) {
  if (!workPackages || workPackages.length === 0) {
    return 0;
  }

  const totalTasks = workPackages.length;
  let completedPercentage = 0;

  workPackages.forEach(wp => {
    const percentDone = wp.percentDone || 0;
    completedPercentage += percentDone;
  });

  return Math.round(completedPercentage / totalTasks);
}

/**
 * Check if a work package is delayed
 */
export function isWorkPackageDelayed(workPackage: any) {
  if (!workPackage.dueDate) return false;
  if (workPackage.percentDone === 100) return false;

  const today = new Date();
  const dueDate = new Date(workPackage.dueDate);
  return today > dueDate && workPackage.percentDone < 100;
}

/**
 * Get work package status
 */
export function getWorkPackageStatus(workPackage: any) {
  if (isWorkPackageDelayed(workPackage)) {
    return "retrasada";
  }
  
  if (workPackage.percentDone === 100) {
    return "finalizada";
  }
  
  if (workPackage.percentDone > 0) {
    return "en_progreso";
  }
  
  return "pendiente";
}

/**
 * Group work packages by user story
 */
export function groupWorkPackagesByUserStory(workPackages: any[]) {
  const grouped: Record<string, any[]> = {};

  workPackages.forEach(wp => {
    const parentId = wp.parent?.id || "sin_historia";
    if (!grouped[parentId]) {
      grouped[parentId] = [];
    }
    grouped[parentId].push(wp);
  });

  return grouped;
}

/**
 * Check project status based on progress
 */
export function checkProjectStatus(project: any, workPackages: any[]) {
  const progress = calculateProjectProgress(workPackages);
  
  if (!workPackages || workPackages.length === 0) {
    return {
      status: "sin_datos",
      message: "Sin datos suficientes",
      color: "info"
    };
  }

  // Count delayed tasks
  const delayedTasks = workPackages.filter(wp => isWorkPackageDelayed(wp)).length;
  const totalTasks = workPackages.length;
  const delayedPercentage = (delayedTasks / totalTasks) * 100;

  if (delayedPercentage > 20) {
    return {
      status: "riesgo",
      message: "Proyecto en riesgo",
      color: "danger"
    };
  } else if (delayedPercentage > 10 || progress < 50) {
    return {
      status: "atencion",
      message: "Requiere atención",
      color: "warning"
    };
  } else {
    return {
      status: "tiempo",
      message: "Proyecto en tiempo",
      color: "success"
    };
  }
}

export default {
  getProjects,
  getProjectById,
  getProjectVersions,
  getProjectWorkPackages,
  getWorkPackageById,
  getUsers,
  getUserById,
  getAllWorkPackages,
  getUserWorkPackages,
  calculateProjectProgress,
  isWorkPackageDelayed,
  getWorkPackageStatus,
  groupWorkPackagesByUserStory,
  checkProjectStatus,
};
