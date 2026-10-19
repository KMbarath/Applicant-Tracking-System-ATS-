import { useEffect, useState } from 'react';
import api from '../api/client';
import errorMessage from '../api/errorMessage';

const stages = ['Applied', 'Screening', 'Interview', 'Offer', 'Hired', 'Rejected'];
const initialFilters = { candidate_search: '', job_title: '', skills: '' };

export default function Pipeline() {
  const [applications, setApplications] = useState([]);
  const [candidates, setCandidates] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [form, setForm] = useState(null);
  const [filters, setFilters] = useState(initialFilters);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
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
      api.get('/applications', { params }),
      api.get('/candidates', { params: { page_size: 100 } }),
      api.get('/jobs', { params: { status: 'open', page_size: 100 } }),
    ])
      .then(([applicationResponse, candidateResponse, jobResponse]) => {
        if (!active) return;
        if (
          !Array.isArray(applicationResponse.data.items) ||
          !Array.isArray(candidateResponse.data.items) ||
          !Array.isArray(jobResponse.data.items) ||
          !applicationResponse.data.items.every(
            (application) => application && typeof application === 'object',
          )
        ) {
          throw new Error('The API returned an unexpected pipeline response.');
        }
        setApplications(applicationResponse.data.items);
        setCandidates(candidateResponse.data.items);
        setJobs(jobResponse.data.items);
      })
      .catch((requestError) => {
        if (active) setError(errorMessage(requestError, 'Could not load the hiring pipeline.'));
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [filters.candidate_search, filters.job_title, filters.skills, reload]);

  const refresh = () => setReload((value) => value + 1);

  const move = async (application, stage) => {
    if (application.stage === stage) return;
    try {
      await api.patch(`/applications/${application.id}/stage`, { stage });
      setNotice('Stage updated.');
      refresh();
    } catch (requestError) {
      setError(errorMessage(requestError, 'Could not update the application stage.'));
    }
  };

  const create = async (event) => {
    event.preventDefault();
    try {
      await api.post('/applications', {
        candidate_id: Number(form.candidate_id),
        job_id: Number(form.job_id),
      });
      setForm(null);
      setNotice('Application created.');
      refresh();
    } catch (requestError) {
      setError(errorMessage(requestError, 'Could not create the application.'));
    }
  };

  return (
    <>
      <div className="page-title">
        <h2>Hiring pipeline</h2>
        <button onClick={() => setForm({ candidate_id: '', job_id: '' })}>
          New application
        </button>
      </div>
      {error && (
        <div className="error" role="alert">
          {error}{' '}
          {!loading && (
            <button className="secondary" onClick={refresh}>Retry</button>
          )}
        </div>
      )}
      {notice && <p className="success">{notice}</p>}
      <div className="filters">
        <input
          placeholder="Candidate name or email"
          value={filters.candidate_search}
          onChange={(event) => setFilters({ ...filters, candidate_search: event.target.value })}
        />
        <input
          placeholder="Job title"
          value={filters.job_title}
          onChange={(event) => setFilters({ ...filters, job_title: event.target.value })}
        />
        <input
          placeholder="Skill"
          value={filters.skills}
          onChange={(event) => setFilters({ ...filters, skills: event.target.value })}
        />
        <button className="secondary" onClick={() => setFilters(initialFilters)}>Reset</button>
      </div>
      {form && (
        <form className="panel" onSubmit={create}>
          <h3>Create application</h3>
          <label>
            Candidate
            <select
              required
              value={form.candidate_id}
              onChange={(event) => setForm({ ...form, candidate_id: event.target.value })}
            >
              <option value="">Select candidate</option>
              {candidates.map((candidate) => (
                <option key={candidate.id} value={candidate.id}>
                  {candidate.full_name} — {candidate.email}
                </option>
              ))}
            </select>
          </label>
          <label>
            Open job
            <select
              required
              value={form.job_id}
              onChange={(event) => setForm({ ...form, job_id: event.target.value })}
            >
              <option value="">Select job</option>
              {jobs.map((job) => <option key={job.id} value={job.id}>{job.title}</option>)}
            </select>
          </label>
          <button>Create application</button>
          <button type="button" className="secondary" onClick={() => setForm(null)}>
            Cancel
          </button>
        </form>
      )}
      {loading && <p>Loading hiring pipeline…</p>}
      {!loading && !error && applications.length === 0 && <p>No applications match your filters.</p>}
      <div className="kanban">
        {stages.map((stage) => {
          const stageApplications = applications.filter((application) => application.stage === stage);
          return (
            <section key={stage}>
              <h3>{stage} <small>{stageApplications.length}</small></h3>
              {stageApplications.map((application) => (
                <article className="application" key={application.id}>
                  <b>{application.candidate?.full_name || 'Unknown candidate'}</b>
                  <span>{application.job?.title || 'Unknown job'}</span>
                  <small>
                    {application.candidate?.skills || 'Skills not provided'}
                    {' · '}
                    {application.candidate?.years_experience ?? 0} years
                  </small>
                  <small>
                    Applied {application.applied_at
                      ? new Date(application.applied_at).toLocaleDateString()
                      : 'date unavailable'}
                  </small>
                  <select
                    aria-label={`Move ${application.candidate?.full_name || 'candidate'}`}
                    value={application.stage}
                    onChange={(event) => move(application, event.target.value)}
                  >
                    {stages.map((option) => <option key={option}>{option}</option>)}
                  </select>
                </article>
              ))}
            </section>
          );
        })}
      </div>
    </>
  );
}
