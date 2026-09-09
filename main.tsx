import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import Portfolio from './app/portfolio';
import projects from './public/data/projects.json';
import './app/globals.css';

const root = document.getElementById('root');
if (!root) throw new Error('Portfolio root is missing.');
createRoot(root).render(
  <StrictMode>
    <Portfolio initialProjects={projects} />
  </StrictMode>,
);
