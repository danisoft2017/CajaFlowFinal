import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Swal from 'sweetalert2';

function Login({ onLoginSuccess }) {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [verPassword, setVerPassword] = useState(false);
    const [cargando, setCargando] = useState(false);

    // ESTADO DE MÉTRICAS REALES DESDE LA BASE DE DATOS
    const [metricas, setMetricas] = useState({
        cajas_activas: 0,
        saldo_total: '0.00',
        movimientos_hoy: 0
    });
    const [cargandoMetricas, setCargandoMetricas] = useState(true);

    useEffect(() => {
        cargarMetricas();
    }, []);

    const cargarMetricas = async () => {
        try {
            const response = await axios.get('/api/public/metricas-login');
            setMetricas(response.data);
        } catch (error) {
            console.error("Error al obtener las métricas dinámicas", error);
        } finally {
            setCargandoMetricas(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setCargando(true);

        try {
            const response = await axios.post('/api/login', {
                email,
                password
            });

            localStorage.setItem('token', response.data.access_token);
            localStorage.setItem('user', JSON.stringify(response.data.user));

            Swal.fire({
                icon: 'success',
                title: '¡Bienvenido!',
                text: `Hola ${response.data.user.name}, has iniciado sesión correctamente.`,
                timer: 1800,
                showConfirmButton: false,
                timerProgressBar: true
            });

            if (onLoginSuccess) {
                onLoginSuccess();
            } else {
                window.location.href = '/movimientos';
            }

        } catch (error) {
            Swal.fire({
                icon: 'error',
                title: 'Error de Autenticación',
                text: error.response?.data?.message || 'Credenciales incorrectas. Verifique su correo y contraseña.',
                confirmButtonColor: '#4f46e5'
            });
        } finally {
            setCargando(false);
        }
    };

    return (
        <div className="container-fluid vh-100 p-0 overflow-hidden">
            <div className="row g-0 h-100">
                
                {/* PANEL IZQUIERDO: BRANDING Y ESTADÍSTICAS REALES */}
                <div 
                    className="col-lg-6 col-xl-7 d-none d-lg-flex flex-column justify-content-between p-5 text-white"
                    style={{
                        background: 'linear-gradient(135deg, #4f46e5 0%, #4338ca 100%)',
                        position: 'relative'
                    }}
                >
                    {/* Brand Header */}
                    <div className="d-flex align-items-center gap-2">
                        <div className="bg-white bg-opacity-20 p-2 rounded-3 d-flex align-items-center justify-content-center" style={{ width: '40px', height: '40px' }}>
                            <i className="fa-solid fa-chart-simple fs-5" style={{ color: '#4f46e5' }}></i>
                        </div>
                        <span className="fw-bold fs-4 tracking-tight">CajaFlow</span>
                    </div>

                    {/* Mensaje Principal */}
                    <div className="my-auto my-5 pe-xl-5">
                        <h1 className="display-4 fw-bold mb-4" style={{ lineHeight: 1.15 }}>
                            Gestión de Cajas <br />con control total
                        </h1>
                        <p className="fs-5 text-white-50 fw-normal" style={{ maxWidth: '520px' }}>
                            Administra múltiples cajas, registra movimientos, genera reportes y visualiza estadísticas financieras en tiempo real.
                        </p>
                    </div>

                    {/* TARJETAS DE MÉTRICAS RÁPIDAS (DATOS DINÁMICOS REALES) */}
                    <div className="row g-3">
                        <div className="col-md-4">
                            <div className="text-center p-3 rounded-4 bg-white bg-opacity-10 backdrop-blur border border-white border-opacity-10">
                                <h3 className="fw-bold mb-1">
                                    {cargandoMetricas ? '...' : metricas.cajas_activas}
                                </h3>
                                <p className="small text-white-50 mb-0">Cajas activas</p>
                            </div>
                        </div>

                        <div className="col-md-4">
                            <div className="text-center p-3 rounded-4 bg-white bg-opacity-10 backdrop-blur border border-white border-opacity-10">
                                <h3 className="fw-bold mb-1">
                                    {cargandoMetricas ? '...' : `S/ ${parseFloat(metricas.saldo_total).toLocaleString('es-PE', { minimumFractionDigits: 2 })}`}
                                </h3>
                                <p className="small text-white-50 mb-0">Saldo total</p>
                            </div>
                        </div>

                        <div className="col-md-4">
                            <div className="text-center p-3 rounded-4 bg-white bg-opacity-10 backdrop-blur border border-white border-opacity-10">
                                <h3 className="fw-bold mb-1">
                                    {cargandoMetricas ? '...' : metricas.movimientos_hoy}
                                </h3>
                                <p className="small text-white-50 mb-0">Movimientos hoy</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* PANEL DERECHO: FORMULARIO DE LOGIN */}
                <div className="col-lg-6 col-xl-5 d-flex align-items-center justify-content-center bg-light p-4 p-sm-5">
                    <div className="w-100" style={{ maxWidth: '420px' }}>
                        
                        <div className="d-flex d-lg-none align-items-center gap-2 mb-4">
                            <div className="bg-primary p-2 rounded-3 d-flex align-items-center justify-content-center text-white" style={{ width: '36px', height: '36px' }}>
                                <i className="fa-solid fa-chart-simple"></i>
                            </div>
                            <span className="fw-bold fs-4 text-dark">CajaFlow</span>
                        </div>

                        <div className="mb-4">
                            <h2 className="fw-bold text-dark mb-1">Iniciar sesión</h2>
                            <p className="text-muted small">Ingresa tus credenciales para continuar</p>
                        </div>

                        <form onSubmit={handleSubmit}>
                            
                            <div className="mb-3">
                                <label className="form-label small fw-semibold text-secondary">
                                    Correo electrónico
                                </label>
                                <div className="input-group">
                                    <span className="input-group-text bg-white border-end-0 text-muted ps-3">
                                        <i className="fa-regular fa-envelope"></i>
                                    </span>
                                    <input 
                                        type="email" 
                                        className="form-control border-start-0 ps-2 py-2"
                                        placeholder="correo@empresa.com"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        required
                                        style={{ boxShadow: 'none' }}
                                    />
                                </div>
                            </div>

                            <div className="mb-4">
                                <label className="form-label small fw-semibold text-secondary">
                                    Contraseña
                                </label>
                                <div className="input-group">
                                    <span className="input-group-text bg-white border-end-0 text-muted ps-3">
                                        <i className="fa-solid fa-lock"></i>
                                    </span>
                                    <input 
                                        type={verPassword ? "text" : "password"}
                                        className="form-control border-start-0 border-end-0 ps-2 py-2"
                                        placeholder="••••••••"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        required
                                        style={{ boxShadow: 'none' }}
                                    />
                                    <button 
                                        type="button"
                                        className="input-group-text bg-white border-start-0 text-muted pe-3"
                                        onClick={() => setVerPassword(!verPassword)}
                                        style={{ cursor: 'pointer' }}
                                    >
                                        <i className={`fa-regular ${verPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                                    </button>
                                </div>
                            </div>

                            <button 
                                type="submit" 
                                className="btn w-100 py-2.5 fw-semibold text-white shadow-sm mb-4"
                                disabled={cargando}
                                style={{
                                    backgroundColor: '#4f46e5',
                                    borderRadius: '8px',
                                    fontSize: '0.95rem'
                                }}
                            >
                                {cargando ? (
                                    <>
                                        <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                                        Ingresando...
                                    </>
                                ) : (
                                    'Ingresar al sistema'
                                )}
                            </button>



                        </form>
                    </div>
                </div>

            </div>
        </div>
    );
}

export default Login;