"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const COLORS = ["#cbd5e1", "#94a3b8", "#64748b", "#e2e8f0", "#475569", "#334155"];

export function DashboardCharts({
  vendorContractor,
  companyStatus,
  projectStatus,
  monthlyRegistration,
  monthlyRevenue,
  paymentStatus,
}: {
  vendorContractor: { name: string; value: number }[];
  companyStatus: { name: string; value: number }[];
  projectStatus: { name: string; value: number }[];
  monthlyRegistration: { name: string; vendors: number; contractors?: number }[];
  monthlyRevenue: { name: string; revenue: number }[];
  paymentStatus: { name: string; value: number }[];
}) {
  return (
    <div className="grid gap-4 xl:grid-cols-2">
      <ChartCard title="Vendor">
        <PieBlock data={vendorContractor} />
      </ChartCard>
      <ChartCard title="Company status">
        <BarBlock data={companyStatus} />
      </ChartCard>
      <ChartCard title="Project status">
        <PieBlock data={projectStatus} />
      </ChartCard>
      <ChartCard title="Monthly registration">
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={monthlyRegistration}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" />
            <XAxis dataKey="name" stroke="#94a3b8" tick={{ fill: "#94a3b8", fontSize: 12 }} />
            <YAxis allowDecimals={false} stroke="#94a3b8" tick={{ fill: "#94a3b8", fontSize: 12 }} />
            <Tooltip contentStyle={{ background: "#151821", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12 }} />
            <Legend />
            <Bar dataKey="vendors" fill="#94a3b8" radius={6} />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>
      <ChartCard title="Monthly revenue">
        <ResponsiveContainer width="100%" height={240}>
          <LineChart data={monthlyRevenue}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" />
            <XAxis dataKey="name" stroke="#94a3b8" tick={{ fill: "#94a3b8", fontSize: 12 }} />
            <YAxis stroke="#94a3b8" tick={{ fill: "#94a3b8", fontSize: 12 }} />
            <Tooltip contentStyle={{ background: "#151821", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12 }} />
            <Line type="monotone" dataKey="revenue" stroke="#e2e8f0" strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </ChartCard>
      <ChartCard title="Payment status">
        <BarBlock data={paymentStatus} />
      </ChartCard>
    </div>
  );
}

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="glass-panel rounded-2xl p-5">
      <h3 className="mb-4 text-sm font-semibold text-foreground">{title}</h3>
      {children}
    </div>
  );
}

function PieBlock({ data }: { data: { name: string; value: number }[] }) {
  return (
    <ResponsiveContainer width="100%" height={240}>
      <PieChart>
        <Pie data={data} dataKey="value" nameKey="name" innerRadius={50} outerRadius={80}>
          {data.map((entry, index) => (
            <Cell key={entry.name} fill={COLORS[index % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip contentStyle={{ background: "#151821", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12 }} />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  );
}

function BarBlock({ data }: { data: { name: string; value: number }[] }) {
  return (
    <ResponsiveContainer width="100%" height={240}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" />
        <XAxis dataKey="name" stroke="#94a3b8" tick={{ fill: "#94a3b8", fontSize: 12 }} />
        <YAxis allowDecimals={false} stroke="#94a3b8" tick={{ fill: "#94a3b8", fontSize: 12 }} />
        <Tooltip contentStyle={{ background: "#151821", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12 }} />
        <Bar dataKey="value" fill="#94a3b8" radius={6} />
      </BarChart>
    </ResponsiveContainer>
  );
}
