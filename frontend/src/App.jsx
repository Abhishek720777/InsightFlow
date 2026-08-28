import React, { useState } from 'react';
import { Upload, BarChart3, Database, TrendingUp, Activity, CheckCircle2, FileText } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

function App() {
  const [file, setFile] = useState(null);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const mockData = [
    { name: 'Mon', uploads: 4, errors: 0 },
    { name: 'Tue', uploads: 7, errors: 1 },
    { name: 'Wed', uploads: 5, errors: 0 },
    { name: 'Thu', uploads: 12, errors: 2 },
    { name: 'Fri', uploads: 9, errors: 0 },
    { name: 'Sat', uploads: 3, errors: 0 },
    { name: 'Sun', uploads: 2, errors: 0 },
  ];

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileInput = (e) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handleFile = (selectedFile) => {
    if (!selectedFile.name.endsWith('.csv')) {
      setError('Please upload a valid CSV file.');
      return;
    }
    setError(null);
    setFile(selectedFile);
    // Simulate upload
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setData(mockData);
    }, 1500);
  };

  return (
    <div className="app-container">
      <aside className="sidebar animate-fade-in delay-1">
        <h1>
          <Activity size={28} />
          InsightFlow
        </h1>
        <p style={{ marginBottom: '2rem', fontSize: '0.875rem' }}>Full-Stack Analytics Platform</p>
        
        <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <div className="btn" style={{ justifyContent: 'flex-start', background: 'rgba(59, 130, 246, 0.1)', color: 'var(--accent-color)' }}>
            <BarChart3 size={20} />
            Dashboard
          </div>
          <div className="btn" style={{ justifyContent: 'flex-start', color: 'var(--text-secondary)', background: 'transparent' }}>
            <Database size={20} />
            Datasets
          </div>
        </nav>
      </aside>

      <main className="main-content">
        <header style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2 className="animate-fade-in">Data Analytics Overview</h2>
            <p className="animate-fade-in delay-1">Upload your CSV datasets to explore key statistics and trends.</p>
          </div>
          {data && (
            <div className="status status-success animate-fade-in">
              <CheckCircle2 size={16} /> Dataset Active
            </div>
          )}
        </header>

        {error && (
          <div style={{ padding: '1rem', background: 'rgba(239, 68, 68, 0.1)', borderLeft: '4px solid var(--error-color)', color: 'var(--error-color)', marginBottom: '1.5rem', borderRadius: '4px' }}>
            {error}
          </div>
        )}

        <div className="dashboard-grid animate-fade-in delay-2">
          {!data ? (
            <div 
              className="card upload-zone" 
              style={{ gridColumn: '1 / -1' }}
              onDragOver={handleDragOver}
              onDrop={handleDrop}
            >
              <Upload className="upload-icon" />
              <h3>Drag & Drop your CSV file here</h3>
              <p style={{ marginBottom: '1.5rem', marginTop: '0.5rem' }}>or click to browse from your computer</p>
              
              <input 
                type="file" 
                id="file-upload" 
                accept=".csv" 
                style={{ display: 'none' }}
                onChange={handleFileInput}
              />
              <label htmlFor="file-upload" className="btn btn-primary">
                Select CSV File
              </label>
              
              {loading && <p style={{ marginTop: '1rem', color: 'var(--accent-color)' }}>Processing dataset...</p>}
            </div>
          ) : (
            <>
              <div className="card stats-card">
                <div className="stats-icon"><FileText size={24} /></div>
                <div className="stats-info">
                  <h3>Rows Processed</h3>
                  <p>12,450</p>
                </div>
              </div>
              <div className="card stats-card">
                <div className="stats-icon"><Database size={24} /></div>
                <div className="stats-info">
                  <h3>Total Columns</h3>
                  <p>14</p>
                </div>
              </div>
              <div className="card stats-card">
                <div className="stats-icon"><TrendingUp size={24} /></div>
                <div className="stats-info">
                  <h3>Data Quality</h3>
                  <p>98.5%</p>
                </div>
              </div>
            </>
          )}
        </div>

        {data && (
          <div className="card chart-container animate-fade-in delay-3">
            <div className="card-header">
              <h3 className="card-title">Upload Trends Analysis</h3>
            </div>
            <ResponsiveContainer width="100%" height="85%">
              <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="name" stroke="#94a3b8" />
                <YAxis stroke="#94a3b8" />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#f8fafc' }}
                  itemStyle={{ color: '#f8fafc' }}
                />
                <Bar dataKey="uploads" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                <Bar dataKey="errors" fill="#ef4444" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
