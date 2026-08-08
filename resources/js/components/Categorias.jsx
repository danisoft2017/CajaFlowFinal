import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Swal from 'sweetalert2';

function Categorias() {
    const [categorias, setCategorias] = useState([]);
    const [cajas, setCajas] = useState([]);
    const [cargando, setCargando] = useState(true);

    // Identificar el Rol del usuario
    const usuarioStorage = localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')) : null;
    const userRole = usuarioStorage?.role ? usuarioStorage.role.toLowerCase().trim() : 'operador';
    const esAdminOSuper = ['superadmin', 'admin'].includes(userRole);

    // Estados del Modal
    const [mostrarModal, setMostrarModal] = useState(false);
    const [editando, setEditando] = useState(false);
    const [categoriaId, setCategoriaId] = useState(null);
    const [nombre, setNombre] = useState('');
    const [cajaId, setCajaId] = useState('');
    const [tipo, setTipo] = useState('INGRESO');

    useEffect(() => {
        cargarDatos();
    }, []);

    const cargarDatos = async () => {
        try {
            const token = localStorage.getItem('token');
            const config = { headers: { Authorization: `Bearer ${token}` } };

            const [resCats, resCajas] = await Promise.all([
                axios.get('/api/categorias', config),
                axios.get('/api/cajas?solo_activas=true', config)
            ]);

            setCategorias(Array.isArray(resCats.data) ? resCats.data : []);
            const listaCajas = Array.isArray(resCajas.data) ? resCajas.data : (resCajas.data.cajas || []);
            setCajas(listaCajas);
        } catch (error) {
            console.error("Error al obtener datos", error);
        } finally {
            setCargando(false);
        }
    };

    const abrirModalNuevo = () => {
        if (!esAdminOSuper) return;
        setEditando(false);
        setCategoriaId(null);
        setNombre('');
        setCajaId(cajas.length > 0 ? cajas[0].id.toString() : '');
        setTipo('INGRESO');
        setMostrarModal(true);
    };

    const abrirModalEditar = (cat) => {
        if (!esAdminOSuper) return;
        setEditando(true);
        setCategoriaId(cat.id);
        setNombre(cat.nombre);
        setCajaId(cat.caja_id ? cat.caja_id.toString() : '');
        setTipo(cat.tipo || 'INGRESO');
        setMostrarModal(true);
    };

    const handleSubmitCategoria = async (e) => {
        e.preventDefault();

        if (!nombre.trim() || !cajaId || !tipo) {
            Swal.fire('Atención', 'Complete todos los campos obligatorios.', 'warning');
            return;
        }

        try {
            const token = localStorage.getItem('token');
            const config = { headers: { Authorization: `Bearer ${token}` } };
            const payload = {
                nombre: nombre,
                caja_id: parseInt(cajaId),
                tipo: tipo
            };

            if (editando) {
                await axios.put(`/api/categorias/${categoriaId}`, payload, config);
                Swal.fire('¡Actualizada!', 'Categoría modificada con éxito.', 'success');
            } else {
                await axios.post('/api/categorias', payload, config);
                Swal.fire('¡Guardada!', 'Categoría registrada con éxito.', 'success');
            }

            setMostrarModal(false);
            cargarDatos();
        } catch (error) {
            Swal.fire('Error', error.response?.data?.message || 'Ocurrió un error al procesar.', 'error');
        }
    };

    const handleEliminarCategoria = (cat) => {
        if (!esAdminOSuper) return;

        if (cat.detalles_movimientos_count > 0) {
            Swal.fire('No se puede eliminar', `La categoría "${cat.nombre}" tiene ${cat.detalles_movimientos_count} movimiento(s) asociado(s).`, 'warning');
            return;
        }

        Swal.fire({
            title: `¿Eliminar la categoría "${cat.nombre}"?`,
            text: "Esta acción no se puede deshacer.",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#ef4444',
            cancelButtonColor: '#94a3b8',
            confirmButtonText: 'Sí, eliminar',
            cancelButtonText: 'Cancelar'
        }).then(async (result) => {
            if (result.isConfirmed) {
                try {
                    const token = localStorage.getItem('token');
                    const config = { headers: { Authorization: `Bearer ${token}` } };
                    await axios.delete(`/api/categorias/${cat.id}`, config);
                    Swal.fire('¡Eliminada!', 'La categoría fue eliminada.', 'success');
                    cargarDatos();
                } catch (error) {
                    Swal.fire('Error', error.response?.data?.message || 'No se pudo eliminar la categoría.', 'error');
                }
            }
        });
    };

    // Al obtener las categorías o al renderizar la tabla:
    const categoriasOrdenadas = [...categorias].sort((a, b) => {
        const cajaA = a.caja?.nombre || 'ZZZ'; // Coloca las sin caja al final
        const cajaB = b.caja?.nombre || 'ZZZ';
        
        // Primero compara por nombre de Caja
        if (cajaA.localeCompare(cajaB) !== 0) {
            return cajaA.localeCompare(cajaB);
        }
        // Si pertenecen a la misma caja, ordena por nombre de Categoría
        return a.nombre.localeCompare(b.nombre);
    });

    if (cargando) {
        return (
            <div className="text-center py-5">
                <div className="spinner-border text-primary" role="status"></div>
                <p className="text-muted small mt-2">Cargando categorías...</p>
            </div>
        );
    }

    return (
        <div className="container py-3">
            <div className="card border-0 shadow-sm rounded-4 p-4 bg-white">
                
                {/* ENCABEZADO */}
                <div className="d-flex justify-content-between align-items-center mb-4">
                    <div>
                        <h5 className="fw-bold text-dark m-0">Gestión de Categorías</h5>
                        <span className="text-muted extra-small">Asignación por Caja, Tipo y Control de Permisos</span>
                    </div>

                    {/* Botón visible solo para Superadmin y Admin */}
                    {esAdminOSuper && (
                        <button
                            onClick={abrirModalNuevo}
                            className="btn text-white fw-semibold px-3 py-2 rounded-3 shadow-sm d-flex align-items-center gap-2"
                            style={{ backgroundColor: '#4f46e5', border: 'none' }}
                        >
                            <i className="fa-solid fa-plus fs-6"></i>
                            <span>Nueva Categoría</span>
                        </button>
                    )}
                </div>

                {/* TABLA DE CATEGORÍAS */}
                <div className="table-responsive">
                    <table className="table table-hover align-middle mb-0">
                        <thead className="table-light text-secondary small fw-bold">
                            <tr>
                                <th>Nombre de Categoría</th>
                                <th>Caja Asignada</th>
                                <th className="text-center">Tipo</th>
                                <th className="text-center">Uso en Movimientos</th>
                                {esAdminOSuper && <th className="text-end pe-3">Acciones</th>}
                            </tr>
                        </thead>
                            <tbody className="small">
                                {categoriasOrdenadas.length === 0 ? (
                                    <tr>
                                        <td colSpan={esAdminOSuper ? "5" : "4"} className="text-center text-muted py-4">
                                            No hay categorías registradas.
                                        </td>
                                    </tr>
                                ) : (
                                    categoriasOrdenadas.map(cat => (
                                        <tr key={cat.id}>
                                            <td className="fw-bold text-dark">{cat.nombre}</td>
                                            <td>
                                                <span className="badge bg-primary-subtle text-primary border border-primary-subtle px-2 py-1 fw-semibold">
                                                    <i className="fa-solid fa-cash-register me-1"></i>
                                                    {cat.caja ? cat.caja.nombre : 'General'}
                                                </span>
                                            </td>
                                            <td className="text-center">
                                                <span className={`badge px-2.5 py-1 rounded-pill fw-semibold ${cat.tipo === 'INGRESO' ? 'bg-success-subtle text-success border border-success-subtle' : 'bg-danger-subtle text-danger border border-danger-subtle'}`}>
                                                    {cat.tipo || 'INGRESO'}
                                                </span>
                                            </td>
                                            <td className="text-center">
                                                {cat.detalles_movimientos_count > 0 ? (
                                                    <span className="badge bg-light text-dark border font-monospace">
                                                        {cat.detalles_movimientos_count} uso(s)
                                                    </span>
                                                ) : (
                                                    <span className="badge bg-secondary-subtle text-secondary border border-secondary-subtle">
                                                        Sin uso (Eliminable)
                                                    </span>
                                                )}
                                            </td>
                                            {esAdminOSuper && (
                                                <td className="text-end pe-3">
                                                    <div className="d-inline-flex gap-1">
                                                        <button
                                                            onClick={() => abrirModalEditar(cat)}
                                                            className="btn btn-light btn-sm border text-secondary rounded-2 px-2 py-1"
                                                            title="Editar categoría"
                                                        >
                                                            <i className="fa-regular fa-pen-to-square"></i>
                                                        </button>
                                                        <button
                                                            onClick={() => handleEliminarCategoria(cat)}
                                                            className="btn btn-light btn-sm border text-danger rounded-2 px-2 py-1"
                                                            title="Eliminar categoría"
                                                        >
                                                            <i className="fa-regular fa-trash-can"></i>
                                                        </button>
                                                    </div>
                                                </td>
                                            )}
                                        </tr>
                                    ))
                                )}
                            </tbody>
                    </table>
                </div>

            </div>

            {/* MODAL CREAR / EDITAR CATEGORÍA */}
            {mostrarModal && esAdminOSuper && (
                <div className="modal d-block backdrop-blur" style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1050 }}>
                    <div className="modal-dialog modal-dialog-centered" style={{ maxWidth: '420px' }}>
                        <div className="modal-content rounded-4 border-0 shadow p-2">
                            <div className="modal-header border-bottom-0 pb-0">
                                <h5 className="modal-title fw-bold text-dark fs-5">
                                    {editando ? 'Modificar Categoría' : 'Nueva Categoría'}
                                </h5>
                                <button type="button" className="btn-close" onClick={() => setMostrarModal(false)}></button>
                            </div>

                            <form onSubmit={handleSubmitCategoria} className="modal-body pt-3">
                                <div className="mb-3">
                                    <label className="form-label small fw-semibold text-secondary mb-1">Nombre de la Categoría *</label>
                                    <input
                                        type="text"
                                        className="form-control rounded-3 py-2 px-3 border-light-subtle bg-light"
                                        placeholder="Ej: Ventas de mostrador / Pago de luz"
                                        value={nombre}
                                        onChange={(e) => setNombre(e.target.value)}
                                        required
                                    />
                                </div>

                                <div className="mb-3">
                                    <label className="form-label small fw-semibold text-secondary mb-1">Caja Perteneciente *</label>
                                    <select
                                        className="form-select rounded-3 py-2 border-light-subtle bg-light fw-semibold"
                                        value={cajaId}
                                        onChange={(e) => setCajaId(e.target.value)}
                                        required
                                    >
                                        <option value="">-- Seleccionar Caja --</option>
                                        {cajas.map(c => (
                                            <option key={c.id} value={c.id}>{c.nombre}</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="mb-4">
                                    <label className="form-label small fw-semibold text-secondary mb-1">Tipo de Categoría *</label>
                                    <select
                                        className="form-select rounded-3 py-2 border-light-subtle bg-light fw-semibold"
                                        value={tipo}
                                        onChange={(e) => setTipo(e.target.value)}
                                        required
                                    >
                                        <option value="INGRESO">INGRESO</option>
                                        <option value="EGRESO">EGRESO</option>
                                    </select>
                                </div>

                                <div className="border-top pt-3 d-flex gap-2 justify-content-end">
                                    <button type="button" className="btn btn-light rounded-3 px-4 fw-semibold text-secondary" onClick={() => setMostrarModal(false)}>
                                        Cancelar
                                    </button>
                                    <button type="submit" className="btn text-white rounded-3 px-4 fw-semibold" style={{ backgroundColor: '#4f46e5', border: 'none' }}>
                                        {editando ? 'Guardar cambios' : 'Crear categoría'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default Categorias;