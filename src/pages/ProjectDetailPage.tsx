
import React, { useState, useEffect, useMemo } from "react";
import { useParams, Link } from "react-router-dom";
import { 
  ArrowLeft, Calendar, Search, Filter, ExternalLink, 
  AlertTriangle, CheckCircle, Clock 
} from "lucide-react";
import { 
  getProjectById, 
  getProjectVersions, 
  getProjectWorkPackages 
} from "@/services/api";
import { formatDate } from "@/utils/dateUtils";
import { getTaskStatus, countTasksByStatus, getProjectRiskStatus, groupTasksByParent } from "@/utils/taskUtils";
import ProgressCircle from "@/components/ui/progress-circle";
import BurndownChart from "@/components/charts/BurndownChart";
import WorkloadBarChart from "@/components/charts/WorkloadBarChart";
import { toast } from "sonner";
import { calculateWorkloadByMember } from "@/utils/taskUtils";

const ProjectDetailPage: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const [project, setProject] = useState<any>(null);
  const [versions, setVersions] = useState<any[]>([]);
  const [selectedVersion, setSelectedVersion] = useState<any>(null);
  const [workPackages, setWorkPackages] = useState<any[]>([]);
  const [filteredWorkPackages, setFilteredWorkPackages] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [dateRange, setDateRange] = useState<{start: string | null; end: string | null}>({
    start: null,
    end: null
  });

  // Fetch project data
  useEffect(() => {
    const fetchProjectData = async () => {
      if (!projectId) return;
      
      try {
        setLoading(true);
        
        // Fetch project details
        const projectData = await getProjectById(projectId);
        setProject(projectData);
        
        // Fetch project versions (sprints)
        const versionsResponse = await getProjectVersions(projectId);
        const versionsList = versionsResponse._embedded?.elements || [];
        setVersions(versionsList);
        
        // Set active version as default selection
        const activeVersion = versionsList.find((v: any) => v.status === "open") || 
                             versionsList[0];
        setSelectedVersion(activeVersion);
        
        // Fetch work packages
        const workPackagesResponse = await getProjectWorkPackages(projectId);
        const workPackagesList = workPackagesResponse._embedded?.elements || [];
        setWorkPackages(workPackagesList);
        
        // Filter work packages by active version if available
        if (activeVersion) {
          const filtered = workPackagesList.filter((wp: any) => 
            wp.version?.id === activeVersion.id
          );
          setFilteredWorkPackages(filtered);
        } else {
          setFilteredWorkPackages(workPackagesList);
        }
      } catch (error) {
        console.error("Error fetching project data:", error);
        toast.error("Error al cargar los datos del proyecto");
      } finally {
        setLoading(false);
      }
    };

    fetchProjectData();
  }, [projectId]);

  // Handle version change
  const handleVersionChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const versionId = e.target.value;
    const selectedVer = versions.find(v => v.id.toString() === versionId);
    setSelectedVersion(selectedVer);
    
    // Filter work packages by selected version
    if (selectedVer) {
      const filtered = workPackages.filter(wp => 
        wp.version?.id === selectedVer.id
      );
      setFilteredWorkPackages(filtered);
    } else {
      setFilteredWorkPackages(workPackages);
    }
  };

  // Handle search and date filtering
  useEffect(() => {
    if (!selectedVersion) return;

    // Initial filtering by version
    let filtered = workPackages.filter(wp => 
      wp.version?.id === selectedVersion.id
    );

    // Filter by search term
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(wp => 
        wp.subject?.toLowerCase().includes(term) || 
        wp.description?.raw?.toLowerCase().includes(term) || 
        wp.assignee?.name?.toLowerCase().includes(term)
      );
    }

    // Filter by date range
    if (dateRange.start && dateRange.end) {
      const startDate = new Date(dateRange.start);
      const endDate = new Date(dateRange.end);
      
      filtered = filtered.filter(wp => {
        const wpStartDate = wp.startDate ? new Date(wp.startDate) : null;
        const wpDueDate = wp.dueDate ? new Date(wp.dueDate) : null;

        // Include tasks that overlap with the date range
        return (
          (wpStartDate && wpStartDate >= startDate && wpStartDate <= endDate) ||
          (wpDueDate && wpDueDate >= startDate && wpDueDate <= endDate) ||
          (wpStartDate && wpDueDate && wpStartDate <= startDate && wpDueDate >= endDate)
        );
      });
    }

    setFilteredWorkPackages(filtered);
  }, [selectedVersion, searchTerm, dateRange, workPackages]);

  // Calculate task summary
  const taskSummary = useMemo(() => {
    return countTasksByStatus(filteredWorkPackages);
  }, [filteredWorkPackages]);

  // Calculate project status
  const projectStatus = useMemo(() => {
    return getProjectRiskStatus(filteredWorkPackages);
  }, [filteredWorkPackages]);

  // Group tasks by user story
  const groupedTasks = useMemo(() => {
    return groupTasksByParent(filteredWorkPackages);
  }, [filteredWorkPackages]);

  // Calculate workload by team member
  const workloadData = useMemo(() => {
    return calculateWorkloadByMember(filteredWorkPackages);
  }, [filteredWorkPackages]);

  // Calculate progress
  const progress = useMemo(() => {
    if (!filteredWorkPackages.length) return 0;
    
    let completedPercentage = 0;
    filteredWorkPackages.forEach(wp => {
      completedPercentage += wp.percentDone || 0;
    });
    
    return Math.round(completedPercentage / filteredWorkPackages.length);
  }, [filteredWorkPackages]);

  if (loading && !project) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin h-10 w-10 border-4 border-primary-600 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-muted-foreground">Cargando detalles del proyecto...</p>
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="text-center p-12 bg-muted/20 rounded-lg">
        <p className="text-muted-foreground mb-4">Proyecto no encontrado</p>
        <Link to="/" className="text-primary-600 hover:underline">
          Volver a la lista de proyectos
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header with back button and project title */}
      <div className="flex items-center gap-4">
        <Link to="/" className="p-2 rounded-full bg-muted/50 hover:bg-muted">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <h1 className="text-2xl font-bold flex-1">{project.name}</h1>
        
        <a
          href={`http://openproject3/projects/${projectId}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-sm text-primary-600 hover:underline"
        >
          <ExternalLink className="h-4 w-4" />
          Ver en OpenProject
        </a>
      </div>

      {/* Sprint selector */}
      <div className="glass-card p-6">
        <div className="flex flex-col md:flex-row md:items-center gap-4 mb-6">
          <label htmlFor="version" className="text-sm font-medium">
            Sprint / Versión:
          </label>
          <select
            id="version"
            className="w-full md:w-auto flex-1 bg-background border border-input rounded-md px-3 py-2"
            value={selectedVersion?.id || ""}
            onChange={handleVersionChange}
          >
            {versions.length === 0 ? (
              <option value="">No hay versiones disponibles</option>
            ) : (
              versions.map((version: any) => (
                <option key={version.id} value={version.id}>
                  {version.name} {version.status === "open" ? "(activo)" : ""}
                </option>
              ))
            )}
          </select>
        </div>

        {/* Project summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Progress */}
          <div className="flex flex-col items-center justify-center p-6 bg-muted/20 rounded-lg">
            <ProgressCircle 
              progress={progress} 
              size={100} 
              strokeWidth={8}
              showText={true}
              textClassName="text-xl"
            />
            <h3 className="mt-4 text-lg font-medium">Progreso general</h3>
          </div>
          
          {/* Status */}
          <div className={`flex flex-col items-center justify-center p-6 bg-${projectStatus.color}/10 rounded-lg border border-${projectStatus.color}/30`}>
            <div className={`w-16 h-16 rounded-full bg-${projectStatus.color}/20 flex items-center justify-center mb-4`}>
              {projectStatus.status === "en_riesgo" ? (
                <AlertTriangle className={`h-8 w-8 text-${projectStatus.color}`} />
              ) : projectStatus.status === "en_tiempo" ? (
                <CheckCircle className={`h-8 w-8 text-${projectStatus.color}`} />
              ) : (
                <Clock className={`h-8 w-8 text-${projectStatus.color}`} />
              )}
            </div>
            <h3 className="text-lg font-medium">{projectStatus.message}</h3>
          </div>
          
          {/* Task summary */}
          <div className="flex flex-col justify-between p-6 bg-muted/20 rounded-lg">
            <h3 className="text-lg font-medium mb-4">Resumen de tareas</h3>
            
            <div className="space-y-2 text-sm">
              <div className="flex justify-between items-center">
                <span>Finalizadas:</span>
                <span className="font-medium text-success">{taskSummary.finalizadas}</span>
              </div>
              <div className="flex justify-between items-center">
                <span>En progreso:</span>
                <span className="font-medium text-info">{taskSummary.enProgreso}</span>
              </div>
              <div className="flex justify-between items-center">
                <span>Pendientes:</span>
                <span className="font-medium text-warning">{taskSummary.pendientes}</span>
              </div>
              <div className="flex justify-between items-center">
                <span>Retrasadas:</span>
                <span className="font-medium text-danger">{taskSummary.retrasadas}</span>
              </div>
              <div className="flex justify-between items-center pt-2 border-t">
                <span className="font-medium">Total:</span>
                <span className="font-medium">{taskSummary.total}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Burndown chart */}
      <div className="glass-card p-6">
        <h2 className="text-xl font-semibold mb-4">Diagrama de quemado</h2>
        <BurndownChart 
          tasks={filteredWorkPackages} 
          startDate={selectedVersion?.startDate || project.startDate} 
          endDate={selectedVersion?.endDate || project.endDate} 
        />
      </div>

      {/* Tasks list */}
      <div className="glass-card p-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
          <h2 className="text-xl font-semibold">Tareas</h2>
          
          <div className="flex flex-col md:flex-row gap-4 w-full md:w-auto">
            {/* Search box */}
            <div className="relative w-full md:w-64">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Buscar tarea o usuario..."
                className="pl-10 w-full bg-background border border-input rounded-md px-3 py-2"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            {/* Date filters */}
            <div className="flex flex-wrap gap-2 w-full md:w-auto">
              <div className="relative flex items-center">
                <Calendar className="absolute left-3 h-4 w-4 text-muted-foreground" />
                <input
                  type="date"
                  className="pl-10 bg-background border border-input rounded-md px-3 py-2"
                  value={dateRange.start || ""}
                  onChange={(e) => setDateRange({...dateRange, start: e.target.value})}
                />
              </div>
              <span className="self-center mx-1">-</span>
              <input
                type="date"
                className="bg-background border border-input rounded-md px-3 py-2"
                value={dateRange.end || ""}
                onChange={(e) => setDateRange({...dateRange, end: e.target.value})}
              />
              
              {/* Clear filters button */}
              {(searchTerm || dateRange.start || dateRange.end) && (
                <button
                  className="text-sm text-primary-600 hover:underline flex items-center"
                  onClick={() => {
                    setSearchTerm("");
                    setDateRange({start: null, end: null});
                  }}
                >
                  <Filter className="h-4 w-4 mr-1" />
                  Limpiar filtros
                </button>
              )}
            </div>
          </div>
        </div>

        {Object.keys(groupedTasks).length === 0 ? (
          <div className="text-center p-6 bg-muted/20 rounded-lg">
            <p className="text-muted-foreground">No hay tareas disponibles con los filtros actuales</p>
          </div>
        ) : (
          <div className="space-y-6">
            {Object.entries(groupedTasks).map(([parentId, tasks]) => {
              // Find parent task (user story) if it exists
              const parentTask = parentId !== "sin_historia" 
                ? workPackages.find(wp => wp.id.toString() === parentId)
                : null;

              return (
                <div key={parentId} className="space-y-3">
                  {/* User story header */}
                  {parentTask ? (
                    <div className="flex items-center gap-2 bg-muted/50 p-2 rounded-md">
                      <span className="text-sm font-medium">Historia de usuario:</span>
                      <span className="text-sm">{parentTask.subject}</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 bg-muted/50 p-2 rounded-md">
                      <span className="text-sm font-medium">Tareas sin historia de usuario</span>
                    </div>
                  )}

                  {/* Task list */}
                  <div className="space-y-2">
                    {(tasks as any[]).map(task => {
                      const status = getTaskStatus(task);
                      let statusColor;
                      let statusText;

                      switch(status) {
                        case "finalizada":
                          statusColor = "bg-success/20 text-success border-success/30";
                          statusText = "Finalizada";
                          break;
                        case "en_progreso":
                          statusColor = "bg-info/20 text-info border-info/30";
                          statusText = "En progreso";
                          break;
                        case "pendiente":
                          statusColor = "bg-warning/20 text-warning border-warning/30";
                          statusText = "Pendiente";
                          break;
                        case "retrasada":
                          statusColor = "bg-danger/20 text-danger border-danger/30";
                          statusText = "Retrasada";
                          break;
                      }

                      return (
                        <div 
                          key={task.id} 
                          className="p-4 bg-background border border-border rounded-lg flex flex-col md:flex-row gap-4"
                        >
                          <div className="flex-1 space-y-2">
                            <div className="flex items-start justify-between">
                              <h4 className="font-medium">{task.subject}</h4>
                              <span className={`text-xs px-2 py-1 rounded-full border ${statusColor}`}>
                                {statusText}
                              </span>
                            </div>
                            
                            <p className="text-sm text-muted-foreground">
                              {task.description?.raw || "Sin descripción"}
                            </p>
                            
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <span>{formatDate(task.startDate)} - {formatDate(task.dueDate)}</span>
                              <span className="bg-muted/50 px-2 py-1 rounded">
                                {task.estimatedTime || 0} horas estimadas
                              </span>
                            </div>
                          </div>
                          
                          <div className="flex flex-row md:flex-col items-center md:items-end justify-between md:justify-start gap-4">
                            <ProgressCircle progress={task.percentDone || 0} size={40} />
                            
                            <div className="text-right">
                              {task.assignee && (
                                <div className="text-xs text-muted-foreground mb-1">
                                  Asignada a:
                                </div>
                              )}
                              <div className="text-sm font-medium">
                                {task.assignee?.name || "Sin asignar"}
                              </div>
                            </div>
                            
                            <a
                              href={`http://openproject3/work_packages/${task.id}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs text-primary-600 hover:underline flex items-center"
                            >
                              <ExternalLink className="h-3 w-3 mr-1" />
                              Ver tarea
                            </a>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Team workload */}
      <div className="glass-card p-6">
        <h2 className="text-xl font-semibold mb-6">Carga laboral del equipo</h2>
        <WorkloadBarChart data={workloadData} />
      </div>
    </div>
  );
};

export default ProjectDetailPage;
