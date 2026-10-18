import { lazy, Suspense, useEffect, useState } from 'react';
import api from '../api/client';
import errorMessage from '../api/errorMessage';

const DashboardCharts = lazy(() => import('./DashboardCharts'));

const initialFilters = { job_id: '', date_from: '', date_to: '' };

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [jobs, setJobs] = useState([]);
  const [filters, setFilters] = useState(initialFilters);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [reload, setReload] = useState(0);

  useEffect(() => {
    let active = true;
    const params = Object.fromEntries(
      Object.entries(filters).filter(([, value]) => value !== ''),
    );

    setLoading(true);
    setError('');

    Promise.all([
      api.get('/dashboard/summary', { params }),
      api.get('/dashboard/stage-distribution', { params }),
      api.get('/dashboard/application-trends', { params }),
      api.get('/dashboard/recent-activity'),
      api.get('/jobs', { params: { page_size: 100 } }),
    ])
      .then(([summary, stages, trends, activity, jobList]) => {
        if (!active) return;
        setData({
          summary: summary.data,
          stages: stages.data,
          trends: trends.data,
          activity: activity.data,
        });
        setJobs(jobList.data.items);
      })
      .catch((requestError) => {
        if (!active) return;
        setError(errorMessage(
          requestError,
          'Could not load dashboard. Check that the API server is running, then retry.',
        ));
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [filters.job_id, filters.date_from, filters.date_to, reload]);

  if (!data) {
    return (
      <section>
        <h2>Recruitment overview</h2>
        {error ? (
          <div className="error" role="alert">
            {error}{' '}
            <button className="secondary" onClick={() => setReload((value) => value + 1)}>
              Retry
            </button>
          </div>
        ) : (
          <p>{loading ? 'Loading dashboard…' : 'Dashboard data is unavailable.'}</p>
        )}
      </section>
    );
  }

  const summary = data.summary;

  return (
    <>
      <h2>Recruitment overview</h2>
      {error && (
        <div className="error" role="alert">
          {error}{' '}
          <button className="secondary" onClick={() => setReload((value) => value + 1)}>
            Retry
          </button>
        </div>
      )}
      <div className="filters">
        <select
          aria-label="Job filter"
          value={filters.job_id}
          onChange={(event) => setFilters({ ...filters, job_id: event.target.value })}
        >
          <option value="">All jobs</option>
          {jobs.map((job) => (
            <option key={job.id} value={job.id}>{job.title}</option>
          ))}
        </select>
        <input
          aria-label="Start date"
          type="date"
          value={filters.date_from}
          onChange={(event) => setFilters({ ...filters, date_from: event.target.value })}
        />
        <input
          aria-label="End date"
          type="date"
          value={filters.date_to}
          onChange={(event) => setFilters({ ...filters, date_to: event.target.value })}
        />
        <button className="secondary" onClick={() => setFilters(initialFilters)}>Reset</button>
      </div>
      <div className="metrics">
        {[
          ['Total candidates', summary.total_candidates],
          ['Active applications', summary.active_applications],
          ['In screening', summary.screening],
          ['Interviews', summary.interviews],
          ['Offers', summary.offers],
          ['Hired', summary.hired],
          ['Rejected', summary.rejected],
        ].map(([label, value]) => (
          <article key={label}>
            <span>{label}</span>
            <strong>{value}</strong>
          </article>
        ))}
      </div>
      <p>
        Hired conversion: <b>{summary.conversion_rate}%</b> of applications in the selected
        period or job.
      </p>
      <Suspense fallback={<p role="status">Loading charts…</p>}>
        <DashboardCharts stages={data.stages} trends={data.trends} />
      </Suspense>
      <section>
        <h3>Recent hiring activity</h3>
        {data.activity.length
          ? data.activity.map((item) => (
              <p key={item.id}>
                {item.candidate} moved to <b>{item.to_stage}</b> for {item.job}
              </p>
            ))
          : <p>No activity yet.</p>}
      </section>
    </>
  );
}
