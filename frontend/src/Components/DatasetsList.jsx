import React, { useState, useEffect } from 'react';
import { Activity, BarChart3, Database, LogOut, Trash2, ArrowRight, FileText } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function DatasetsList() {
  const [datasets, setDatasets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const fetchDatasets = async () => {
    try {
      const response = await fetch('http://localhost:8000/api/datasets/', {
        credentials: 'include'
      });
      if (!response.ok) {
        throw new Error('Failed to fetch datasets');
      }
      const data = await response.json();
      setDatasets(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDatasets();
  }, []);

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this dataset?")) return;
    try {
      const response = await fetch(`http://localhost:8000/api/datasets/${id}/`, {
        method: 'DELETE',
        credentials: 'include'
      });
      if (!response.ok) throw new Error('Failed to delete');
      setDatasets(datasets.filter(ds => ds.id !== id));
    } catch (err) {
      alert(err.message);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch('http://localhost:8000/api/auth/logout/', {
        method: 'POST',
        credentials: 'include'
      });
    } catch (e) { }
    navigate('/login');
  };

  return (
    <div className="app-container">
      <aside className="sidebar animate-fade-in delay-1">
        <h1>
          <Activity size={28} />
          InsightFlow
        </h1>
        <p style={{ marginBottom: '2rem', fontSize: '0.875rem' }}>Full-Stack Analytics Platform</p>
        
        <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', flex: 1 }}>
          <div className="btn" style={{ justifyContent: 'flex-start', color: 'var(--text-secondary)', background: 'transparent', cursor: 'pointer' }} onClick={() => navigate('/dashboard')}>
            <BarChart3 size={20} />
            Dashboard
          </div>
          <div className="btn" style={{ justifyContent: 'flex-start', background: 'rgba(41, 84, 255, 0.1)', color: 'var(--accent-color)' }}>
            <Database size={20} />
            Datasets
          </div>
        </nav>
        
        <div style={{ marginTop: 'auto' }}>
            <button className="btn" style={{ width: '100%', justifyContent: 'flex-start', color: 'var(--error-color)', background: 'transparent' }} onClick={handleLogout}>
                <LogOut size={20} />
                Log out
            </button>
        </div>
      </aside>

      <main className="main-content">
        <header style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2 className="animate-fade-in">Historical Datasets</h2>
            <p className="animate-fade-in delay-1">View and manage your previously uploaded CSV files.</p>
          </div>
        </header>

        {error && (
          <div style={{ padding: '1rem', background: 'rgba(239, 68, 68, 0.1)', borderLeft: '4px solid var(--error-color)', color: 'var(--error-color)', marginBottom: '1.5rem', borderRadius: '4px' }}>
            {error}
          </div>
        )}

        <div className="dashboard-grid animate-fade-in delay-2" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {loading ? (
            <p>Loading datasets...</p>
          ) : datasets.length === 0 ? (
            <div className="card upload-zone">
              <Database className="upload-icon" />
              <h3>No datasets found</h3>
              <p>Go to the dashboard to upload your first CSV file.</p>
              <button className="btn btn-primary" style={{ marginTop: '1rem' }} onClick={() => navigate('/dashboard')}>Go to Dashboard</button>
            </div>
          ) : (
            datasets.map((ds) => (
              <div key={ds.id} className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.5rem' }}>
                <div>
                  <h3 style={{ marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <FileText size={18} color="var(--accent-color)" /> {ds.name}
                  </h3>
                  <div style={{ display: 'flex', gap: '1.5rem', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                    <span>Uploaded: {new Date(ds.uploaded_at).toLocaleDateString()}</span>
                    <span>Rows: {ds.rows_processed?.toLocaleString()}</span>
                    <span>Columns: {ds.total_columns}</span>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button 
                    className="btn" 
                    style={{ background: 'transparent', color: 'var(--error-color)', padding: '0.5rem' }}
                    onClick={() => handleDelete(ds.id)}
                    title="Delete dataset"
                  >
                    <Trash2 size={20} />
                  </button>
                  <button 
                    className="btn btn-primary" 
                    style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}
                    onClick={() => navigate('/dashboard', { state: { loadDatasetId: ds.id } })}
                  >
                    Analyze <ArrowRight size={16} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </main>
    </div>
  );
}
