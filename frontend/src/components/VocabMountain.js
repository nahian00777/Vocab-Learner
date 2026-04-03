import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  getMountain,
  getProgress,
  updateDay,
  updateWordStatus,
  resetWord,
  resetDay,
  resetAll,
  updateSettings,
  addWord,
  deleteWord
} from '../services/api';
import './VocabMountain.css';

function VocabMountain() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [mountain, setMountain] = useState(null);
  const [originalMountain, setOriginalMountain] = useState(null);
  const [progress, setProgress] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedWord, setSelectedWord] = useState(null);
  const [showDefinition, setShowDefinition] = useState(false);
  const [filter, setFilter] = useState('all');
  const [order, setOrder] = useState('default');
  const [shuffledMountain, setShuffledMountain] = useState(null);
  const [showAddWordForm, setShowAddWordForm] = useState(null);
  const [wordNote, setWordNote] = useState('');
  const [toasts, setToasts] = useState([]);
  const [showSettings, setShowSettings] = useState(false);
  const [vocabCheckActive, setVocabCheckActive] = useState(false);
  const [vocabCheckGroup, setVocabCheckGroup] = useState(null);
  const [vocabCheckWords, setVocabCheckWords] = useState([]);
  const [vocabCheckIndex, setVocabCheckIndex] = useState(0);
  const [vocabCheckRevealed, setVocabCheckRevealed] = useState(false);
  const [vocabCheckScore, setVocabCheckScore] = useState({ correct: 0, wrong: 0 });
  const [animatingWords, setAnimatingWords] = useState({}); // { word: true } for swipe animation
  const wordRefs = useRef({}); // refs for scrollIntoView on keyboard nav

  const addToast = useCallback((message, type = 'info') => {
    const tid = Date.now() + Math.random();
    setToasts(prev => [...prev, { id: tid, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== tid)), 3200);
  }, []);

  // Notes stored in localStorage
  const NOTES_KEY_PREFIX = 'vocab-mountain-notes';
  const getNoteKey = (mountainId, word) => `${NOTES_KEY_PREFIX}-${mountainId}-${word}`;

  const loadNoteForWord = useCallback((mountainId, word) => {
    if (!mountainId || !word) return '';
    try {
      return localStorage.getItem(getNoteKey(mountainId, word)) || '';
    } catch {
      return '';
    }
  }, []);

  const saveNoteForWord = useCallback((mountainId, word, note) => {
    if (!mountainId || !word) return;
    try {
      localStorage.setItem(getNoteKey(mountainId, word), note);
    } catch {}
  }, []);

  const getAllWordsFromMountain = useCallback((mt) => {
    if (!mt) return [];
    const words = [];
    mt.groups.forEach(group => {
      group.words.forEach(word => {
        words.push({ ...word, groupNumber: group.groupNumber });
      });
    });
    return words;
  }, []);

  // --- Notes Import/Export (CSV) ---
  const exportNotesCSV = useCallback(() => {
    if (!mountain || !id) return;
    const allWords = getAllWordsFromMountain(mountain);
    const rows = ['"Name","Notes"'];
    let count = 0;
    allWords.forEach(w => {
      const note = loadNoteForWord(id, w.word);
      if (note) {
        const escapedName = w.word.replace(/"/g, '""');
        const escapedNote = note.replace(/"/g, '""');
        rows.push(`"${escapedName}","${escapedNote}"`);
        count++;
      }
    });
    if (count === 0) {
      addToast('No notes to export.', 'info');
      return;
    }
    const csvContent = rows.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${mountain.name || 'mountain'}_notes.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    addToast(`Exported ${count} notes.`, 'success');
  }, [mountain, id, getAllWordsFromMountain, loadNoteForWord, addToast]);

  const importNotesCSV = useCallback((e) => {
    const file = e.target.files?.[0];
    if (!file || !id) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      const text = evt.target.result;
      const lines = text.split('\n');
      let imported = 0;
      let skipped = 0;
      // All words in this mountain (lowercase lookup)
      const allWords = getAllWordsFromMountain(mountain);
      const wordSet = new Set(allWords.map(w => w.word.toLowerCase()));

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;
        // Skip header
        if (i === 0 && line.toLowerCase().startsWith('"name"')) continue;

        // Parse CSV line: "value","value" — handle quoted fields with commas/newlines
        const match = line.match(/^"(.+?)"\s*,\s*"(.*)"$/s);
        if (match) {
          const name = match[1].replace(/""/g, '"').trim();
          const note = match[2].replace(/""/g, '"').trim();
          if (note && wordSet.has(name.toLowerCase())) {
            // Find the exact-cased word from the mountain
            const found = allWords.find(w => w.word.toLowerCase() === name.toLowerCase());
            if (found) {
              saveNoteForWord(id, found.word, note);
              imported++;
            }
          } else if (note) {
            // Word not in mountain — save with the CSV name anyway (user may have custom words)
            saveNoteForWord(id, name, note);
            imported++;
          } else {
            skipped++;
          }
        } else {
          // Try unquoted fallback: name,notes
          const commaIdx = line.indexOf(',');
          if (commaIdx > 0) {
            const name = line.substring(0, commaIdx).trim();
            const note = line.substring(commaIdx + 1).trim();
            if (note) {
              const found = allWords.find(w => w.word.toLowerCase() === name.toLowerCase());
              saveNoteForWord(id, found ? found.word : name, note);
              imported++;
            } else {
              skipped++;
            }
          }
        }
      }
      addToast(`Imported ${imported} notes${skipped > 0 ? ` (${skipped} skipped)` : ''}.`, 'success');
      // Refresh note if a word is currently selected
      if (selectedWord) {
        setWordNote(loadNoteForWord(id, selectedWord.word));
      }
    };
    reader.readAsText(file);
    // Reset the input so the same file can be re-imported
    e.target.value = '';
  }, [id, mountain, getAllWordsFromMountain, saveNoteForWord, loadNoteForWord, addToast, selectedWord]);

  useEffect(() => {
    if (selectedWord && id) {
      setWordNote(loadNoteForWord(id, selectedWord.word));
    } else {
      setWordNote('');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedWord?.word, id, loadNoteForWord]);

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const shuffleArray = useCallback((array) => {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }, []);

  const getWordStatusForSort = useCallback((word) => {
    if (!progress) return 'unknown';
    const status = progress.wordStatuses.find(ws => ws.word === word);
    return status ? status.status : 'unknown';
  }, [progress]);

  const getOrderedMountain = useCallback(() => {
    if (!mountain || !originalMountain) return mountain;

    switch (order) {
      case 'default':
        return JSON.parse(JSON.stringify(originalMountain));
      case 'shuffle-everything':
      case 'shuffle-within-groups':
        return shuffledMountain || mountain;
      case 'sort-by-color': {
        const orderedMountain = JSON.parse(JSON.stringify(mountain));
        const statusOrder = { known: 0, forgotten: 1, unknown: 2 };
        orderedMountain.groups.forEach(group => {
          group.words.sort((a, b) => {
            const statusA = getWordStatusForSort(a.word);
            const statusB = getWordStatusForSort(b.word);
            return statusOrder[statusA] - statusOrder[statusB];
          });
        });
        return orderedMountain;
      }
      case 'alphabetical': {
        const alphaMountain = JSON.parse(JSON.stringify(mountain));
        alphaMountain.groups.forEach(group => {
          group.words.sort((a, b) => a.word.localeCompare(b.word));
        });
        return alphaMountain;
      }
      default:
        return mountain;
    }
  }, [mountain, originalMountain, order, shuffledMountain, getWordStatusForSort]);

  // Use refs so shuffle doesn't re-trigger when mountain/progress data updates (e.g. word status change)
  const mountainRef = useRef(mountain);
  const originalMountainRef = useRef(originalMountain);
  useEffect(() => { mountainRef.current = mountain; }, [mountain]);
  useEffect(() => { originalMountainRef.current = originalMountain; }, [originalMountain]);

  useEffect(() => {
    const mt = mountainRef.current;
    const origMt = originalMountainRef.current;
    if (!mt || !origMt || !progress) return;
    if (order === 'shuffle-everything' || order === 'shuffle-within-groups') {
      const shuffled = JSON.parse(JSON.stringify(mt));
      const currentDay = progress.currentDay;
      if (order === 'shuffle-everything') {
        // Only collect words from groups visible on the current day
        const allWords = [];
        shuffled.groups.forEach(group => {
          if (group.groupNumber <= currentDay) {
            group.words.forEach(word => {
              allWords.push({ ...word, groupNumber: group.groupNumber });
            });
          }
        });
        const shuffledAll = shuffleArray(allWords);
        let wordIndex = 0;
        shuffled.groups.forEach(group => {
          if (group.groupNumber <= currentDay) {
            const groupWordCount = group.words.length;
            group.words = shuffledAll.slice(wordIndex, wordIndex + groupWordCount).map(w => {
              const { groupNumber, ...word } = w;
              return word;
            });
            wordIndex += groupWordCount;
          }
        });
      } else {
        // Shuffle within each visible group only
        shuffled.groups.forEach(group => {
          if (group.groupNumber <= currentDay) {
            group.words = shuffleArray(group.words);
          }
        });
      }
      setShuffledMountain(shuffled);
    } else {
      setShuffledMountain(null);
    }
    // Only re-shuffle when the order selection or day changes, NOT on every progress/mountain update
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [order, progress?.currentDay, shuffleArray]);

  const orderedMountain = useMemo(() => getOrderedMountain(), [getOrderedMountain]);

  // Compute the flat list of words actually visible on screen (day + filter)
  const visibleWords = useMemo(() => {
    if (!orderedMountain || !progress) return [];
    const words = [];
    orderedMountain.groups
      .filter(g => g.groupNumber <= progress.currentDay)
      .forEach(group => {
        const groupWords = filter === 'all' ? group.words : group.words.filter(w => {
          const s = progress.wordStatuses.find(ws => ws.word === w.word);
          const status = s ? s.status : 'unknown';
          if (filter === 'known') return status === 'known';
          if (filter === 'forgotten') return status === 'forgotten';
          if (filter === 'unknown') return status === 'unknown';
          return true;
        });
        groupWords.forEach(w => words.push({ ...w, groupNumber: group.groupNumber }));
      });
    return words;
  }, [orderedMountain, progress, filter]);

  /* Keyboard shortcuts */
  useEffect(() => {
    const handleKeyDown = (e) => {
      const inInput = ['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target?.tagName);
      if (inInput) return;

      // Vocab check keyboard handling
      if (vocabCheckActive) {
        if (e.key === ' ' || e.key === 'Enter') {
          e.preventDefault();
          if (!vocabCheckRevealed) {
            setVocabCheckRevealed(true);
          }
        }
        if (e.key === 'Escape') {
          setVocabCheckActive(false);
        }
        return;
      }

      // Use visibleWords (day + filter aware) for navigation
      const currentIndex = selectedWord
        ? visibleWords.findIndex(w => w.word === selectedWord.word)
        : -1;

      const scrollToWord = (word) => {
        setTimeout(() => {
          const el = wordRefs.current[word];
          if (el) el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }, 0);
      };

      switch (e.key) {
        case 'ArrowUp':
        case 'ArrowLeft':
          e.preventDefault();
          if (currentIndex > 0) {
            const prev = visibleWords[currentIndex - 1];
            setSelectedWord(prev);
            scrollToWord(prev.word);
          }
          if (progress?.settings.closeDefinitionOnNavigation) setShowDefinition(false);
          break;
        case 'ArrowDown':
        case 'ArrowRight':
          e.preventDefault();
          if (currentIndex >= 0 && currentIndex < visibleWords.length - 1) {
            const next = visibleWords[currentIndex + 1];
            setSelectedWord(next);
            scrollToWord(next.word);
          } else if (currentIndex === -1 && visibleWords.length > 0) {
            setSelectedWord(visibleWords[0]);
            scrollToWord(visibleWords[0].word);
          }
          if (progress?.settings.closeDefinitionOnNavigation) setShowDefinition(false);
          break;
        case 'd':
        case 'D':
          e.preventDefault();
          if (selectedWord) setShowDefinition(prev => !prev);
          break;
        case 'g':
        case 'G':
          e.preventDefault();
          if (selectedWord) handleWordStatus(selectedWord.word, 'known');
          break;
        case 'r':
        case 'R':
          e.preventDefault();
          if (selectedWord) handleWordStatus(selectedWord.word, 'forgotten');
          break;
        case 'w':
        case 'W':
          e.preventDefault();
          if (selectedWord) handleResetWord(selectedWord.word);
          break;
        case 's':
        case 'S':
          e.preventDefault();
          if (selectedWord) handleSpeak(selectedWord.word);
          break;
        case 'Escape':
          if (showDefinition) setShowDefinition(false);
          break;
        default:
          break;
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visibleWords, selectedWord, progress?.settings?.closeDefinitionOnNavigation, vocabCheckActive, vocabCheckRevealed]);

  const fetchData = async () => {
    try {
      const [mountainRes, progressRes] = await Promise.all([
        getMountain(id),
        getProgress(id)
      ]);
      const mountainData = mountainRes.data;
      setMountain(mountainData);
      setOriginalMountain(JSON.parse(JSON.stringify(mountainData)));
      setProgress(progressRes.data);
    } catch (error) {
      console.error('Error fetching data:', error);
      addToast('Failed to load data. Check your connection.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDayChange = async (newDay) => {
    try {
      await updateDay(id, newDay);
      const progressRes = await getProgress(id);
      setProgress(progressRes.data);
    } catch (error) {
      console.error('Error updating day:', error);
      addToast('Failed to update day', 'error');
    }
  };

  const triggerSwipeAnimation = useCallback((word) => {
    setAnimatingWords(prev => ({ ...prev, [word]: true }));
    setTimeout(() => {
      setAnimatingWords(prev => {
        const copy = { ...prev };
        delete copy[word];
        return copy;
      });
    }, 500);
  }, []);

  const handleWordStatus = async (word, status) => {
    try {
      triggerSwipeAnimation(word);
      await updateWordStatus(id, word, status, progress.currentDay);
      const progressRes = await getProgress(id);
      setProgress(progressRes.data);
      if (progress.settings.closeDefinitionOnNavigation) {
        setShowDefinition(false);
      }
    } catch (error) {
      console.error('Error updating word status:', error);
      addToast('Failed to update word status', 'error');
    }
  };

  const handleResetWord = async (word) => {
    try {
      triggerSwipeAnimation(word);
      await resetWord(id, word);
      const progressRes = await getProgress(id);
      setProgress(progressRes.data);
      addToast(`Reset "${word}"`, 'info');
    } catch (error) {
      console.error('Error resetting word:', error);
      addToast('Failed to reset word', 'error');
    }
  };

  const handleResetDay = async () => {
    if (window.confirm(`Reset all progress for Day ${progress.currentDay}?`)) {
      try {
        await resetDay(id, progress.currentDay);
        const progressRes = await getProgress(id);
        setProgress(progressRes.data);
        addToast(`Day ${progress.currentDay} progress reset`, 'success');
      } catch (error) {
        console.error('Error resetting day:', error);
        addToast('Failed to reset day', 'error');
      }
    }
  };

  const handleResetAll = async () => {
    if (window.confirm('Reset ALL progress? This cannot be undone.')) {
      try {
        await resetAll(id);
        const progressRes = await getProgress(id);
        setProgress(progressRes.data);
        addToast('All progress has been reset', 'success');
      } catch (error) {
        console.error('Error resetting all:', error);
        addToast('Failed to reset progress', 'error');
      }
    }
  };

  const handleSettingsChange = async (setting, value) => {
    try {
      await updateSettings(id, { [setting]: value });
      const progressRes = await getProgress(id);
      setProgress(progressRes.data);
    } catch (error) {
      console.error('Error updating settings:', error);
      addToast('Failed to update setting', 'error');
    }
  };

  const handleSpeak = (word) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(word);
      utterance.lang = 'en-US';
      window.speechSynthesis.speak(utterance);
    } else {
      addToast('Speech synthesis not supported in this browser', 'error');
    }
  };

  const navigateWord = (direction) => {
    const allWords = orderedMountain ? getAllWordsFromMountain(orderedMountain) : [];
    if (allWords.length === 0) return;

    const currentIndex = selectedWord
      ? allWords.findIndex(w => w.word === selectedWord.word)
      : -1;

    let newIndex;
    if (direction === 'next') {
      newIndex = currentIndex < allWords.length - 1 ? currentIndex + 1 : 0;
    } else {
      newIndex = currentIndex > 0 ? currentIndex - 1 : allWords.length - 1;
    }

    setSelectedWord(allWords[newIndex]);
    if (progress?.settings.closeDefinitionOnNavigation) {
      setShowDefinition(false);
    }
  };

  const getWordStatus = (word) => {
    if (!progress) return 'unknown';
    const status = progress.wordStatuses.find(ws => ws.word === word);
    return status ? status.status : 'unknown';
  };

  const handleAddWord = async (groupNumber, wordData) => {
    try {
      await addWord(id, groupNumber, wordData);
      const mountainRes = await getMountain(id);
      const mountainData = mountainRes.data;
      setMountain(mountainData);
      setOriginalMountain(JSON.parse(JSON.stringify(mountainData)));
      setShowAddWordForm(null);
      addToast(`"${wordData.word}" added to Group ${groupNumber}`, 'success');
    } catch (error) {
      console.error('Error adding word:', error);
      addToast('Failed to add word', 'error');
    }
  };

  const handleDeleteWord = async (groupNumber, wordIndex) => {
    if (window.confirm('Delete this word?')) {
      try {
        await deleteWord(id, groupNumber, wordIndex);
        const mountainRes = await getMountain(id);
        const mountainData = mountainRes.data;
        setMountain(mountainData);
        setOriginalMountain(JSON.parse(JSON.stringify(mountainData)));
        if (selectedWord && mountain.groups.find(g => g.groupNumber === groupNumber)?.words[wordIndex]?.word === selectedWord.word) {
          setSelectedWord(null);
          setShowDefinition(false);
        }
        addToast('Word deleted', 'success');
      } catch (error) {
        console.error('Error deleting word:', error);
        addToast('Failed to delete word', 'error');
      }
    }
  };

  // Vocab Check (quiz mode)
  const startVocabCheck = (groupNum) => {
    const group = (orderedMountain || mountain)?.groups.find(g => g.groupNumber === groupNum);
    if (!group || group.words.length === 0) {
      addToast('No words in this group to quiz', 'error');
      return;
    }
    const shuffled = shuffleArray([...group.words]);
    setVocabCheckGroup(groupNum);
    setVocabCheckWords(shuffled);
    setVocabCheckIndex(0);
    setVocabCheckRevealed(false);
    setVocabCheckScore({ correct: 0, wrong: 0 });
    setVocabCheckActive(true);
  };

  const vocabCheckAnswer = (knew) => {
    if (knew) {
      setVocabCheckScore(prev => ({ ...prev, correct: prev.correct + 1 }));
      handleWordStatus(vocabCheckWords[vocabCheckIndex].word, 'known');
    } else {
      setVocabCheckScore(prev => ({ ...prev, wrong: prev.wrong + 1 }));
      handleWordStatus(vocabCheckWords[vocabCheckIndex].word, 'forgotten');
    }
    // Next word
    if (vocabCheckIndex < vocabCheckWords.length - 1) {
      setVocabCheckIndex(prev => prev + 1);
      setVocabCheckRevealed(false);
    } else {
      // Quiz complete
      setVocabCheckActive(false);
      addToast(`Quiz complete! ${vocabCheckScore.correct + (knew ? 1 : 0)}/${vocabCheckWords.length} correct`, 'success');
    }
  };

  // Stats
  const getStats = () => {
    if (!progress || !mountain) return { known: 0, forgotten: 0, unknown: 0, total: 0 };
    const allWords = getAllWordsFromMountain(mountain);
    let known = 0, forgotten = 0;
    allWords.forEach(w => {
      const s = getWordStatus(w.word);
      if (s === 'known') known++;
      else if (s === 'forgotten') forgotten++;
    });
    return { known, forgotten, unknown: allWords.length - known - forgotten, total: allWords.length };
  };

  const handleRefresh = () => {
    setOrder('default');
    setShuffledMountain(null);
    fetchData();
    addToast('Refreshed!', 'info');
  };

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="spinner"></div>
        <span>Loading mountain...</span>
      </div>
    );
  }

  if (!mountain || !progress) {
    return (
      <div className="error-screen">
        <div className="error-icon">😕</div>
        <h2>Mountain not found</h2>
        <p>It may have been deleted or there's a connection issue.</p>
        <button className="back-button" onClick={() => navigate('/')}>Back to Mountains</button>
      </div>
    );
  }

  const stats = getStats();
  const progressPercent = stats.total > 0 ? Math.round((stats.known / stats.total) * 100) : 0;

  return (
    <div className="vocab-mountain" tabIndex={0}>
      {/* Toast notifications */}
      <div className="toast-container">
        {toasts.map(t => (
          <div key={t.id} className={`toast toast-${t.type}`}>{t.message}</div>
        ))}
      </div>

      {/* Header */}
      <div className="mountain-header">
        <div className="header-left">
          <button className="back-button" onClick={() => navigate('/')}>
            ← Back
          </button>
          <div>
            <h1>{mountain.name}</h1>
            {mountain.description && <p className="mountain-desc">{mountain.description}</p>}
          </div>
        </div>
        <div className="header-right">
          <div className="progress-ring-container">
            <svg className="progress-ring" viewBox="0 0 48 48">
              <circle className="progress-ring-bg" cx="24" cy="24" r="20" />
              <circle
                className="progress-ring-fill"
                cx="24" cy="24" r="20"
                strokeDasharray={`${progressPercent * 1.256} 125.6`}
              />
            </svg>
            <span className="progress-ring-text">{progressPercent}%</span>
          </div>
        </div>
      </div>

      {/* Stats bar */}
      <div className="stats-row">
        <div className="stat-pill known-pill">
          <span className="stat-dot known-dot"></span>
          {stats.known} Known
        </div>
        <div className="stat-pill forgotten-pill">
          <span className="stat-dot forgotten-dot"></span>
          {stats.forgotten} Forgotten
        </div>
        <div className="stat-pill unknown-pill">
          <span className="stat-dot unknown-dot"></span>
          {stats.unknown} Unknown
        </div>
        <div className="stat-pill total-pill">
          {stats.total} Total
        </div>
      </div>

      {/* Controls panel */}
      <div className="top-panel">
        <div className="controls-left">
          {/* Keyboard hints */}
          <div className="shortcut-hints">
            <div className="shortcut-chip definition-chip" title="Toggle Definition">
              <span className="chip-key">D</span>
              <span className="chip-label">Def</span>
            </div>
            <div className="shortcut-chip known-chip" title="Mark Known">
              <span className="chip-key">G</span>
              <span className="chip-label">Know</span>
            </div>
            <div className="shortcut-chip forgotten-chip" title="Mark Forgotten">
              <span className="chip-key">R</span>
              <span className="chip-label">Forgot</span>
            </div>
            <div className="shortcut-chip reset-chip" title="Reset Word">
              <span className="chip-key">W</span>
              <span className="chip-label">Reset</span>
            </div>
            <div className="shortcut-chip speak-chip" title="Speak Word">
              <span className="chip-key">S</span>
              <span className="chip-label">Speak</span>
            </div>
            <div className="shortcut-chip nav-chip" title="Navigate with arrows">
              <span className="chip-key">↑↓</span>
              <span className="chip-label">Nav</span>
            </div>
          </div>

          {/* Filter & Order */}
          <div className="filter-controls">
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="filter-select"
            >
              <option value="all">All Words</option>
              <option value="known">✓ Known</option>
              <option value="forgotten">✗ Forgotten</option>
              <option value="unknown">? Unknown</option>
            </select>
            <select
              value={order}
              onChange={(e) => setOrder(e.target.value)}
              className="order-select"
            >
              <option value="default">Default Order</option>
              <option value="shuffle-everything">Shuffle All</option>
              <option value="shuffle-within-groups">Shuffle Groups</option>
              <option value="sort-by-color">Sort by Status</option>
              <option value="alphabetical">A-Z</option>
            </select>
            <button type="button" className="refresh-btn" onClick={handleRefresh} title="Refresh">
              ↻
            </button>
          </div>
        </div>

        <div className="controls-right">
          <button
            type="button"
            className="settings-toggle-btn"
            onClick={() => setShowSettings(!showSettings)}
          >
            ⚙️ Settings
          </button>
        </div>
      </div>

      {/* Settings panel (collapsible) */}
      {showSettings && (
        <div className="settings-panel">
          <div className="settings-grid">
            <label className="setting-label">
              <input
                type="checkbox"
                checked={progress.settings.closeDefinitionOnNavigation}
                onChange={(e) => handleSettingsChange('closeDefinitionOnNavigation', e.target.checked)}
              />
              <span className="setting-text">Close definition on navigation</span>
            </label>
            <label className="setting-label">
              <input
                type="checkbox"
                checked={progress.settings.centerDefinition}
                onChange={(e) => handleSettingsChange('centerDefinition', e.target.checked)}
              />
              <span className="setting-text">Center definition modal</span>
            </label>
            <label className="setting-label">
              <input
                type="checkbox"
                checked={progress.settings.showPreviousDayColor}
                onChange={(e) => handleSettingsChange('showPreviousDayColor', e.target.checked)}
              />
              <span className="setting-text">Show previous day colors</span>
            </label>
          </div>
          <div className="settings-actions">
            <button onClick={handleResetDay} className="settings-action-btn reset-day-btn">
              Reset Day {progress.currentDay}
            </button>
            <button onClick={handleResetAll} className="settings-action-btn reset-all-btn">
              Reset Everything
            </button>
          </div>
          <div className="settings-notes-io">
            <span className="settings-section-label">📝 Notes</span>
            <div className="settings-actions">
              <input
                type="file"
                accept=".csv"
                id="import-notes-input"
                style={{ display: 'none' }}
                onChange={importNotesCSV}
              />
              <button
                onClick={() => document.getElementById('import-notes-input').click()}
                className="settings-action-btn import-btn"
              >
                📥 Import Notes
              </button>
              <button onClick={exportNotesCSV} className="settings-action-btn export-btn">
                📤 Export Notes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Info tips */}
      <div className="info-section">
        <div className="info-tip">
          💡 <strong>Tip:</strong> You don't need to memorize synonyms — they're just for reference and exposure.
        </div>
      </div>

      {/* Day navigation */}
      <div className="day-section">
        <div className="day-bar">
          <button
            type="button"
            onClick={() => handleDayChange(Math.max(1, progress.currentDay - 1))}
            className="day-nav-btn"
            disabled={progress.currentDay <= 1}
          >
            ‹
          </button>
          <div className="day-info">
            <span className="day-label">Day</span>
            <select
              value={progress.currentDay}
              onChange={(e) => handleDayChange(Math.max(1, Math.min(mountain.totalDays, Number(e.target.value) || 1)))}
              className="day-select"
            >
              {Array.from({ length: mountain.totalDays }, (_, i) => i + 1).map(d => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
            <span className="day-total">of {mountain.totalDays}</span>
          </div>
          <button
            type="button"
            onClick={() => handleDayChange(Math.min(mountain.totalDays, progress.currentDay + 1))}
            className="day-nav-btn"
            disabled={progress.currentDay >= mountain.totalDays}
          >
            ›
          </button>
        </div>
        <div className="day-progress-wrap">
          <div
            className="day-progress-fill"
            style={{ width: `${(progress.currentDay / mountain.totalDays) * 100}%` }}
          />
        </div>
      </div>

      {/* Word groups grid */}
      <div className="words-section groups-grid">
        {orderedMountain?.groups
          .filter((group) => group.groupNumber <= progress.currentDay)
          .map((group) => {
            const groupWords = filter === 'all' ? group.words : group.words.filter(w => {
              const s = getWordStatus(w.word);
              if (filter === 'known') return s === 'known';
              if (filter === 'forgotten') return s === 'forgotten';
              if (filter === 'unknown') return s === 'unknown';
              return true;
            });

            return (
              <div key={group.groupNumber} className="word-group-column">
                <div className="group-header">
                  <h3 className="group-title">Group {group.groupNumber}</h3>
                  <span className="group-word-count">{group.words.length}</span>
                </div>
                <div className="group-actions">
                  <button
                    type="button"
                    className="group-action-btn quiz-btn"
                    onClick={() => startVocabCheck(group.groupNumber)}
                  >
                    🎯 Quiz
                  </button>
                  {!mountain.isDefault && (
                    <button
                      type="button"
                      className="group-action-btn add-btn"
                      onClick={() => setShowAddWordForm(showAddWordForm === group.groupNumber ? null : group.groupNumber)}
                    >
                      {showAddWordForm === group.groupNumber ? '✕ Cancel' : '+ Add'}
                    </button>
                  )}
                </div>
                {showAddWordForm === group.groupNumber && (
                  <AddWordForm
                    groupNumber={group.groupNumber}
                    onAdd={(wordData) => handleAddWord(group.groupNumber, wordData)}
                  />
                )}
                <div className="word-list">
                  {groupWords.map((word, index) => {
                    const status = getWordStatus(word.word);
                    const isSelected = selectedWord?.word === word.word;
                    const synCount = (word.synonyms && word.synonyms.length) || 0;
                    // Find original index for deletion
                    const originalIndex = group.words.findIndex(w => w.word === word.word);
                    return (
                      <div
                        key={index}
                        ref={(el) => { wordRefs.current[word.word] = el; }}
                        role="button"
                        tabIndex={0}
                        className={`word-item status-${status} ${isSelected ? 'selected' : ''} ${animatingWords[word.word] ? 'status-animate' : ''}`}
                        onClick={() => {
                          setSelectedWord({ ...word, groupNumber: group.groupNumber });
                          if (!showDefinition) setShowDefinition(true);
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            setSelectedWord({ ...word, groupNumber: group.groupNumber });
                            if (!showDefinition) setShowDefinition(true);
                          }
                        }}
                      >
                        <span className="word-status-indicator"></span>
                        <span className="word-text">{word.word}{synCount ? ` (${synCount})` : ''}</span>
                        {!mountain.isDefault && (
                          <button
                            type="button"
                            className="delete-word-btn"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteWord(group.groupNumber, originalIndex >= 0 ? originalIndex : index);
                            }}
                            title="Delete word"
                          >
                            ×
                          </button>
                        )}
                      </div>
                    );
                  })}
                  {groupWords.length === 0 && (
                    <div className="no-words-msg">No words match filter</div>
                  )}
                </div>
              </div>
            );
        })}
      </div>

      {/* Definition modal */}
      {showDefinition && selectedWord && (
        <div
          className={`definition-overlay ${progress.settings.centerDefinition ? 'centered' : ''}`}
          role="dialog"
          aria-modal="true"
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowDefinition(false);
          }}
        >
          <div className="definition-panel" onClick={(e) => e.stopPropagation()}>
            <div className="def-header">
              <div className="def-title-row">
                <h2>{selectedWord.word}</h2>
                <div className="def-header-actions">
                  <button
                    type="button"
                    className="def-icon-btn"
                    onClick={() => handleSpeak(selectedWord.word)}
                    title="Speak (S)"
                  >
                    🔊
                  </button>
                  <button
                    type="button"
                    className="def-close-btn"
                    onClick={() => setShowDefinition(false)}
                    title="Close (Esc)"
                  >
                    ×
                  </button>
                </div>
              </div>
              <div className="def-status-badge">{getWordStatus(selectedWord.word)}</div>
            </div>

            <div className="def-action-bar">
              <button className="def-btn def-btn-known" onClick={() => handleWordStatus(selectedWord.word, 'known')}>
                ✓ I knew this
              </button>
              <button className="def-btn def-btn-forgotten" onClick={() => handleWordStatus(selectedWord.word, 'forgotten')}>
                ✗ I forgot
              </button>
              <button className="def-btn def-btn-reset" onClick={() => handleResetWord(selectedWord.word)}>
                ↺ Reset
              </button>
            </div>

            <div className="def-nav-bar">
              <button className="def-nav-btn" onClick={() => navigateWord('prev')}>← Previous</button>
              <button className="def-nav-btn" onClick={() => navigateWord('next')}>Next →</button>
            </div>

            <div className="def-body">
              <p className="def-definition">{selectedWord.definition}</p>

              {selectedWord.examples && selectedWord.examples.length > 0 && (
                <div className="def-section">
                  <h4>📖 Example</h4>
                  <p className="def-example">
                    {selectedWord.examples[0].includes(selectedWord.word)
                      ? selectedWord.examples[0].split(selectedWord.word).map((part, i, arr) => (
                          <React.Fragment key={i}>
                            {part}
                            {i < arr.length - 1 ? <u><strong>{selectedWord.word}</strong></u> : null}
                          </React.Fragment>
                        ))
                      : selectedWord.examples[0]}
                  </p>
                </div>
              )}

              {selectedWord.synonyms && selectedWord.synonyms.length > 0 && (
                <div className="def-section">
                  <h4>🔗 Synonyms</h4>
                  <div className="synonym-chips">
                    {selectedWord.synonyms.map((synonym, idx) => (
                      <span key={idx} className="synonym-chip">{synonym}</span>
                    ))}
                  </div>
                </div>
              )}

              <div className="def-section notes-section">
                <h4>📝 Notes</h4>
                <textarea
                  className="word-notes-input"
                  placeholder="Add your personal notes here..."
                  value={wordNote}
                  onChange={(e) => {
                    const v = e.target.value;
                    setWordNote(v);
                    saveNoteForWord(id, selectedWord.word, v);
                  }}
                  rows={3}
                />
                <p className="notes-disclaimer">
                  Notes are stored locally on your device only.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Vocab Check (Quiz) Modal */}
      {vocabCheckActive && vocabCheckWords.length > 0 && (
        <div className="quiz-overlay" onClick={() => setVocabCheckActive(false)}>
          <div className="quiz-panel" onClick={(e) => e.stopPropagation()}>
            <div className="quiz-header">
              <h2>🎯 Vocab Check — Group {vocabCheckGroup}</h2>
              <button className="quiz-close-btn" onClick={() => setVocabCheckActive(false)}>×</button>
            </div>
            <div className="quiz-progress-bar">
              <div className="quiz-progress-fill" style={{ width: `${((vocabCheckIndex + 1) / vocabCheckWords.length) * 100}%` }} />
            </div>
            <div className="quiz-score-bar">
              <span className="quiz-score correct">✓ {vocabCheckScore.correct}</span>
              <span className="quiz-counter">{vocabCheckIndex + 1} / {vocabCheckWords.length}</span>
              <span className="quiz-score wrong">✗ {vocabCheckScore.wrong}</span>
            </div>
            <div className="quiz-word">
              <h3>{vocabCheckWords[vocabCheckIndex].word}</h3>
            </div>
            {!vocabCheckRevealed ? (
              <button className="quiz-reveal-btn" onClick={() => setVocabCheckRevealed(true)}>
                Reveal Definition
              </button>
            ) : (
              <>
                <div className="quiz-definition">
                  <p>{vocabCheckWords[vocabCheckIndex].definition}</p>
                </div>
                <div className="quiz-answer-btns">
                  <button className="quiz-answer-btn knew-btn" onClick={() => vocabCheckAnswer(true)}>
                    ✓ I Knew It
                  </button>
                  <button className="quiz-answer-btn forgot-btn" onClick={() => vocabCheckAnswer(false)}>
                    ✗ I Forgot
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function AddWordForm({ groupNumber, onAdd }) {
  const [formData, setFormData] = useState({
    word: '',
    definition: '',
    synonyms: '',
    examples: ''
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.word.trim() || !formData.definition.trim()) return;
    const wordData = {
      word: formData.word.trim(),
      definition: formData.definition.trim(),
      synonyms: formData.synonyms.split(',').map(s => s.trim()).filter(s => s),
      examples: formData.examples.split(',').map(s => s.trim()).filter(s => s)
    };
    onAdd(wordData);
    setFormData({ word: '', definition: '', synonyms: '', examples: '' });
  };

  return (
    <form className="add-word-form" onSubmit={handleSubmit}>
      <input
        type="text"
        placeholder="Word"
        value={formData.word}
        onChange={(e) => setFormData({ ...formData, word: e.target.value })}
        required
        autoFocus
      />
      <textarea
        placeholder="Definition"
        value={formData.definition}
        onChange={(e) => setFormData({ ...formData, definition: e.target.value })}
        required
        rows={2}
      />
      <input
        type="text"
        placeholder="Synonyms (comma-separated)"
        value={formData.synonyms}
        onChange={(e) => setFormData({ ...formData, synonyms: e.target.value })}
      />
      <input
        type="text"
        placeholder="Examples (comma-separated)"
        value={formData.examples}
        onChange={(e) => setFormData({ ...formData, examples: e.target.value })}
      />
      <button type="submit" className="add-word-submit-btn">Add Word</button>
    </form>
  );
}

export default VocabMountain;
