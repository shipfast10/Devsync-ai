import React, { useEffect, useState } from 'react';
import api from '../api';

const Dashboard = () => {
  const [user, setUser] = useState(null);
  const [repos, setRepos] = useState([]);
  const [aiSummary, setAiSummary] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const meRes = await api.get('/api/me');
        setUser(meRes.data);

        const reposRes = await api.get('/auth/github/repos');
        setRepos(reposRes.data);

        const summaryRes = await api.get('/api/github/summary');
        setAiSummary(summaryRes.data.summary);
      } catch (err) {
        console.error(err);
      }
    };

    fetchData();
  }, []);

  if (!user) return <p>Loading...</p>;

  return (
    <div style={{ padding: '20px' }}>
      <h1>Welcome, {user.username}!</h1>
      <h2>GitHub Repos</h2>
      {repos.map((repo) => (
        <div key={repo.id} style={{ border: '1px solid #ccc', margin: '10px 0', padding: '10px' }}>
          <h3>{repo.name}</h3>
          <p>Language: {repo.language || 'N/A'}</p>
          <p>Open Issues: {repo.open_issues_count}</p>
          <p>Last 5 Commits:</p>
          <ul>
            {(repo.commits || []).map((c, i) => (
              <li key={i}>{c.commit?.message || c.message}</li>
            ))}
          </ul>
        </div>
      ))}

      <h2>AI Summary</h2>
      <p>{aiSummary}</p>
    </div>
  );
};

export default Dashboard;
