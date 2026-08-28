import React, { useState, useEffect } from 'react';
import { Upload, BarChart3, Database, TrendingUp, Activity, CheckCircle2, FileText, LogOut, Settings2, Table } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useNavigate, useLocation } from 'react-router-dom';
import API_BASE from '../api';

function Dashboard() {
  const [file, setFile] = useState(null);
  const [datasetId, setDatasetId] = useState(null);
  const [data, setData] = useState(null);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [columnsMetadata, setColumnsMetadata] = useState(null);
  
  // Data Grid state
  const [gridData, setGridData] = useState(null);
  const [gridLoading, setGridLoading] = useState(false);
  
  const [xCol, setXCol] = useState('');
  const [yCol, setYCol] = useState('');
  const [aggFunc, setAggFunc] = useState('sum');
  
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // If navigated from DatasetsList with a dataset ID
    if (location.state?.loadDatasetId) {
      loadSavedDataset(location.state.loadDatasetId);
      // Clear state so it doesn't reload on every refresh
      window.history.replaceState({}, document.title);
    }
  }, [location]);

  const loadSavedDataset = async (id) => {
    setLoading(true);
    setGridLoading(true);
    setError(null);
    try {
      // First fetch the grid data (which now we will also use to get metadata)
      const response = await fetch(`${API_BASE}/api/datasets/${id}/data/`, {
        credentials: 'include'
      });
      if (!response.ok) throw new Error('Failed to load dataset data');
      const responseData = await response.json();
      
      setDatasetId(id);
      setGridData({ columns: responseData.columns, rows: responseData.rows });
      
      setStats({
        rows: responseData.total_rows,
        cols: responseData.columns.length,
        quality: 'N/A (Loaded from history)',
      });

      setColumnsMetadata(responseData.columns_metadata);

      // Auto-select first available columns
      const defaultX = responseData.columns_metadata?.categorical?.[0] || responseData.columns_metadata?.numeric?.[0] || '';
      const defaultY = responseData.columns_metadata?.numeric?.[0] || '';
      setXCol(defaultX);
      setYCol(defaultY);
      
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
      setGridLoading(false);
    }
  };

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

  const handleFile = async (selectedFile) => {
    if (!selectedFile.name.endsWith('.csv')) {
      setError('Please upload a valid CSV file.');
      return;
    }
    setError(null);
    setFile(selectedFile);
    setLoading(true);
    
    const formData = new FormData();
    formData.append('file', selectedFile);

    try {
      const response = await fetch(`${API_BASE}/api/upload/`, {
        method: 'POST',
        body: formData,
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error('Upload failed or Unauthorized — please log in first.');
      }
      
      const responseData = await response.json();
      setDatasetId(responseData.dataset_id);
      setColumnsMetadata(responseData.columns_metadata);
      setStats({
        rows: responseData.rows_processed,
        cols: responseData.total_columns,
        quality: responseData.data_quality,
      });
      
      // Auto-select first available columns
      const defaultX = responseData.columns_metadata?.categorical?.[0] || responseData.columns_metadata?.numeric?.[0] || '';
      const defaultY = responseData.columns_metadata?.numeric?.[0] || '';
      setXCol(defaultX);
      setYCol(defaultY);
      
      // Fetch data grid preview for new uploads
      loadGridData(responseData.dataset_id);
      
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const loadGridData = async (id) => {
    setGridLoading(true);
    try {
      const response = await fetch(`${API_BASE}/api/datasets/${id}/data/`, {
        credentials: 'include'
      });
      if (response.ok) {
        const responseData = await response.json();
        setGridData({ columns: responseData.columns, rows: responseData.rows });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setGridLoading(false);
    }
  };

  const fetchAnalysis = async () => {
    if (!datasetId || !xCol || !yCol) return;
    
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE}/api/analyze/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dataset_id: datasetId, x_col: xCol, y_col: yCol, agg_func: aggFunc }),
        credentials: 'include'
      });
      
      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || 'Analysis failed');
      }
      
      const responseData = await response.json();
      setData(responseData.chart_data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Automatically fetch analysis when controls change
  useEffect(() => {
    if (datasetId && xCol && yCol) {
      fetchAnalysis();
    }
  }, [datasetId, xCol, yCol, aggFunc]);

  const handleLogout = async () => {
    try {
      await fetch(`${API_BASE}/api/auth/logout/`, {
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
          <div className="btn" style={{ justifyContent: 'flex-start', background: 'rgba(41, 84, 255, 0.1)', color: 'var(--accent-color)' }}>
            <BarChart3 size={20} />
            Dashboard
          </div>
          <div className="btn" style={{ justifyContent: 'flex-start', color: 'var(--text-secondary)', background: 'transparent', cursor: 'pointer' }} onClick={() => navigate('/datasets')}>
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
            <h2 className="animate-fade-in">Data Analytics Overview</h2>
            <p className="animate-fade-in delay-1">Upload your CSV datasets to explore key statistics and trends.</p>
          </div>
          {datasetId && (
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
          {!datasetId ? (
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
                  <p>{stats?.rows?.toLocaleString() ?? '—'}</p>
                </div>
              </div>
              <div className="card stats-card">
                <div className="stats-icon"><Database size={24} /></div>
                <div className="stats-info">
                  <h3>Total Columns</h3>
                  <p>{stats?.cols ?? '—'}</p>
                </div>
              </div>
              <div className="card stats-card">
                <div className="stats-icon"><TrendingUp size={24} /></div>
                <div className="stats-info">
                  <h3>Data Quality</h3>
                  <p>{stats?.quality ?? '—'}</p>
                </div>
              </div>
            </>
          )}
        </div>

        {datasetId && columnsMetadata && (
          <div className="card chart-container animate-fade-in delay-3" style={{ marginTop: '1.5rem' }}>
            <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
              <h3 className="card-title">Dynamic Analysis</h3>
              <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                  <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>X-Axis (Group By)</label>
                  <select 
                    className="auth-input" 
                    style={{ padding: '0.5rem', width: '150px' }} 
                    value={xCol} 
                    onChange={e => setXCol(e.target.value)}
                  >
                    <optgroup label="Categorical">
                      {columnsMetadata.categorical?.map(col => <option key={col} value={col}>{col}</option>)}
                    </optgroup>
                    <optgroup label="Numeric">
                      {columnsMetadata.numeric?.map(col => <option key={col} value={col}>{col}</option>)}
                    </optgroup>
                  </select>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                  <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Y-Axis (Value)</label>
                  <select 
                    className="auth-input" 
                    style={{ padding: '0.5rem', width: '150px' }} 
                    value={yCol} 
                    onChange={e => setYCol(e.target.value)}
                  >
                    {columnsMetadata.numeric?.map(col => <option key={col} value={col}>{col}</option>)}
                  </select>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                  <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Aggregation</label>
                  <select 
                    className="auth-input" 
                    style={{ padding: '0.5rem', width: '120px' }} 
                    value={aggFunc} 
                    onChange={e => setAggFunc(e.target.value)}
                  >
                    <option value="sum">Sum</option>
                    <option value="mean">Average</option>
                    <option value="count">Count</option>
                  </select>
                </div>

              </div>
            </div>
            
            {loading && !data ? (
              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '300px', color: 'var(--text-secondary)' }}>
                Analyzing data...
              </div>
            ) : data && data.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7ee" />
                  <XAxis dataKey="name" stroke="#8b93a7" />
                  <YAxis stroke="#8b93a7" />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e5e7ee', color: '#12151a' }}
                    itemStyle={{ color: '#12151a' }}
                    formatter={(value) => [value, yCol]}
                  />
                  <Bar dataKey="value" fill="#2954ff" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '300px', color: 'var(--text-secondary)' }}>
                No valid data to display for this selection.
              </div>
            )}
          </div>
        )}

        {/* Data Grid Section */}
        {datasetId && (
          <div className="card animate-fade-in delay-3" style={{ marginTop: '1.5rem', overflow: 'hidden' }}>
            <div className="card-header">
              <h3 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Table size={20} /> Raw Data Preview (Top 100 rows)
              </h3>
            </div>
            {gridLoading ? (
               <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>Loading grid data...</div>
            ) : gridData?.rows && gridData.rows.length > 0 ? (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
                  <thead style={{ background: '#f8fafc', borderBottom: '1px solid #e5e7ee' }}>
                    <tr>
                      {gridData.columns.map(col => (
                        <th key={col} style={{ padding: '0.75rem 1rem', color: 'var(--text-secondary)', fontWeight: 600, whiteSpace: 'nowrap' }}>{col}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {gridData.rows.map((row, idx) => (
                      <tr key={idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                        {gridData.columns.map(col => (
                          <td key={col} style={{ padding: '0.75rem 1rem', color: '#12151a', whiteSpace: 'nowrap' }}>
                            {row[col] !== null ? String(row[col]) : <span style={{ color: '#cbd5e1' }}>null</span>}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
               <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>No raw data available</div>
            )}
          </div>
        )}

      </main>
    </div>
  );
}

export default Dashboard;
