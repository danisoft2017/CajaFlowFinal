import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import Cajas from './components/Cajas';
import Categorias from './components/Categorias';
import Movimientos from './components/Movimientos';
import Usuarios from './components/Usuarios';
import Clientes from './components/Clientes';
import Layout from './components/Layout';
import Productos from './components/Productos';
import Reportes from './components/Reportes';

function MainRouter() {
    const estaAutenticado = () => {
        return !!localStorage.getItem('token');
    };

    return (
        <Routes>
            <Route path="/login" element={<Login />} />

            {/* 2. ¡TODAS LAS RUTAS DEBEN TENER <Layout> ENVOLVIENDO EL COMPONENTE! */}
            <Route path="/dashboard" element={
                estaAutenticado() ? <Layout><Dashboard /></Layout> : <Navigate to="/login" />
            } />
            <Route path="/cajas" element={
                estaAutenticado() ? <Layout><Cajas /></Layout> : <Navigate to="/login" />
            } />
            <Route path="/categorias" element={
                estaAutenticado() ? <Layout><Categorias /></Layout> : <Navigate to="/login" />
            } />
            <Route path="/movimientos" element={
                estaAutenticado() ? <Layout><Movimientos /></Layout> : <Navigate to="/login" />
            } />
            <Route path="/usuarios" element={
                estaAutenticado() ? <Layout><Usuarios /></Layout> : <Navigate to="/login" />
            } />
            <Route path="/clientes" element={
                estaAutenticado() ? <Layout><Clientes /></Layout> : <Navigate to="/login" />
            } />

            <Route path="/productos" element={
                estaAutenticado() ? <Layout><Productos /></Layout> : <Navigate to="/login" />
            } />
            <Route path="/reportes" element={
                estaAutenticado() ? <Layout><Reportes /></Layout> : <Navigate to="/login" />
            } />

            <Route path="*" element={<Navigate to="/login" />} />
        </Routes>
    );
}

export default MainRouter;