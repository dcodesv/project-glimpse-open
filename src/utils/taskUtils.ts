
import { isTaskDelayed, daysRemaining } from "./dateUtils";

export type TaskStatus = "pendiente" | "en_progreso" | "finalizada" | "retrasada";

export interface TaskCountSummary {
  total: number;
  pendientes: number;
  enProgreso: number;
  finalizadas: number;
  retrasadas: number;
}

/**
 * Calculate status of a task based on dates and completion
 */
export const getTaskStatus = (
  task: any
): TaskStatus => {
  const percentDone = task.percentDone || 0;
  const dueDate = task.dueDate;
  
  if (isTaskDelayed(dueDate, percentDone)) {
    return "retrasada";
  }
  
  if (percentDone === 100) {
    return "finalizada";
  }
  
  if (percentDone > 0) {
    return "en_progreso";
  }
  
  return "pendiente";
};

/**
 * Get color based on task status
 */
export const getStatusColor = (status: TaskStatus): string => {
  switch (status) {
    case "finalizada":
      return "success";
    case "en_progreso":
      return "info";
    case "pendiente":
      return "warning";
    case "retrasada":
      return "danger";
    default:
      return "muted";
  }
};

/**
 * Get display name for status
 */
export const getStatusDisplayName = (status: TaskStatus): string => {
  switch (status) {
    case "finalizada":
      return "Finalizada";
    case "en_progreso":
      return "En progreso";
    case "pendiente":
      return "Pendiente";
    case "retrasada":
      return "Retrasada";
    default:
      return "Desconocido";
  }
};

/**
 * Count tasks by status
 */
export const countTasksByStatus = (tasks: any[]): TaskCountSummary => {
  if (!tasks || !Array.isArray(tasks)) {
    return { total: 0, pendientes: 0, enProgreso: 0, finalizadas: 0, retrasadas: 0 };
  }

  const summary: TaskCountSummary = {
    total: tasks.length,
    pendientes: 0,
    enProgreso: 0,
    finalizadas: 0,
    retrasadas: 0,
  };

  tasks.forEach(task => {
    const status = getTaskStatus(task);
    
    switch (status) {
      case "pendiente":
        summary.pendientes++;
        break;
      case "en_progreso":
        summary.enProgreso++;
        break;
      case "finalizada":
        summary.finalizadas++;
        break;
      case "retrasada":
        summary.retrasadas++;
        break;
    }
  });

  return summary;
};

/**
 * Get project risk status based on task analysis
 */
export const getProjectRiskStatus = (tasks: any[]) => {
  if (!tasks || tasks.length === 0) {
    return {
      status: "sin_datos",
      message: "Sin datos suficientes",
      color: "muted"
    };
  }

  const summary = countTasksByStatus(tasks);
  const delayedPercentage = (summary.retrasadas / summary.total) * 100;
  const completedPercentage = (summary.finalizadas / summary.total) * 100;
  
  // Check if there's a significant percentage of delayed tasks
  if (delayedPercentage > 20) {
    return {
      status: "en_riesgo",
      message: "Proyecto en riesgo",
      color: "danger"
    };
  } 
  
  // Check if too many tasks are still pending or there are some delays
  if (delayedPercentage > 10 || completedPercentage < 30) {
    return {
      status: "requiere_atencion",
      message: "Requiere atención",
      color: "warning"
    };
  } 
  
  // Project appears to be on track
  return {
    status: "en_tiempo",
    message: "Proyecto en tiempo",
    color: "success"
  };
};

/**
 * Group tasks by parent (user story)
 */
export const groupTasksByParent = (tasks: any[]) => {
  if (!tasks || !Array.isArray(tasks)) {
    return {};
  }

  const grouped: Record<string, any[]> = {};
  
  tasks.forEach(task => {
    const parentId = task.parent?.id || "sin_historia";
    
    if (!grouped[parentId]) {
      grouped[parentId] = [];
    }
    
    grouped[parentId].push(task);
  });
  
  return grouped;
};

/**
 * Calculate workload by team member
 */
export const calculateWorkloadByMember = (tasks: any[]) => {
  if (!tasks || !Array.isArray(tasks)) {
    return [];
  }

  const workload: Record<string, { 
    userId: string | number,
    name: string,
    totalTasks: number,
    pendingTasks: number,
    delayedTasks: number 
  }> = {};

  tasks.forEach(task => {
    if (!task.assignee) return;
    
    const userId = task.assignee.id;
    const userName = task.assignee.name || `Usuario ${userId}`;
    const status = getTaskStatus(task);
    
    if (!workload[userId]) {
      workload[userId] = {
        userId,
        name: userName,
        totalTasks: 0,
        pendingTasks: 0,
        delayedTasks: 0
      };
    }
    
    workload[userId].totalTasks++;
    
    if (status === "pendiente" || status === "en_progreso") {
      workload[userId].pendingTasks++;
    }
    
    if (status === "retrasada") {
      workload[userId].delayedTasks++;
    }
  });

  return Object.values(workload).sort((a, b) => b.totalTasks - a.totalTasks);
};

export default {
  getTaskStatus,
  getStatusColor,
  getStatusDisplayName,
  countTasksByStatus,
  getProjectRiskStatus,
  groupTasksByParent,
  calculateWorkloadByMember
};
