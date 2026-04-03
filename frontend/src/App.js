import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import VocabMountain from './components/VocabMountain';
import MountainList from './components/MountainList';
import CreateMountain from './components/CreateMountain';
import './App.css';

function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/" element={<MountainList />} />
          <Route path="/mountain/:id" element={<VocabMountain />} />
          <Route path="/create-mountain" element={<CreateMountain />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
