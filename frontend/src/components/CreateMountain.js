import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createMountain } from '../services/api';
import './CreateMountain.css';

const emptyWord = () => ({ word: '', definition: '', synonyms: [], examples: [] });

function CreateMountain() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    totalDays: 34
  });
  const [groups, setGroups] = useState([
    { groupNumber: 1, words: [emptyWord()] }
  ]);
  const [loading, setLoading] = useState(false);
  const [toasts, setToasts] = useState([]);

  const addToast = (message, type = 'info') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3200);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      addToast('Please enter a mountain name', 'error');
      return;
    }

    setLoading(true);
    try {
      const groupsToSend = groups.map((g) => ({
        groupNumber: g.groupNumber,
        words: g.words
          .filter((w) => w.word.trim() && w.definition.trim())
          .map((w) => ({
            word: w.word.trim(),
            definition: w.definition.trim(),
            synonyms: Array.isArray(w.synonyms) ? w.synonyms : [],
            examples: Array.isArray(w.examples) ? w.examples : []
          }))
      })).filter((g) => g.words.length > 0);

      const response = await createMountain({
        ...formData,
        groups: groupsToSend.length ? groupsToSend : []
      });
      navigate(`/mountain/${response.data._id}`);
    } catch (error) {
      console.error('Error creating mountain:', error);
      addToast('Failed to create mountain. Please try again.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'totalDays' ? parseInt(value) || 1 : value
    }));
  };

  const updateWord = (groupIndex, wordIndex, field, value) => {
    setGroups((prev) => {
      const next = prev.map((g, i) => (i !== groupIndex ? g : { ...g, words: [...g.words] }));
      next[groupIndex].words[wordIndex] = { ...next[groupIndex].words[wordIndex], [field]: value };
      return next;
    });
  };

  const updateWordSynonyms = (groupIndex, wordIndex, text) => {
    const synonyms = text.split(',').map((s) => s.trim()).filter(Boolean);
    updateWord(groupIndex, wordIndex, 'synonyms', synonyms);
  };

  const updateWordExamples = (groupIndex, wordIndex, text) => {
    const examples = text.split(',').map((s) => s.trim()).filter(Boolean);
    updateWord(groupIndex, wordIndex, 'examples', examples);
  };

  const addWordToGroup = (groupIndex) => {
    setGroups((prev) => {
      const next = prev.map((g, i) => (i !== groupIndex ? g : { ...g, words: [...g.words, emptyWord()] }));
      return next;
    });
  };

  const removeWordFromGroup = (groupIndex, wordIndex) => {
    setGroups((prev) => {
      const next = prev.map((g, i) => {
        if (i !== groupIndex) return g;
        const words = g.words.filter((_, wi) => wi !== wordIndex);
        return { ...g, words: words.length ? words : [emptyWord()] };
      });
      return next;
    });
  };

  const addGroup = () => {
    setGroups((prev) => [
      ...prev,
      { groupNumber: prev.length + 1, words: [emptyWord()] }
    ]);
  };

  const removeGroup = (groupIndex) => {
    if (groups.length <= 1) return;
    setGroups((prev) => {
      const next = prev.filter((_, i) => i !== groupIndex);
      return next.map((g, i) => ({ ...g, groupNumber: i + 1 }));
    });
  };

  const totalWords = groups.reduce((sum, g) => sum + g.words.filter(w => w.word.trim()).length, 0);

  return (
    <div className="create-mountain-container">
      {/* Toast notifications */}
      <div className="toast-container">
        {toasts.map(t => (
          <div key={t.id} className={`toast toast-${t.type}`}>{t.message}</div>
        ))}
      </div>

      <div className="create-mountain-nav">
        <button type="button" className="back-nav-btn" onClick={() => navigate('/')}>
          ← Back to Mountains
        </button>
      </div>

      <div className="create-mountain-form">
        <div className="form-header">
          <h1>✨ Create New Mountain</h1>
          <p className="form-subtitle">Set up a new vocabulary mountain to conquer</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-grid">
            <div className="form-group form-group-wide">
              <label htmlFor="name">Mountain Name <span className="required">*</span></label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                placeholder="e.g., GRE Vocab Mountain"
              />
            </div>

            <div className="form-group form-group-wide">
              <label htmlFor="description">Description</label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows="2"
                placeholder="Optional description for this vocab mountain"
              />
            </div>

            <div className="form-group">
              <label htmlFor="totalDays">Total Days</label>
              <input
                type="number"
                id="totalDays"
                name="totalDays"
                value={formData.totalDays}
                onChange={handleChange}
                min="1"
                max="365"
                required
              />
            </div>
          </div>

          <div className="words-section-create">
            <div className="words-section-header">
              <div>
                <h2>📚 Words</h2>
                <p className="words-section-hint">
                  Add words now or later. Each group can have multiple words.
                  {totalWords > 0 && <span className="word-count-badge">{totalWords} word{totalWords !== 1 ? 's' : ''} added</span>}
                </p>
              </div>
            </div>

            {groups.map((group, groupIndex) => (
              <div key={groupIndex} className="group-block" style={{ animationDelay: `${groupIndex * 0.05}s` }}>
                <div className="group-block-header">
                  <h3>
                    <span className="group-number">#{group.groupNumber}</span>
                    Group {group.groupNumber}
                    <span className="word-count">{group.words.filter(w => w.word.trim()).length} words</span>
                  </h3>
                  {groups.length > 1 && (
                    <button
                      type="button"
                      className="remove-group-btn"
                      onClick={() => removeGroup(groupIndex)}
                    >
                      ✕ Remove
                    </button>
                  )}
                </div>

                {group.words.map((word, wordIndex) => (
                  <div key={wordIndex} className="word-row">
                    <div className="word-row-main">
                      <input
                        type="text"
                        placeholder="Word"
                        value={word.word}
                        onChange={(e) => updateWord(groupIndex, wordIndex, 'word', e.target.value)}
                        className="word-input"
                      />
                      <textarea
                        placeholder="Definition"
                        value={word.definition}
                        onChange={(e) => updateWord(groupIndex, wordIndex, 'definition', e.target.value)}
                        rows={2}
                        className="definition-input"
                      />
                    </div>
                    <div className="word-row-meta">
                      <input
                        type="text"
                        placeholder="Synonyms (comma-separated)"
                        value={Array.isArray(word.synonyms) ? word.synonyms.join(', ') : ''}
                        onChange={(e) => updateWordSynonyms(groupIndex, wordIndex, e.target.value)}
                        className="meta-input"
                      />
                      <input
                        type="text"
                        placeholder="Examples (comma-separated)"
                        value={Array.isArray(word.examples) ? word.examples.join(', ') : ''}
                        onChange={(e) => updateWordExamples(groupIndex, wordIndex, e.target.value)}
                        className="meta-input"
                      />
                    </div>
                    <div className="word-row-actions">
                      {group.words.length > 1 && (
                        <button
                          type="button"
                          className="remove-word-btn"
                          onClick={() => removeWordFromGroup(groupIndex, wordIndex)}
                          title="Remove word"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  </div>
                ))}

                <button
                  type="button"
                  className="add-word-to-group-btn"
                  onClick={() => addWordToGroup(groupIndex)}
                >
                  + Add word
                </button>
              </div>
            ))}

            <button type="button" className="add-group-btn" onClick={addGroup}>
              + Add another group
            </button>
          </div>

          <div className="form-actions">
            <button
              type="button"
              className="cancel-button"
              onClick={() => navigate('/')}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="submit-button"
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className="spinner spinner-sm"></span>
                  Creating...
                </>
              ) : (
                '🚀 Create Mountain'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default CreateMountain;
