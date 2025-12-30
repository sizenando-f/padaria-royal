'use client';

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

interface DadosGrafico {
  name: string;
  value: number;
  [key: string]: any;
}

const COLORS: Record<string, string> = {
  'EXCELENTE': '#22c55e',
  'BOM': '#3b82f6',
  'REGULAR': '#eab308',
  'RUIM': '#ef4444',
};

export default function GraficoQualidade({ dados }: { dados: DadosGrafico[] }) {
  // Verificação de segurança
  if (!dados || dados.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-400 bg-gray-50 rounded-lg border border-dashed border-gray-200">
        Sem dados para exibir
      </div>
    );
  }

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={dados}
            dataKey="value" // O Backend manda "value"
            nameKey="name"  // O Backend manda "name"
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={80}
            paddingAngle={5}
          >
            {dados.map((entry, index) => (
              <Cell 
                key={`cell-${index}`} 
                fill={COLORS[entry.name] || '#94a3b8'} 
              />
            ))}
          </Pie>
          <Tooltip 
             contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
          />
          <Legend verticalAlign="bottom" height={36} iconType="circle" />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}