import React, { useState,useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    const [resumen, setResumen] = useState({
        cajas_activas: 0,
        saldo_total: '0.00',
        movimientos_hoy: 0
    });

    const navigate = useNavigate();

    // Cargar estadísticas públicas al cargar la pantalla
    useEffect(() => {
        obtenerResumenPublico();
    }, []);

    const obtenerResumenPublico = async () => {
        try {
            const response = await axios.get('/api/resumen-publico');
            setResumen(response.data);
        } catch (err) {
            console.error("Error al obtener resumen público", err);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(''); // Limpiar errores previos

        try {
            // Enviamos los datos directamente a la API de Laravel
            const response = await axios.post('/api/login', { email, password });
            
            // Guardamos el token de seguridad y datos básicos en el navegador
            localStorage.setItem('token', response.data.access_token);
            localStorage.setItem('user', JSON.stringify(response.data.user));

            // Nos vamos directo al entorno del Dashboard
            navigate('/dashboard');
        } catch (err) {
            setError(err.response?.data?.message || 'Error al conectar con el servidor.');
        }
    };

return (
        <div style={{ maxWidth: '650px', margin: '30px auto', fontFamily: 'sans-serif' }}>
            
            {/* ENCABEZADO DEL SISTEMA */}
            <div style={{ textAlign: 'center', marginBottom: '25px' }}>
                <h1 style={{ margin: '0 0 5px 0' }}>CajaFlow</h1>
                <p style={{ color: '#666', margin: 0 }}>Sistema de Gestión Financiera y Control de Cajas</p>
            </div>

            {/* SECCIÓN DE RESUMEN PÚBLICO (3 TARJETAS SIMPLES) */}
            <div style={{ display: 'flex', gap: '15px', marginBottom: '25px', justifyContent: 'space-between' }}>
                
                {/* Tarjeta 1: Cajas Activas */}
                <div style={{ flex: 1, background: '#eef6ff', border: '1px solid #b6d4fe', padding: '15px', borderRadius: '5px', textAlign: 'center' }}>
                    <span style={{ fontSize: '0.9em', color: '#084298', fontWeight: 'bold' }}>Cajas Activas</span>
                    <h2 style={{ margin: '5px 0 0 0', color: '#084298' }}>{resumen.cajas_activas}</h2>
                </div>

                {/* Tarjeta 2: Saldo Total */}
                <div style={{ flex: 1, background: '#e2f0d9', border: '1px solid #b2d8a3', padding: '15px', borderRadius: '5px', textAlign: 'center' }}>
                    <span style={{ fontSize: '0.9em', color: '#276a10', fontWeight: 'bold' }}>Saldo Total</span>
                    <h2 style={{ margin: '5px 0 0 0', color: '#276a10' }}>S/ {resumen.saldo_total}</h2>
                </div>

                {/* Tarjeta 3: Movimientos Hoy */}
                <div style={{ flex: 1, background: '#fff3cd', border: '1px solid #ffecb5', padding: '15px', borderRadius: '5px', textAlign: 'center' }}>
                    <span style={{ fontSize: '0.9em', color: '#664d03', fontWeight: 'bold' }}>Movimientos Hoy</span>
                    <h2 style={{ margin: '5px 0 0 0', color: '#664d03' }}>{resumen.movimientos_hoy}</h2>
                </div>

            </div>

            {/* FORMULARIO DE ACCESO */}
            <div style={{ background: '#fff', border: '1px solid #ccc', padding: '25px', borderRadius: '5px' }}>
                <h2 style={{ marginTop: 0 }}>Iniciar Sesión</h2>
                
                {error && (
                    <div style={{ background: '#f8d7da', color: '#842029', padding: '10px', borderRadius: '4px', marginBottom: '15px', border: '1px solid #f5c2c7' }}>
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit}>
                    <div style={{ marginBottom: '15px' }}>
                        <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Correo Electrónico:</label>
                        <input 
                            type="email" 
                            value={email} 
                            onChange={(e) => setEmail(e.target.value)} 
                            placeholder="ejemplo@empresa.com"
                            required 
                            style={{ width: '100%', padding: '8px', boxSizing: 'border-box' }}
                        />
                    </div>

                    <div style={{ marginBottom: '20px' }}>
                        <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Contraseña:</label>
                        <input 
                            type="password" 
                            value={password} 
                            onChange={(e) => setPassword(e.target.value)} 
                            placeholder="••••••••"
                            required 
                            style={{ width: '100%', padding: '8px', boxSizing: 'border-box' }}
                        />
                    </div>

                    <button 
                        type="submit" 
                        style={{ 
                            width: '100%', 
                            padding: '10px', 
                            background: '#000', 
                            color: '#fff', 
                            border: 'none', 
                            borderRadius: '4px', 
                            fontWeight: 'bold', 
                            cursor: 'pointer' 
                        }}
                    >
                        Ingresar al Sistema →
                    </button>
                </form>
            </div>

        </div>
    );
}

export default Login;