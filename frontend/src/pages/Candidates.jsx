import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/client';
import errorMessage from '../api/errorMessage';

const blank = {
  full_name: '',
  email: '',
  phone: '',
  skills: '',
  years_experience: 0,
  current_title: '',
  resume_url: '',
};

const initialQuery = {
  search: '',
  skills: '',
  min_experience: '',
  max_experience: '',
  sort_by: 'created_at',
  order: 'desc',
};

export default function Candidates() {
  const [items, setItems] = useState([]);
  const [meta, setMeta] = useState({ page: 1, page_size: 20, total: 0 });
  const [query, setQuery] = useState(initialQuery);
  const [form, setForm] = useState(null);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [loading, setLoading] = useState(true);
  const [reload, setReload] = useState(0);
  const [page, setPage] = useState(1);

  useEffect(() => {
    let active = true;
    const params = Object.fromEntries(
      Object.entries({ ...query, page }).filter(([, value]) => value !== ''),
    );

    setLoading(true);
    setError('');
    api.get('/candidates', { params })
      .then((response) => {
        if (!active) return;
        setItems(response.data.items);
        setMeta(response.data);
      })
      .catch((requestError) => {
        if (!active) return;
        setError(errorMessage(requestError, 'Could not load candidates.'));
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [
    query.search,
    query.skills,
    query.min_experience,
    query.max_experience,
    query.sort_by,
    query.order,
    page,
    reload,
  ]);

  const updateQuery = (update) => {
    setQuery((current) => ({ ...current, ...update }));
    setPage(1);
  };

  const save = async (event) => {
    event.preventDefault();
    try {
      const payload = {
        ...form,
        years_experience: Number(form.years_experience),
        resume_url: form.resume_url || null,
      };
      if (form.id) {
        await api.patch(`/candidates/${form.id}`, payload);
      } else {
        await api.post('/candidates', payload);
      }
      setForm(null);
      setNotice('Candidate saved.');
      setReload((value) => value + 1);
    } catch (requestError) {
      setError(errorMessage(requestError, 'Could not save candidate.'));
    }
  };

  const remove = async (candidate) => {
    if (!confirm(`Delete ${candidate.full_name} and all associated applications?`)) return;
    try {
      await api.delete(`/candidates/${candidate.id}`);
      setNotice('Candidate deleted.');
      setReload((value) => value + 1);
    } catch (requestError) {
      setError(errorMessage(requestError, 'Could not delete candidate.'));
    }
  };

  return (
    <>
      <div className="page-title">
        <h2>Candidates</h2>
        <button onClick={() => setForm({ ...blank })}>Add candidate</button>
      </div>
      {error && (
        <div className="error" role="alert">
          {error}{' '}
          {!loading && (
            <button className="secondary" onClick={() => setReload((value) => value + 1)}>
              Retry
            </button>
          )}
        </div>
      )}
      {notice && <p className="success">{notice}</p>}
      <div className="filters">
        <input
          placeholder="Search name or email"
          value={query.search}
          onChange={(event) => updateQuery({ search: event.target.value })}
        />
        <input
          placeholder="Skill"
          value={query.skills}
          onChange={(event) => updateQuery({ skills: event.target.value })}
        />
        <input
          type="number"
          min="0"
          placeholder="Min years"
          value={query.min_experience}
          onChange={(event) => updateQuery({ min_experience: event.target.value })}
        />
        <select
          value={`${query.sort_by}:${query.order}`}
          onChange={(event) => {
            const [sort_by, order] = event.target.value.split(':');
            updateQuery({ sort_by, order });
          }}
        >
          <option value="created_at:desc">Newest first</option>
          <option value="full_name:asc">Name A–Z</option>
          <option value="years_experience:desc">Most experience</option>
        </select>
        <button
          className="secondary"
          onClick={() => {
            setQuery(initialQuery);
            setPage(1);
          }}
        >
          Reset
        </button>
      </div>
      {form && (
        <form className="panel" onSubmit={save}>
          <h3>{form.id ? 'Edit candidate' : 'New candidate'}</h3>
          {[
            ['full_name', 'Full name'],
            ['email', 'Email'],
            ['phone', 'Phone'],
            ['skills', 'Skills'],
            ['years_experience', 'Years of experience'],
            ['current_title', 'Current title'],
            ['resume_url', 'Resume URL'],
          ].map(([key, label]) => (
            <label key={key}>
              {label}
              <input
                required={['full_name', 'email', 'phone'].includes(key)}
                min={key === 'years_experience' ? 0 : undefined}
                type={
                  key === 'email'
                    ? 'email'
                    : key === 'years_experience'
                      ? 'number'
                      : key === 'resume_url'
                        ? 'url'
                        : 'text'
                }
                value={form[key] ?? ''}
                onChange={(event) => setForm({ ...form, [key]: event.target.value })}
              />
            </label>
          ))}
          <button>Save candidate</button>
          <button type="button" className="secondary" onClick={() => setForm(null)}>
            Cancel
          </button>
        </form>
      )}
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Skills</th>
              <th>Experience</th>
              <th>Title</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {items.map((candidate) => (
              <tr key={candidate.id}>
                <td>
                  <Link to={`/candidates/${candidate.id}`}>{candidate.full_name}</Link>
                  <small>{candidate.email}</small>
                </td>
                <td>{candidate.skills}</td>
                <td>{candidate.years_experience} years</td>
                <td>{candidate.current_title}</td>
                <td>
                  <button className="secondary" onClick={() => setForm(candidate)}>Edit</button>{' '}
                  <button className="danger" onClick={() => remove(candidate)}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {loading ? (
        <p>Loading candidates…</p>
      ) : !error && !items.length ? (
        <p>No candidates match your filters.</p>
      ) : null}
      <div className="pagination">
        <button
          className="secondary"
          disabled={loading || meta.page <= 1}
          onClick={() => setPage(meta.page - 1)}
        >
          Previous
        </button>
        <span>Page {meta.page} · {meta.total} candidates</span>
        <button
          className="secondary"
          disabled={loading || meta.page * meta.page_size >= meta.total}
          onClick={() => setPage(meta.page + 1)}
        >
          Next
        </button>
      </div>
    </>
  );
}
