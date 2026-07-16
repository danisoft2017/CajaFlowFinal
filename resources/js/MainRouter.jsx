import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import Cajas from './components/Cajas';

function MainRouter() {
    return (
        <BrowserRouter>
            <Routes>
                {/* Al entrar a la raíz, redirige automáticamente al login */}
                <Route path="/" element={<Navigate to="/login" />} />
                <Route path="/login" element={<Login />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/cajas" element={<Cajas />} />
            </Routes>
        </BrowserRouter>
    );
}

export default MainRouter;