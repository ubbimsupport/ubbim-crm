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

const COLORS = ["#3b6ea8", "#6b8fb3", "#94a3b8", "#cbd5e1", "#64748b", "#475569"];

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
    <div className="grid gap-3 xl:grid-cols-2">
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
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={monthlyRegistration}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis dataKey="name" stroke="#64748b" tick={{ fill: "#64748b", fontSize: 12 }} />
            <YAxis allowDecimals={false} stroke="#64748b" tick={{ fill: "#64748b", fontSize: 12 }} />
            <Tooltip contentStyle={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 4 }} />
            <Legend />
            <Bar dataKey="vendors" fill="#3b6ea8" radius={2} />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>
      <ChartCard title="Monthly revenue">
        <ResponsiveContainer width="100%" height={220}>
          <LineChart data={monthlyRevenue}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis dataKey="name" stroke="#64748b" tick={{ fill: "#64748b", fontSize: 12 }} />
            <YAxis stroke="#64748b" tick={{ fill: "#64748b", fontSize: 12 }} />
            <Tooltip contentStyle={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 4 }} />
            <Line type="monotone" dataKey="revenue" stroke="#3b6ea8" strokeWidth={2} dot={false} />
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
    <div className="rounded-md border bg-card p-4">
      <h3 className="mb-3 text-sm font-semibold">{title}</h3>
      {children}
    </div>
  );
}

function PieBlock({ data }: { data: { name: string; value: number }[] }) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <PieChart>
        <Pie data={data} dataKey="value" nameKey="name" innerRadius={46} outerRadius={72}>
          {data.map((entry, index) => (
            <Cell key={entry.name} fill={COLORS[index % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip contentStyle={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 4 }} />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  );
}

function BarBlock({ data }: { data: { name: string; value: number }[] }) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
        <XAxis dataKey="name" stroke="#64748b" tick={{ fill: "#64748b", fontSize: 12 }} />
        <YAxis allowDecimals={false} stroke="#64748b" tick={{ fill: "#64748b", fontSize: 12 }} />
        <Tooltip contentStyle={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 4 }} />
        <Bar dataKey="value" fill="#3b6ea8" radius={2} />
      </BarChart>
    </ResponsiveContainer>
  );
}
