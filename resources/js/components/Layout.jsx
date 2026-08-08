import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';

function Layout({ children }) {
    const location = useLocation();
    const navigate = useNavigate();
    const [sidebarAbierto, setSidebarAbierto] = useState(false);

    const usuarioLogueado = JSON.parse(localStorage.getItem('user')) || { name: 'Usuario', role: 'operador' };
    const isActive = (path) => location.pathname === path;

    // Obtener título activo según la ruta para la barra superior
    const obtenerTituloRuta = () => {
        switch (location.pathname) {
            case '/dashboard': return 'Dashboard';
            case '/cajas': return 'Cajas';
            case '/movimientos': return 'Movimientos';
            case '/categorias': return 'Categorías';
            case '/clientes': return 'Clientes';
            case '/productos': return 'Productos';
            case '/usuarios': return 'Usuarios';
            case '/reportes': return 'Reportes';
            default: return 'CajaFlow';
        }
    };

    const handleCerrarSesion = () => {
        Swal.fire({
            title: '¿Cerrar Sesión?',
            text: "Tendrás que volver a ingresar tus credenciales.",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#4f46e5',
            cancelButtonColor: '#94a3b8',
            confirmButtonText: 'Sí, Salir',
            cancelButtonText: 'Cancelar'
        }).then((result) => {
            if (result.isConfirmed) {
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                navigate('/login');
            }
        });
    };

    const menuItems = [
        { path: '/dashboard', label: 'Dashboard', icon: 'fa-solid fa-chart-pie' },
        { path: '/movimientos', label: 'Movimientos', icon: 'fa-solid fa-arrow-right-arrow-left' },
        { path: '/cajas', label: 'Cajas', icon: 'fa-regular fa-folder-closed' },
        { path: '/categorias', label: 'Categorías', icon: 'fa-solid fa-tag' },
        { path: '/clientes', label: 'Clientes', icon: 'fa-regular fa-user' },
        { path: '/productos', label: 'Productos', icon: 'fa-solid fa-box-archive' },
        { path: '/usuarios', label: 'Usuarios', icon: 'fa-solid fa-users' },
        { path: '/reportes', label: 'Reportes', icon: 'fa-solid fa-file-lines' },
    ];

    const toggleSidebar = () => setSidebarAbierto(!sidebarAbierto);

    return (
        <div className="d-flex vh-100 overflow-hidden bg-light">
            
            {/* FONDO OSCURO EN MÓVIL AL ABRIR EL SIDEBAR */}
            {sidebarAbierto && (
                <div 
                    className="position-fixed top-0 start-0 w-100 h-100 bg-dark bg-opacity-50 d-lg-none"
                    style={{ zIndex: 1040 }}
                    onClick={toggleSidebar}
                ></div>
            )}

            {/* SIDEBAR LATERAL NATIVO */}
            <aside 
                className={`d-flex flex-column justify-content-between bg-white border-end p-3 flex-shrink-0 ${
                    sidebarAbierto ? 'position-fixed top-0 start-0 h-100' : 'd-none d-lg-flex'
                }`}
                style={{ 
                    width: '250px', 
                    zIndex: 1050,
                    transition: 'all 0.3s ease'
                }}
            >
                <div>
                    {/* LOGO BRAND */}
                    <div className="d-flex align-items-center justify-content-between mb-4 ps-2 pt-2">
                        <div className="d-flex align-items-center gap-2">
                            <div className="p-2 rounded-3 text-white d-flex align-items-center justify-content-center" style={{ width: '36px', height: '36px', backgroundColor: '#4f46e5' }}>
                                <i className="fa-solid fa-chart-simple"></i>
                            </div>
                            <span className="fw-bold fs-5 tracking-tight text-dark">CajaFlow</span>
                        </div>

                        {/* Botón X para cerrar menú en móviles */}
                        <button className="btn btn-light btn-sm d-lg-none" onClick={toggleSidebar}>
                            <i className="fa-solid fa-xmark fs-5 text-muted"></i>
                        </button>
                    </div>

                    {/* NAVEGACIÓN */}
                    <nav className="nav nav-pills flex-column gap-1">
                        {menuItems.map((item) => {
                            const activo = isActive(item.path);
                            return (
                                <Link
                                    key={item.path}
                                    to={item.path}
                                    onClick={() => setSidebarAbierto(false)}
                                    className={`nav-link d-flex align-items-center gap-3 py-2.5 px-3 rounded-3 fw-semibold ${activo ? 'text-white' : 'text-secondary'}`}
                                    style={{
                                        backgroundColor: activo ? '#4f46e5' : 'transparent',
                                        transition: 'all 0.2s ease'
                                    }}
                                >
                                    <i className={`${item.icon} fs-6 ${activo ? 'text-white' : 'text-muted'}`}></i>
                                    <span>{item.label}</span>
                                </Link>
                            );
                        })}
                    </nav>
                </div>

                {/* USER CARD Y LOGOUT */}
                <div className="pt-3 border-top">
                    <div className="p-2 rounded-3 bg-light d-flex align-items-center gap-2 mb-2">
                        <div className="rounded-circle text-white d-flex align-items-center justify-content-center fw-bold" style={{ width: '36px', height: '36px', backgroundColor: '#4f46e5' }}>
                            {usuarioLogueado.name ? usuarioLogueado.name.charAt(0).toUpperCase() : 'U'}
                        </div>
                        <div className="overflow-hidden">
                            <h6 className="mb-0 fw-bold text-dark text-truncate small">{usuarioLogueado.name}</h6>
                            <span className="text-muted small text-capitalize" style={{ fontSize: '0.75rem' }}>{usuarioLogueado.role || 'Usuario'}</span>
                        </div>
                    </div>

                    <button 
                        onClick={handleCerrarSesion}
                        className="btn w-100 d-flex align-items-center gap-2 text-danger fw-semibold btn-link text-decoration-none px-2 py-2"
                        style={{ fontSize: '0.9rem' }}
                    >
                        <i className="fa-solid fa-right-from-bracket"></i>
                        <span>Cerrar sesión</span>
                    </button>
                </div>
            </aside>

            {/* CONTENIDO PRINCIPAL FLUIDO CON SCROLL INTERNO */}
            <main className="flex-grow-1 overflow-auto bg-slate-50 min-w-0" style={{ minWidth: 0 }}>
                
                {/* BARRA SUPERIOR ANCLADA (STICKY TOP) */}
                <header 
                    className="position-sticky top-0 bg-white border-bottom px-3 px-md-4 py-3 mb-4 d-flex justify-content-between align-items-center"
                    style={{ zIndex: 1020, backdropFilter: 'blur(8px)', backgroundColor: 'rgba(255, 255, 255, 0.95)' }}
                >
                    <div className="d-flex align-items-center gap-2.5">
                        {/* Botón Hamburguesa visible en móviles y tablets */}
                        <button 
                            className="btn btn-white border shadow-sm rounded-3 d-lg-none py-1.5 px-2.5"
                            onClick={toggleSidebar}
                            aria-label="Abrir Menú"
                        >
                            <i className="fa-solid fa-bars text-dark fs-5"></i>
                        </button>

                        <h4 className="fw-bold text-dark m-0 fs-5 fs-md-4">
                            {obtenerTituloRuta()}
                        </h4>
                    </div>

                    <button className="btn btn-light rounded-circle border shadow-sm text-secondary" style={{ width: '38px', height: '38px' }}>
                        <i className="fa-regular fa-moon"></i>
                    </button>
                </header>

                {/* CUERPO DINÁMICO CON PADDING */}
                <div className="px-3 px-md-4 pb-4">
                    {children}
                </div>

            </main>

        </div>
    );
}

export default Layout;