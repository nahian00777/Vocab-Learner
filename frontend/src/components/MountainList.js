import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { getMountains, deleteMountain } from '../services/api';
import './MountainList.css';

function MountainList() {
  const [mountains, setMountains] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toasts, setToasts] = useState([]);
  const navigate = useNavigate();

  const addToast = (message, type = 'info') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3200);
  };

  const fetchMountains = useCallback(async () => {
    try {
      const response = await getMountains();
      setMountains(response.data);
    } catch (error) {
      console.error('Error fetching mountains:', error);
      addToast('Failed to load mountains. Is the server running?', 'error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMountains();
  }, [fetchMountains]);

  const handleDelete = async (id, name, e) => {
    e.stopPropagation();
    if (window.confirm(`Delete "${name}"? This action cannot be undone.`)) {
      try {
        await deleteMountain(id);
        setMountains(prev => prev.filter(m => m._id !== id));
        addToast(`"${name}" deleted successfully`, 'success');
      } catch (error) {
        console.error('Error deleting mountain:', error);
        addToast('Failed to delete mountain', 'error');
      }
    }
  };

  const getTotalWords = (mountain) => {
    return mountain.groups.reduce((sum, g) => sum + g.words.length, 0);
  };

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="spinner"></div>
        <span>Loading your mountains...</span>
      </div>
    );
  }

  return (
    <div className="mountain-list-container">
      {/* Toast notifications */}
      <div className="toast-container">
        {toasts.map(t => (
          <div key={t.id} className={`toast toast-${t.type}`}>{t.message}</div>
        ))}
      </div>

      <div className="mountain-list-header">
        <div className="header-text">
          <h1>
            <span className="header-icon">⛰️</span>
            Vocab Mountains
          </h1>
          <p className="header-subtitle">Master vocabulary with spaced repetition</p>
        </div>
        <button 
          className="create-button"
          onClick={() => navigate('/create-mountain')}
        >
          <span className="btn-icon">+</span>
          Create Mountain
        </button>
      </div>

      {mountains.length > 0 && (
        <div className="stats-bar">
          <div className="stat-chip">
            <span className="stat-value">{mountains.length}</span>
            <span className="stat-label">{mountains.length === 1 ? 'Mountain' : 'Mountains'}</span>
          </div>
          <div className="stat-chip">
            <span className="stat-value">{mountains.reduce((s, m) => s + getTotalWords(m), 0)}</span>
            <span className="stat-label">Total Words</span>
          </div>
          <div className="stat-chip">
            <span className="stat-value">{mountains.reduce((s, m) => s + m.groups.length, 0)}</span>
            <span className="stat-label">Groups</span>
          </div>
        </div>
      )}

      <div className="mountains-grid">
        {mountains.length === 0 ? (
          <div className="no-mountains">
            <div className="empty-icon">⛰️</div>
            <h2>No mountains yet</h2>
            <p>Create your first vocab mountain to start learning!</p>
            <button className="create-button" onClick={() => navigate('/create-mountain')}>
              <span className="btn-icon">+</span>
              Create Your First Mountain
            </button>
          </div>
        ) : (
          mountains.map((mountain, idx) => (
            <div 
              key={mountain._id} 
              className="mountain-card"
              onClick={() => navigate(`/mountain/${mountain._id}`)}
              style={{ animationDelay: `${idx * 0.08}s` }}
            >
              <div className="card-glow"></div>
              <div className="mountain-card-header">
                <h2>{mountain.name}</h2>
                {mountain.isDefault && <span className="default-badge">Default</span>}
              </div>
              {mountain.description && (
                <p className="mountain-description">{mountain.description}</p>
              )}
              <div className="mountain-stats">
                <div className="stat-item">
                  <span className="stat-icon">📅</span>
                  <span>{mountain.totalDays} days</span>
                </div>
                <div className="stat-item">
                  <span className="stat-icon">📚</span>
                  <span>{mountain.groups.length} groups</span>
                </div>
                <div className="stat-item">
                  <span className="stat-icon">📝</span>
                  <span>{getTotalWords(mountain)} words</span>
                </div>
              </div>
              <div className="mountain-card-actions">
                <button className="open-button">
                  Open
                  <span className="arrow-icon">→</span>
                </button>
                {!mountain.isDefault && (
                  <button
                    className="delete-button"
                    onClick={(e) => handleDelete(mountain._id, mountain.name, e)}
                  >
                    Delete
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default MountainList;
