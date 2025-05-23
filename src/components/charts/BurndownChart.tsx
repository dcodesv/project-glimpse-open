
import React, { useMemo } from 'react';
import { 
  ResponsiveContainer, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend 
} from 'recharts';
import { format, parseISO, eachDayOfInterval, isSameDay, isAfter } from 'date-fns';
import { es } from 'date-fns/locale';

interface BurndownChartProps {
  tasks: any[];
  startDate: string;
  endDate: string;
}

export const BurndownChart: React.FC<BurndownChartProps> = ({ tasks, startDate, endDate }) => {
  const data = useMemo(() => {
    if (!tasks?.length || !startDate || !endDate) {
      return [];
    }

    try {
      const start = parseISO(startDate);
      const end = parseISO(endDate);

      // Get all days in the interval
      const days = eachDayOfInterval({ start, end });

      // Calculate total story points
      const totalStoryPoints = tasks.reduce((sum, task) => {
        return sum + (task.storyPoints || 0);
      }, 0);

      // Initialize ideal burndown data
      const idealBurndown = totalStoryPoints;
      const dailyIdealBurn = totalStoryPoints / days.length;

      // Generate burndown data
      return days.map((day, index) => {
        // Ideal burndown decreases linearly
        const idealRemaining = Math.max(0, idealBurndown - (dailyIdealBurn * index));

        // Calculate actual remaining work based on completed tasks
        const actualRemaining = tasks.reduce((sum, task) => {
          // For tasks completed before or on this day, don't count their points
          if (task.percentDone === 100 && task.dueDate) {
            const dueDate = parseISO(task.dueDate);
            if (isSameDay(dueDate, day) || isAfter(day, dueDate)) {
              return sum;
            }
          }
          
          // For tasks in progress, count their remaining percentage
          if (task.percentDone > 0 && task.percentDone < 100) {
            return sum - ((task.storyPoints || 0) * (task.percentDone / 100));
          }
          
          // For tasks not started, count their full points
          return sum + (task.storyPoints || 0);
        }, 0);

        return {
          date: format(day, 'dd MMM', { locale: es }),
          ideal: Math.round(idealRemaining * 10) / 10,
          actual: Math.round(actualRemaining * 10) / 10,
        };
      });
    } catch (error) {
      console.error('Error generating burndown data:', error);
      return [];
    }
  }, [tasks, startDate, endDate]);

  if (!data.length) {
    return (
      <div className="flex items-center justify-center h-64 bg-muted/20 rounded-lg">
        <p className="text-muted-foreground">No hay datos suficientes para generar el gráfico</p>
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart
        data={data}
        margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
      >
        <CartesianGrid strokeDasharray="3 3" stroke="#888" opacity={0.2} />
        <XAxis 
          dataKey="date" 
          tick={{ fontSize: 12 }} 
          tickMargin={8}
          stroke="currentColor"
          opacity={0.7}
        />
        <YAxis 
          tick={{ fontSize: 12 }}
          tickMargin={8}
          stroke="currentColor"
          opacity={0.7}
          label={{ value: 'Story Points restantes', angle: -90, position: 'insideLeft', style: { textAnchor: 'middle' } }}
        />
        <Tooltip 
          contentStyle={{ 
            backgroundColor: 'var(--background)', 
            borderColor: 'var(--border)',
            borderRadius: '0.5rem' 
          }} 
        />
        <Legend />
        <Line 
          type="monotone" 
          dataKey="ideal" 
          stroke="#888" 
          strokeDasharray="5 5" 
          name="Ideal"
          dot={false}
        />
        <Line 
          type="monotone" 
          dataKey="actual" 
          stroke="#004099" 
          name="Real" 
          activeDot={{ r: 8 }}
          animationDuration={1500}
        />
      </LineChart>
    </ResponsiveContainer>
  );
};

export default BurndownChart;
