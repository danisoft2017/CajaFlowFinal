import React from 'react';
import ReactDOM from 'react-dom/client';
import MainRouter from './MainRouter';

const root = ReactDOM.createRoot(document.getElementById('app'));
root.render(
    <React.StrictMode>
        <MainRouter />
    </React.StrictMode>
);