import {
  Bar,
  BarChart,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

export default function DashboardCharts({ stages, trends }) {
  return (
    <section className="charts">
      <div>
        <h3>Candidates by stage</h3>
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={stages}>
            <XAxis dataKey="stage" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="count" fill="#4f46e5" />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div>
        <h3>Applications over time</h3>
        <ResponsiveContainer width="100%" height={240}>
          <LineChart data={trends}>
            <XAxis dataKey="period" />
            <YAxis />
            <Tooltip />
            <Line type="monotone" dataKey="applications" stroke="#0f766e" />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}
