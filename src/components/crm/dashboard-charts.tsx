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

const COLORS = ["#0B3A5B", "#C4A35A", "#2A9D8F", "#E76F51", "#6C7A89", "#264653"];

export function DashboardCharts({
  vendorContractor,
  companyStatus,
  projectStatus,
  monthlyRegistration,
  monthlyRevenue,
  documentExpiry,
  paymentStatus,
}: {
  vendorContractor: { name: string; value: number }[];
  companyStatus: { name: string; value: number }[];
  projectStatus: { name: string; value: number }[];
  monthlyRegistration: { name: string; vendors: number; contractors: number }[];
  monthlyRevenue: { name: string; revenue: number }[];
  documentExpiry: { name: string; value: number }[];
  paymentStatus: { name: string; value: number }[];
}) {
  return (
    <div className="grid gap-4 xl:grid-cols-2">
      <ChartCard title="Vendor vs Contractor">
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
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis allowDecimals={false} />
            <Tooltip />
            <Legend />
            <Bar dataKey="vendors" fill="#0B3A5B" />
            <Bar dataKey="contractors" fill="#C4A35A" />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>
      <ChartCard title="Monthly revenue">
        <ResponsiveContainer width="100%" height={240}>
          <LineChart data={monthlyRevenue}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Line type="monotone" dataKey="revenue" stroke="#0B3A5B" strokeWidth={2} />
          </LineChart>
        </ResponsiveContainer>
      </ChartCard>
      <ChartCard title="Document expiry">
        <PieBlock data={documentExpiry} />
      </ChartCard>
      <ChartCard title="Payment status">
        <BarBlock data={paymentStatus} />
      </ChartCard>
    </div>
  );
}

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border bg-card p-4 shadow-sm">
      <h3 className="mb-4 text-sm font-semibold text-primary">{title}</h3>
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
        <Tooltip />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  );
}

function BarBlock({ data }: { data: { name: string; value: number }[] }) {
  return (
    <ResponsiveContainer width="100%" height={240}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="name" />
        <YAxis allowDecimals={false} />
        <Tooltip />
        <Bar dataKey="value" fill="#0B3A5B" />
      </BarChart>
    </ResponsiveContainer>
  );
}
