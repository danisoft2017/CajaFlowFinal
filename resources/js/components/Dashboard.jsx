import React, {useState, useEffect} from 'react';
import axios from 'axios';

import { useNavigate, Link } from 'react-router-dom';

function Dashboard() {
    const user = JSON.parse(localStorage.getItem('user'));
    const [resumen, setResumen] = useState({
        cajas_activas: 0,
        saldo_total: '0.00',
        movimientos_hoy: 0
    });

    useEffect(() => {
        cargarResumen();
    }, []);

    const cargarResumen = async () => {
        try {
            const response = await axios.get('/api/resumen-publico');
            setResumen(response.data);
        } catch (error) {
            console.error("Error al cargar datos del resumen", error);
        }
    };

    return (
        <div>
            <h1 style={{ marginTop: 0 }}>Panel Principal</h1>
            <p style={{ color: '#475569', fontSize: '1.1em' }}>
                ¡Hola de nuevo, <strong>{user?.name}</strong>! Este es el resumen general de tu sistema al día de hoy.
            </p>

            {/* Tarjetas Informativas en el Centro */}
            <div style={{ display: 'flex', gap: '20px', marginTop: '20px' }}>
                
                <div style={{ flex: 1, background: '#fff', padding: '20px', borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                    <span style={{ fontSize: '0.9em', color: '#64748b', fontWeight: 'bold' }}>Cajas Registradas</span>
                    <h2 style={{ margin: '10px 0 0 0', color: '#2563eb', fontSize: '2em' }}>{resumen.cajas_activas}</h2>
                </div>

                <div style={{ flex: 1, background: '#fff', padding: '20px', borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                    <span style={{ fontSize: '0.9em', color: '#64748b', fontWeight: 'bold' }}>Saldo Total en Sistema</span>
                    <h2 style={{ margin: '10px 0 0 0', color: '#16a34a', fontSize: '2em' }}>S/ {resumen.saldo_total}</h2>
                </div>

                <div style={{ flex: 1, background: '#fff', padding: '20px', borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                    <span style={{ fontSize: '0.9em', color: '#64748b', fontWeight: 'bold' }}>Movimientos de Hoy</span>
                    <h2 style={{ margin: '10px 0 0 0', color: '#d97706', fontSize: '2em' }}>{resumen.movimientos_hoy}</h2>
                </div>

            </div>
        </div>
    );
}

export default Dashboard;