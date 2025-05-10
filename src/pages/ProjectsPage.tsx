
import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Calendar, User, Clock, ExternalLink } from "lucide-react";
import { AvatarGroup } from "@/components/ui/avatar-group";
import ProgressCircle from "@/components/ui/progress-circle";
import { getProjects, getProjectWorkPackages, calculateProjectProgress } from "@/services/api";
import { formatDate } from "@/utils/dateUtils";
import { toast } from "sonner";

const ProjectsPage: React.FC = () => {
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [projectData, setProjectData] = useState<Record<string, any>>({});

  // Fetch projects
  useEffect(() => {
    const fetchProjects = async () => {
      try {
        setLoading(true);
        const response = await getProjects();
        setProjects(response._embedded.elements || []);
      } catch (error) {
        console.error("Error fetching projects:", error);
        toast.error("Error al cargar los proyectos");
      } finally {
        setLoading(false);
      }
    };

    fetchProjects();
  }, []);

  // Fetch additional data for each project
  useEffect(() => {
    const fetchProjectData = async () => {
      try {
        const projectDataMap: Record<string, any> = {};
        
        for (const project of projects) {
          // Fetch work packages for progress calculation
          const workPackagesResponse = await getProjectWorkPackages(project.id);
          const workPackages = workPackagesResponse._embedded?.elements || [];
          
          // Calculate progress
          const progress = calculateProjectProgress(workPackages);
          
          // Extract team members (unique assignees)
          const teamMembers = Array.from(
            new Map(
              workPackages
                .filter(wp => wp.assignee)
                .map(wp => [wp.assignee.id, {
                  id: wp.assignee.id,
                  name: wp.assignee.name,
                  href: wp.assignee._links?.self?.href
                }])
            ).values()
          );
          
          // Calculate total estimated hours
          const totalHours = workPackages.reduce(
            (sum, wp) => sum + (wp.estimatedTime || 0), 
            0
          );

          projectDataMap[project.id] = {
            progress,
            teamMembers,
            workPackages,
            totalHours
          };
        }

        setProjectData(projectDataMap);
      } catch (error) {
        console.error("Error fetching project data:", error);
        toast.error("Error al cargar los datos de los proyectos");
      }
    };

    if (projects.length > 0) {
      fetchProjectData();
    }
  }, [projects]);

  if (loading && projects.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin h-10 w-10 border-4 border-primary-600 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-muted-foreground">Cargando proyectos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Proyectos</h1>
      </div>

      {projects.length === 0 ? (
        <div className="text-center p-12 bg-muted/20 rounded-lg">
          <p className="text-muted-foreground mb-4">No hay proyectos disponibles</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map(project => {
            const data = projectData[project.id] || {};
            const progress = data.progress || 0;
            const teamMembers = data.teamMembers || [];
            const totalHours = data.totalHours || 0;

            return (
              <Link
                to={`/projects/${project.id}`}
                key={project.id}
                className="glass-card p-6 card-hover"
              >
                <div className="flex items-start justify-between mb-4">
                  <h3 className="text-lg font-semibold line-clamp-2">{project.name}</h3>
                  <ProgressCircle progress={progress} size={50} />
                </div>

                <div className="text-sm text-muted-foreground line-clamp-3 mb-4">
                  {project.description?.raw || "Sin descripción"}
                </div>

                <div className="grid grid-cols-1 gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-primary-600" />
                    <span>
                      {formatDate(project.startDate)} - {formatDate(project.endDate)}
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-primary-600" />
                    <span>Total: {totalHours} horas estimadas</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-primary-600" />
                      <span>Equipo:</span>
                    </div>
                    <AvatarGroup users={teamMembers} size="sm" />
                  </div>

                  {/* External link to OpenProject */}
                  <div className="mt-2">
                    <a
                      href={`http://openproject3/projects/${project.id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center text-xs text-primary-600 hover:underline"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <ExternalLink className="h-3 w-3 mr-1" />
                      Ver en OpenProject
                    </a>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ProjectsPage;
