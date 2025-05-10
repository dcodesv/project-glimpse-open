
import React, { useState, useEffect, useMemo } from "react";
import { Calendar as CalendarIcon, Filter, User } from "lucide-react";
import { format, parseISO, addDays, isSameDay } from "date-fns";
import { es } from "date-fns/locale";
import { Calendar } from "@/components/ui/calendar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ProgressCircle from "@/components/ui/progress-circle";
import WorkloadBarChart from "@/components/charts/WorkloadBarChart";
import { getAllWorkPackages, getUsers } from "@/services/api";
import { getTaskStatus } from "@/utils/taskUtils";
import { calculateWorkloadByMember } from "@/utils/taskUtils";
import { toast } from "sonner";

const CalendarPage: React.FC = () => {
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [dateRange, setDateRange] = useState<{from: Date | undefined; to: Date | undefined}>({
    from: undefined,
    to: undefined
  });
  const [selectedWeek, setSelectedWeek] = useState<{start: Date, end: Date}>(() => {
    const today = new Date();
    const start = new Date(today);
    start.setDate(today.getDate() - today.getDay() + (today.getDay() === 0 ? -6 : 1)); // Monday of current week
    const end = new Date(start);
    end.setDate(start.getDate() + 6); // Sunday of current week
    return { start, end };
  });
  const [workPackages, setWorkPackages] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<string>("calendar");
  
  // Fetch data
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch all work packages
        const workPackagesResponse = await getAllWorkPackages();
        const workPackagesList = workPackagesResponse._embedded?.elements || [];
        setWorkPackages(workPackagesList);
        
        // Fetch all users
        const usersResponse = await getUsers();
        const usersList = usersResponse._embedded?.elements || [];
        setUsers(usersList);
      } catch (error) {
        console.error("Error fetching data:", error);
        toast.error("Error al cargar los datos");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Filter tasks by date
  const tasksByDate = useMemo(() => {
    if (!date) return [];
    
    return workPackages.filter(wp => {
      const dueDate = wp.dueDate ? parseISO(wp.dueDate) : null;
      return dueDate && isSameDay(dueDate, date);
    });
  }, [workPackages, date]);

  // Filter tasks by date range
  const tasksByDateRange = useMemo(() => {
    if (!dateRange.from || !dateRange.to) return [];
    
    return workPackages.filter(wp => {
      const dueDate = wp.dueDate ? parseISO(wp.dueDate) : null;
      if (!dueDate) return false;
      
      return dueDate >= dateRange.from && dueDate <= dateRange.to;
    });
  }, [workPackages, dateRange]);

  // Group tasks by project
  const tasksGroupedByProject = useMemo(() => {
    const tasks = dateRange.from && dateRange.to ? tasksByDateRange : tasksByDate;
    
    const grouped: Record<string, any[]> = {};
    
    tasks.forEach(task => {
      const projectId = task.project?.id;
      const projectName = task.project?.name || "Sin proyecto";
      
      if (!projectId) return;
      
      if (!grouped[projectId]) {
        grouped[projectId] = {
          projectId,
          projectName,
          tasks: []
        };
      }
      
      grouped[projectId].tasks.push(task);
    });
    
    return Object.values(grouped);
  }, [tasksByDate, tasksByDateRange, dateRange]);

  // Calculate workload data for workload chart
  const workloadData = useMemo(() => {
    // Filter tasks that fall within the selected week
    const tasksInWeek = workPackages.filter(wp => {
      const dueDate = wp.dueDate ? parseISO(wp.dueDate) : null;
      if (!dueDate) return false;
      
      return dueDate >= selectedWeek.start && dueDate <= selectedWeek.end;
    });
    
    return calculateWorkloadByMember(tasksInWeek);
  }, [workPackages, selectedWeek]);

  // Handle week selection
  const handleWeekChange = (increment: number) => {
    setSelectedWeek(prev => {
      const newStart = new Date(prev.start);
      newStart.setDate(newStart.getDate() + (7 * increment));
      
      const newEnd = new Date(newStart);
      newEnd.setDate(newStart.getDate() + 6);
      
      return { start: newStart, end: newEnd };
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Calendario de tareas</h1>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="calendar">Calendario de entregas</TabsTrigger>
          <TabsTrigger value="workload">Carga laboral</TabsTrigger>
        </TabsList>

        {/* Calendar Tab */}
        <TabsContent value="calendar" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Calendar picker */}
            <div className="glass-card p-4 md:col-span-1">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-medium">Seleccionar fecha</h3>
                  {(date || dateRange.from) && (
                    <button
                      className="text-xs text-primary-600 hover:underline flex items-center"
                      onClick={() => {
                        setDate(undefined);
                        setDateRange({ from: undefined, to: undefined });
                      }}
                    >
                      <Filter className="h-3 w-3 mr-1" />
                      Limpiar
                    </button>
                  )}
                </div>

                <div className="flex flex-col space-y-2">
                  <div className="flex items-center space-x-2">
                    <input
                      type="radio"
                      id="single-date"
                      name="date-selection"
                      checked={!!date && !dateRange.from}
                      onChange={() => {
                        setDate(new Date());
                        setDateRange({ from: undefined, to: undefined });
                      }}
                      className="accent-primary-600"
                    />
                    <label htmlFor="single-date" className="text-sm">
                      Fecha específica
                    </label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <input
                      type="radio"
                      id="date-range"
                      name="date-selection"
                      checked={!!dateRange.from}
                      onChange={() => {
                        setDate(undefined);
                        const today = new Date();
                        setDateRange({
                          from: today,
                          to: addDays(today, 7)
                        });
                      }}
                      className="accent-primary-600"
                    />
                    <label htmlFor="date-range" className="text-sm">
                      Rango de fechas
                    </label>
                  </div>
                </div>

                <Calendar
                  mode={dateRange.from ? "range" : "single"}
                  selected={dateRange.from ? dateRange : date}
                  onSelect={dateRange.from ? setDateRange : setDate}
                  className="pointer-events-auto border rounded-md"
                  locale={es}
                />
                
                <div className="text-sm text-muted-foreground text-center">
                  {date && !dateRange.from && (
                    <span>Tareas para el {format(date, "PPP", { locale: es })}</span>
                  )}
                  {dateRange.from && dateRange.to && (
                    <span>
                      Tareas desde {format(dateRange.from, "PPP", { locale: es })} hasta{" "}
                      {format(dateRange.to, "PPP", { locale: es })}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Task list */}
            <div className="glass-card p-6 md:col-span-2 min-h-[500px]">
              <h3 className="font-medium mb-4">
                {tasksGroupedByProject.length > 0 
                  ? "Tareas programadas" 
                  : "No hay tareas para la fecha seleccionada"}
              </h3>

              {loading ? (
                <div className="flex items-center justify-center h-64">
                  <div className="animate-spin h-8 w-8 border-4 border-primary-600 border-t-transparent rounded-full"></div>
                </div>
              ) : (
                <div className="space-y-6">
                  {tasksGroupedByProject.length === 0 ? (
                    <div className="bg-muted/20 p-8 rounded-lg text-center">
                      <CalendarIcon className="h-12 w-12 mx-auto text-muted-foreground opacity-50 mb-4" />
                      <p className="text-muted-foreground">
                        {date || dateRange.from 
                          ? "No hay tareas programadas para la fecha seleccionada" 
                          : "Selecciona una fecha para ver las tareas"}
                      </p>
                    </div>
                  ) : (
                    tasksGroupedByProject.map((group: any) => (
                      <div key={group.projectId} className="space-y-3">
                        <div className="bg-muted/50 p-2 rounded-md">
                          <h4 className="font-medium">{group.projectName}</h4>
                        </div>
                        
                        <div className="space-y-3">
                          {group.tasks.map((task: any) => {
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
                                className="p-4 bg-background border border-border rounded-lg flex flex-col sm:flex-row gap-4"
                              >
                                <div className="flex-1 space-y-2">
                                  <div className="flex items-start justify-between">
                                    <h5 className="font-medium">{task.subject}</h5>
                                    <span className={`text-xs px-2 py-1 rounded-full border ${statusColor}`}>
                                      {statusText}
                                    </span>
                                  </div>
                                  
                                  <p className="text-sm text-muted-foreground">
                                    {task.description?.raw || "Sin descripción"}
                                  </p>
                                </div>
                                
                                <div className="flex flex-row sm:flex-col justify-between sm:justify-start items-center sm:items-end gap-3">
                                  <ProgressCircle 
                                    progress={task.percentDone || 0} 
                                    size={40}
                                    color={status === "retrasada" ? "danger" : "primary"} 
                                  />
                                  
                                  <div className="text-right">
                                    <div className="flex items-center justify-end gap-1 text-xs text-muted-foreground mb-1">
                                      <User className="h-3 w-3" />
                                      <span>Asignada a:</span>
                                    </div>
                                    <span className="text-sm font-medium">
                                      {task.assignee?.name || "Sin asignar"}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          </div>
        </TabsContent>

        {/* Workload Tab */}
        <TabsContent value="workload" className="space-y-6">
          <div className="glass-card p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-medium">Carga laboral semanal del equipo</h3>
              
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => handleWeekChange(-1)}
                  className="p-2 rounded-md hover:bg-muted"
                >
                  &lt;
                </button>
                
                <span className="text-sm">
                  {format(selectedWeek.start, "PP", { locale: es })} - {format(selectedWeek.end, "PP", { locale: es })}
                </span>
                
                <button
                  onClick={() => handleWeekChange(1)}
                  className="p-2 rounded-md hover:bg-muted"
                >
                  &gt;
                </button>
              </div>
            </div>
            
            <WorkloadBarChart data={workloadData} />
            
            <div className="mt-6 text-sm text-center text-muted-foreground">
              <p>Este gráfico muestra la distribución de tareas asignadas a cada miembro del equipo para la semana seleccionada.</p>
            </div>
          </div>
          
          <div className="glass-card p-6">
            <h3 className="font-medium mb-4">Recomendaciones para equilibrar la carga laboral</h3>
            
            {workloadData.length === 0 ? (
              <p className="text-muted-foreground">
                No hay datos suficientes para generar recomendaciones
              </p>
            ) : (
              <div className="space-y-4">
                {workloadData.length > 1 && (
                  <>
                    <p className="text-sm">
                      Basado en la distribución actual de tareas, considera las siguientes acciones:
                    </p>
                    
                    <ul className="list-disc pl-5 space-y-2 text-sm">
                      {(() => {
                        const sortedUsers = [...workloadData].sort((a, b) => b.totalTasks - a.totalTasks);
                        const mostBusy = sortedUsers[0];
                        const leastBusy = sortedUsers[sortedUsers.length - 1];
                        const average = sortedUsers.reduce((sum, user) => sum + user.totalTasks, 0) / sortedUsers.length;
                        
                        const recommendations = [];
                        
                        if (mostBusy && leastBusy && mostBusy.totalTasks > leastBusy.totalTasks + 3) {
                          recommendations.push(
                            <li key="redistribution">
                              Considera redistribuir algunas tareas de <strong>{mostBusy.name}</strong> ({mostBusy.totalTasks} tareas) a <strong>{leastBusy.name}</strong> ({leastBusy.totalTasks} tareas) para equilibrar la carga.
                            </li>
                          );
                        }
                        
                        const overloaded = sortedUsers.filter(u => u.totalTasks > average * 1.5);
                        if (overloaded.length) {
                          recommendations.push(
                            <li key="overloaded">
                              <strong>{overloaded.map(u => u.name).join(", ")}</strong> {overloaded.length === 1 ? "tiene" : "tienen"} una carga de trabajo significativamente superior al promedio del equipo ({Math.round(average)} tareas). Evalúa si es necesario ajustar la distribución.
                            </li>
                          );
                        }
                        
                        const withDelays = sortedUsers.filter(u => u.delayedTasks > 0);
                        if (withDelays.length) {
                          recommendations.push(
                            <li key="delayed">
                              <strong>{withDelays.map(u => u.name).join(", ")}</strong> {withDelays.length === 1 ? "tiene" : "tienen"} tareas retrasadas. Considera darles apoyo adicional o redistribuir algunas de sus tareas pendientes.
                            </li>
                          );
                        }
                        
                        if (recommendations.length === 0) {
                          recommendations.push(
                            <li key="balanced">
                              La carga laboral actual está relativamente equilibrada entre los miembros del equipo. No se detectan problemas significativos.
                            </li>
                          );
                        }
                        
                        return recommendations;
                      })()}
                    </ul>
                  </>
                )}
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default CalendarPage;
