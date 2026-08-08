import './bootstrap';
import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom'; // <-- 1. IMPORTANTE: Importar BrowserRouter
import MainRouter from './MainRouter';

const rootElement = document.getElementById('app');

if (rootElement) {
    ReactDOM.createRoot(rootElement).render(
        <React.StrictMode>
            <BrowserRouter> {/* <-- 2. ENVOLVER AQUÍ */}
                <MainRouter />
            </BrowserRouter>
        </React.StrictMode>
    );
}