
import React from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  Cell
} from 'recharts';

interface WorkloadItem {
  name: string;
  totalTasks: number;
  pendingTasks: number;
  delayedTasks: number;
}

interface WorkloadBarChartProps {
  data: WorkloadItem[];
}

export const WorkloadBarChart: React.FC<WorkloadBarChartProps> = ({ data }) => {
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 bg-muted/20 rounded-lg">
        <p className="text-muted-foreground">No hay datos de carga laboral disponibles</p>
      </div>
    );
  }
  
  // Sort data by total tasks (highest first)
  const sortedData = [...data].sort((a, b) => b.totalTasks - a.totalTasks);
  
  // Custom tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="p-3 rounded-md shadow-md bg-background border border-border">
          <p className="font-medium">{label}</p>
          <p className="text-sm mt-1">
            <span className="inline-block w-3 h-3 rounded-full bg-primary-600 mr-2"></span>
            Total: {payload[0].value}
          </p>
          <p className="text-sm">
            <span className="inline-block w-3 h-3 rounded-full bg-warning mr-2"></span>
            Pendientes: {payload[1].value}
          </p>
          <p className="text-sm">
            <span className="inline-block w-3 h-3 rounded-full bg-danger mr-2"></span>
            Retrasadas: {payload[2].value}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <ResponsiveContainer width="100%" height={400}>
      <BarChart
        data={sortedData}
        margin={{ top: 20, right: 30, left: 20, bottom: 70 }}
        barSize={30}
      >
        <CartesianGrid strokeDasharray="3 3" stroke="#888" opacity={0.2} />
        <XAxis 
          dataKey="name"
          tick={{ 
            fontSize: 12,
            textAnchor: 'end',
            transform: 'rotate(-45)'
          }}
          height={60}
          stroke="currentColor"
          opacity={0.7}
        />
        <YAxis 
          tick={{ fontSize: 12 }}
          stroke="currentColor" 
          opacity={0.7}
          label={{ value: 'Número de tareas', angle: -90, position: 'insideLeft', style: { textAnchor: 'middle' } }}
        />
        <Tooltip content={<CustomTooltip />} />
        <Legend
          verticalAlign="top"
          wrapperStyle={{ paddingBottom: 10 }}
        />
        <Bar dataKey="totalTasks" name="Total de tareas" stackId="a" fill="#004099" />
        <Bar dataKey="pendingTasks" name="Tareas pendientes" stackId="b" fill="#FFA500" />
        <Bar dataKey="delayedTasks" name="Tareas retrasadas" stackId="c" fill="#F44336" />
      </BarChart>
    </ResponsiveContainer>
  );
};

export default WorkloadBarChart;
