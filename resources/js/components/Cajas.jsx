import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Swal from 'sweetalert2';

function Cajas() {
    const [datos, setDatos] = useState({
        saldo_total: 0,
        cajas_activas: 0,
        total_cajas: 0,
        cajas: []
    });
    const [cargando, setCargando] = useState(true);

    // Estados para el Modal Crear / Editar
    const [mostrarModal, setMostrarModal] = useState(false);
    const [editando, setEditando] = useState(false);
    const [cajaId, setCajaId] = useState(null);
    const [nombreCaja, setNombreCaja] = useState('');
    const [descripcionCaja, setDescripcionCaja] = useState('');
    const [estadoCaja, setEstadoCaja] = useState(true);

    const paletaColores = [
        { bg: '#e0e7ff', text: '#4f46e5', bar: '#4f46e5', icon: 'fa-wallet' },
        { bg: '#d1fae5', text: '#10b981', bar: '#10b981', icon: 'fa-store' },
        { bg: '#fef3c7', text: '#d97706', bar: '#f59e0b', icon: 'fa-cash-register' },
        { bg: '#cff4fc', text: '#0891b2', bar: '#06b6d4', icon: 'fa-globe' },
        { bg: '#fce7f3', text: '#db2777', bar: '#ec4899', icon: 'fa-credit-card' },
    ];

    useEffect(() => {
        cargarCajas();
    }, []);

    const cargarCajas = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get('/api/cajas', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setDatos(res.data);
        } catch (error) {
            console.error("Error al obtener las cajas", error);
        } finally {
            setCargando(false);
        }
    };

    const abrirModalNuevo = () => {
        setEditando(false);
        setCajaId(null);
        setNombreCaja('');
        setDescripcionCaja('');
        setEstadoCaja(true);
        setMostrarModal(true);
    };

    const abrirModalEditar = (caja) => {
        setEditando(true);
        setCajaId(caja.id);
        setNombreCaja(caja.nombre);
        setDescripcionCaja(caja.descripcion || '');
        setEstadoCaja(Boolean(caja.estado));
        setMostrarModal(true);
    };

    const handleSubmitCaja = async (e) => {
        e.preventDefault();
        if (!nombreCaja.trim()) {
            Swal.fire('Atención', 'Ingrese el nombre de la caja.', 'warning');
            return;
        }

        try {
            const token = localStorage.getItem('token');
            const payload = { 
                nombre: nombreCaja, 
                descripcion: descripcionCaja,
                estado: estadoCaja
            };

            if (editando) {
                await axios.put(`/api/cajas/${cajaId}`, payload, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                Swal.fire('¡Actualizada!', 'La caja ha sido modificada con éxito.', 'success');
            } else {
                await axios.post('/api/cajas', payload, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                Swal.fire('¡Creada!', 'La nueva caja ha sido registrada.', 'success');
            }

            setMostrarModal(false);
            cargarCajas();
        } catch (error) {
            Swal.fire('Error', error.response?.data?.message || 'Error al procesar la caja.', 'error');
        }
    };

    // Alternar booleano estado
    const handleToggleEstado = async (id, estadoBooleanoActual) => {
        const accionStr = estadoBooleanoActual ? 'desactivar' : 'activar';
        
        Swal.fire({
            title: `¿Deseas ${accionStr} esta caja?`,
            icon: 'question',
            showCancelButton: true,
            confirmButtonColor: '#4f46e5',
            cancelButtonColor: '#94a3b8',
            confirmButtonText: 'Sí, cambiar',
            cancelButtonText: 'Cancelar'
        }).then(async (result) => {
            if (result.isConfirmed) {
                try {
                    const token = localStorage.getItem('token');
                    await axios.patch(`/api/cajas/${id}/toggle-estado`, {}, {
                        headers: { Authorization: `Bearer ${token}` }
                    });
                    cargarCajas();
                } catch (error) {
                    Swal.fire('Error', 'No se pudo cambiar el estado de la caja.', 'error');
                }
            }
        });
    };

    if (cargando) {
        return (
            <div className="text-center py-5">
                <div className="spinner-border text-primary" role="status"></div>
                <p className="text-muted small mt-2">Cargando cajas registradas...</p>
            </div>
        );
    }

    return (
        <div className="container">
            <div className="w-100">
                
                {/* TARJETAS DE RESUMEN SUPERIOR */}
                <div className="row g-3 mb-4">
                    <div className="col-12 col-md-4">
                        <div className="card border-0 shadow-sm rounded-4 p-3 bg-white h-100">
                            <span className="text-muted small fw-semibold d-block mb-1">Saldo total</span>
                            <h3 className="fw-bold mb-0" style={{ color: '#4f46e5' }}>
                                S/ {datos.saldo_total.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </h3>
                        </div>
                    </div>

                    <div className="col-12 col-md-4">
                        <div className="card border-0 shadow-sm rounded-4 p-3 bg-white h-100">
                            <span className="text-muted small fw-semibold d-block mb-1">Cajas activas</span>
                            <h3 className="fw-bold text-success mb-0">{datos.cajas_activas}</h3>
                        </div>
                    </div>

                    <div className="col-12 col-md-4">
                        <div className="card border-0 shadow-sm rounded-4 p-3 bg-white h-100">
                            <span className="text-muted small fw-semibold d-block mb-1">Total cajas</span>
                            <h3 className="fw-bold text-dark mb-0">{datos.total_cajas}</h3>
                        </div>
                    </div>
                </div>

                {/* HEADER DE SECCIÓN + BOTÓN NUEVA CAJA */}
                <div className="d-flex justify-content-between align-items-center mb-3">
                    <h5 className="fw-bold text-dark m-0">Cajas registradas</h5>
                    <button 
                        onClick={abrirModalNuevo}
                        className="btn text-white fw-semibold px-3 py-2 rounded-3 shadow-sm d-flex align-items-center gap-2"
                        style={{ backgroundColor: '#4f46e5', border: 'none' }}
                    >
                        <i className="fa-solid fa-plus fs-6"></i>
                        <span>Nueva caja</span>
                    </button>
                </div>

                {/* GRID DE CARDS DE CAJAS */}
                <div className="row g-3">
                    {datos.cajas.length === 0 ? (
                        <div className="col-12 text-center py-5 bg-white rounded-4 border">
                            <p className="text-muted mb-0">No hay cajas creadas. Haga clic en "+ Nueva caja" para comenzar.</p>
                        </div>
                    ) : (
                        datos.cajas.map((caja, idx) => {
                            const estilo = paletaColores[idx % paletaColores.length];
                            const esInactiva = !caja.estado;

                            return (
                                <div key={caja.id} className="col-12 col-md-6">
                                    <div className={`card border-0 shadow-sm rounded-4 p-3 bg-white h-100 ${esInactiva ? 'opacity-75 bg-light-subtle' : ''}`}>
                                        
                                        {/* Header de la Card */}
                                        <div className="d-flex justify-content-between align-items-start mb-2">
                                            <div className="d-flex align-items-center gap-2.5">
                                                <div 
                                                    className="rounded-3 d-flex align-items-center justify-content-center flex-shrink-0"
                                                    style={{ 
                                                        width: '42px', 
                                                        height: '42px', 
                                                        backgroundColor: estilo.bg, 
                                                        color: estilo.text 
                                                    }}
                                                >
                                                    <i className={`fa-solid ${estilo.icon} fs-5`}></i>
                                                </div>
                                                <div>
                                                    <h6 className="mb-0 fw-bold text-dark">{caja.nombre}</h6>
                                                    {/* DESCRIPCIÓN ABAJO DEL NOMBRE */}
                                                    <span className="text-muted extra-small d-block">{caja.descripcion}</span>
                                                </div>
                                            </div>

                                            {/* Botones de Acción */}
                                            <div className="d-flex gap-1">
                                                <button 
                                                    onClick={() => abrirModalEditar(caja)}
                                                    className="btn btn-light btn-sm rounded-circle text-muted p-0 d-flex align-items-center justify-content-center border-0"
                                                    style={{ width: '32px', height: '32px' }}
                                                    title="Editar caja"
                                                >
                                                    <i className="fa-solid fa-pen fs-7"></i>
                                                </button>
                                                {/* INTERACCIÓN TOGGLE CON CAMPO ESTADO */}
                                                <button 
                                                    onClick={() => handleToggleEstado(caja.id, caja.estado)}
                                                    className={`btn btn-sm rounded-circle p-0 d-flex align-items-center justify-content-center border-0 ${esInactiva ? 'btn-light text-muted' : 'btn-light text-success'}`}
                                                    style={{ width: '32px', height: '32px' }}
                                                    title={esInactiva ? 'Activar caja' : 'Desactivar caja'}
                                                >
                                                    <i className={`fa-solid ${esInactiva ? 'fa-toggle-off' : 'fa-toggle-on'} fs-6`}></i>
                                                </button>
                                            </div>
                                        </div>

                                        {/* Monto Grande */}
                                        <div className="my-2">
                                            <h2 className="fw-bold text-dark mb-0" style={{ fontSize: '1.8rem' }}>
                                                S/ {caja.monto.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                            </h2>
                                        </div>

                                        {/* Barra de Progreso */}
                                        <div className="progress mb-2" style={{ height: '6px' }}>
                                            <div 
                                                className="progress-bar rounded" 
                                                role="progressbar" 
                                                style={{ width: `${caja.pct}%`, backgroundColor: estilo.bar }}
                                            ></div>
                                        </div>

                                        {/* Porcentaje y Badge de Estado Booleano */}
                                        <div className="d-flex justify-content-between align-items-center extra-small">
                                            <span className="text-muted fw-semibold">{caja.pct}% del total</span>
                                            <span 
                                                className={`badge rounded-pill px-2.5 py-1 fw-semibold ${
                                                    esInactiva ? 'bg-secondary text-white' : 'bg-success-subtle text-success'
                                                }`}
                                            >
                                                {caja.estado ? 'Activa' : 'Inactiva'}
                                            </span>
                                        </div>

                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>

                {/* MODAL CON CAMPOS DESCRIPCIÓN Y ESTADO */}
                {mostrarModal && (
                    <div className="modal d-block backdrop-blur" style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1050 }}>
                        <div className="modal-dialog modal-dialog-centered" style={{ maxWidth: '440px' }}>
                            <div className="modal-content rounded-4 border-0 shadow p-2">
                                
                                <div className="modal-header border-bottom-0 pb-0">
                                    <h5 className="modal-title fw-bold text-dark fs-5">
                                        {editando ? 'Modificar caja' : 'Nueva caja'}
                                    </h5>
                                    <button 
                                        type="button" 
                                        className="btn-close" 
                                        onClick={() => setMostrarModal(false)}
                                    ></button>
                                </div>

                                <form onSubmit={handleSubmitCaja} className="modal-body pt-3">
                                    
                                    {/* Input Nombre de la caja */}
                                    <div className="mb-3">
                                        <label className="form-label small fw-semibold text-secondary mb-1">
                                            Nombre de la caja *
                                        </label>
                                        <input 
                                            type="text" 
                                            className="form-control rounded-3 py-2 px-3 border-light-subtle bg-light"
                                            placeholder="Ej: Caja 3"
                                            value={nombreCaja}
                                            onChange={(e) => setNombreCaja(e.target.value)}
                                            required
                                            style={{ boxShadow: 'none' }}
                                        />
                                    </div>

                                    {/* Input Descripción (Nuevo campo de la BD) */}
                                    <div className="mb-3">
                                        <label className="form-label small fw-semibold text-secondary mb-1">
                                            Descripción o Ubicación
                                        </label>
                                        <input 
                                            type="text" 
                                            className="form-control rounded-3 py-2 px-3 border-light-subtle bg-light"
                                            placeholder="Ej: Sucursal norte / Punto de cobro 2"
                                            value={descripcionCaja}
                                            onChange={(e) => setDescripcionCaja(e.target.value)}
                                            style={{ boxShadow: 'none' }}
                                        />
                                    </div>

                                    {/* Checkbox / Switch para Estado Booleano */}
                                    <div className="form-check form-switch mb-4">
                                        <input 
                                            className="form-check-input" 
                                            type="checkbox" 
                                            role="switch" 
                                            id="flexSwitchCheckChecked"
                                            checked={estadoCaja}
                                            onChange={(e) => setEstadoCaja(e.target.checked)}
                                        />
                                        <label className="form-check-input-label small fw-semibold text-secondary ms-2" htmlFor="flexSwitchCheckChecked">
                                            Caja activa
                                        </label>
                                    </div>

                                    <div className="border-top pt-3 d-flex gap-2 justify-content-end">
                                        <button 
                                            type="button" 
                                            className="btn btn-light rounded-3 px-4 fw-semibold text-secondary"
                                            onClick={() => setMostrarModal(false)}
                                        >
                                            Cancelar
                                        </button>
                                        <button 
                                            type="submit" 
                                            className="btn text-white rounded-3 px-4 fw-semibold"
                                            style={{ backgroundColor: '#4f46e5', border: 'none' }}
                                        >
                                            {editando ? 'Guardar cambios' : 'Crear caja'}
                                        </button>
                                    </div>

                                </form>
                            </div>
                        </div>
                    </div>
                )}

            </div>
        </div>
    );
}

export default Cajas;