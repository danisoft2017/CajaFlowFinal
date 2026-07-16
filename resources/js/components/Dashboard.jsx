import React from 'react';
import { useNavigate, Link } from 'react-router-dom';

function Dashboard() {
    const navigate = useNavigate();
    const user = JSON.parse(localStorage.getItem('user'));

    const handleLogout = () => {
        localStorage.clear(); // Borra el token de sesión
        navigate('/login');
    };

    return (
        <div style={{ background: '#fff', padding: '20px', borderRadius: '5px' }}>
            <h1>Dashboard Principal</h1>
            <p>Bienvenido al sistema, <strong>{user?.name || 'Usuario'}</strong></p>
            <p>Tu rol asignado es: <strong>{user?.role}</strong></p>
            <hr />

<hr />

            {/* Enlace limpio para ir al módulo de Cajas */}
            <div style={{ margin: '20px 0' }}>
                <Link to="/cajas" style={{ 
                    display: 'inline-block', 
                    padding: '8px 15px', 
                    background: '#e0e0e0', 
                    color: '#000', 
                    textDecoration: 'none', 
                    borderRadius: '4px',
                    fontWeight: 'bold'
                }}>
                    Ir al Módulo de Cajas →
                </Link>
            </div>

            <hr />

            <button onClick={handleLogout} style={{ padding: '8px', cursor: 'pointer' }}>
                Cerrar Sesión
            </button>
        </div>
    );
}

export default Dashboard;