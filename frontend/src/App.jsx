import React from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate } from 'react-router-dom';
import Home from './Components/Home';
import Login from './Components/Login';
import Register from './Components/Register';
import Dashboard from './Components/Dashboard';
import DatasetsList from './Components/DatasetsList';

// Wrapper component to pass navigation to Home (since it expects onGetStarted)
function HomeWrapper() {
  const navigate = useNavigate();
  return <Home onGetStarted={() => navigate('/login')} />;
}

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<HomeWrapper />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/datasets" element={<DatasetsList />} />
      </Routes>
    </Router>
  );
}

export default App;
