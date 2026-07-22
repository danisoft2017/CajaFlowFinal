import React from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';

function Layout({ children }) {
    const navigate = useNavigate();
    const location = useLocation();
    const user = JSON.parse(localStorage.getItem('user'));

    const handleLogout = () => {
        localStorage.clear();
        navigate('/login');
    };

    const isActive = (path) => location.pathname === path;

    return (
        <div style={{ display: 'flex', minHeight: '100vh', fontFamily: 'sans-serif', background: '#f4f6f9' }}>
            
            {/* ENCABEZADO FIJO (HEADER) */}
            <header style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                height: '60px',
                background: '#1e293b',
                color: '#fff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0 20px',
                zIndex: 1000
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <h2 style={{ margin: 0, fontSize: '1.3em' }}>CajaFlow</h2>
                    <span style={{ fontSize: '0.8em', background: '#334155', padding: '3px 8px', borderRadius: '4px' }}>v1.0</span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                    <span>{user?.avatar || '👤'} <strong>{user?.name || 'Usuario'}</strong> ({user?.role})</span>
                    <button 
                        onClick={handleLogout} 
                        style={{ padding: '6px 12px', background: '#ef4444', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}
                    >
                        Cerrar Sesión
                    </button>
                </div>
            </header>

            {/* BARRA LATERAL + CONTENIDO CENTRAL */}
            <div style={{ display: 'flex', width: '100%', marginTop: '60px' }}>
                
                {/* MENÚ IZQUIERDO (SIDEBAR) */}
                <aside style={{
                    width: '220px',
                    background: '#ffffff',
                    borderRight: '1px solid #e2e8f0',
                    padding: '20px 10px',
                    position: 'fixed',
                    top: '60px',
                    bottom: 0,
                    left: 0,
                    overflowY: 'auto'
                }}>
                    <div style={{ fontSize: '0.8em', fontWeight: 'bold', color: '#94a3b8', marginBottom: '10px', paddingLeft: '10px' }}>
                        NAVEGACIÓN
                    </div>

                    <nav style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                        <Link to="/dashboard" style={{ padding: '10px 15px', borderRadius: '6px', textDecoration: 'none', fontWeight: 'bold', color: isActive('/dashboard') ? '#fff' : '#334155', background: isActive('/dashboard') ? '#2563eb' : 'transparent' }}>
                            📊 Dashboard
                        </Link>
                        <Link to="/cajas" style={{ padding: '10px 15px', borderRadius: '6px', textDecoration: 'none', fontWeight: 'bold', color: isActive('/cajas') ? '#fff' : '#334155', background: isActive('/cajas') ? '#2563eb' : 'transparent' }}>
                            📦 Cajas
                        </Link>
                        <Link to="/categorias" style={{ padding: '10px 15px', borderRadius: '6px', textDecoration: 'none', fontWeight: 'bold', color: isActive('/categorias') ? '#fff' : '#334155', background: isActive('/categorias') ? '#2563eb' : 'transparent' }}>
                            🏷️ Categorías
                        </Link>
                        <Link to="/movimientos" style={{ padding: '10px 15px', borderRadius: '6px', textDecoration: 'none', fontWeight: 'bold', color: isActive('/movimientos') ? '#fff' : '#334155', background: isActive('/movimientos') ? '#2563eb' : 'transparent' }}>
                            💸 Movimientos
                        </Link>
                        <Link to="/usuarios" style={{ padding: '10px 15px', borderRadius: '6px', textDecoration: 'none', fontWeight: 'bold', color: isActive('/usuarios') ? '#fff' : '#334155', background: isActive('/usuarios') ? '#2563eb' : 'transparent' }}>
                            👥 Usuarios
                        </Link>
                    </nav>
                </aside>

                {/* CONTENIDO CENTRAL */}
                <main style={{ marginLeft: '220px', flex: 1, padding: '25px', boxSizing: 'border-box' }}>
                    {children}
                </main>

            </div>
        </div>
    );
}

export default Layout;