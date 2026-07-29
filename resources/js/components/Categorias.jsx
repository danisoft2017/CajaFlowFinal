import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Swal from 'sweetalert2';

function Categorias() {
    const [categorias, setCategorias] = useState([]);
    const [cargando, setCargando] = useState(true);
    const [buscarText, setBuscarText] = useState('');

    // Estados para Modal Crear / Editar
    const [mostrarModal, setMostrarModal] = useState(false);
    const [editando, setEditando] = useState(false);
    const [categoriaId, setCategoriaId] = useState(null);
    const [nombre, setNombre] = useState('');
    const [tipo, setTipo] = useState('Ingreso'); // 'Ingreso' o 'Egreso'

    useEffect(() => {
        cargarCategorias();
    }, []);

    const cargarCategorias = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get('/api/categorias', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setCategorias(Array.isArray(res.data) ? res.data : []);
        } catch (error) {
            console.error("Error al obtener las categorías", error);
        } finally {
            setCargando(false);
        }
    };

    const abrirModalNuevo = () => {
        setEditando(false);
        setCategoriaId(null);
        setNombre('');
        setTipo('Ingreso');
        setMostrarModal(true);
    };

    const abrirModalEditar = (cat) => {
        setEditando(true);
        setCategoriaId(cat.id);
        setNombre(cat.nombre);
        setTipo(cat.tipo || 'Ingreso');
        setMostrarModal(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!nombre.trim()) {
            Swal.fire('Atención', 'Ingrese el nombre de la categoría.', 'warning');
            return;
        }

        try {
            const token = localStorage.getItem('token');
            const payload = { nombre, tipo };

            if (editando) {
                await axios.put(`/api/categorias/${categoriaId}`, payload, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                Swal.fire('¡Actualizada!', 'Categoría modificada con éxito.', 'success');
            } else {
                await axios.post('/api/categorias', payload, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                Swal.fire('¡Creada!', 'Nueva categoría registrada.', 'success');
            }

            setMostrarModal(false);
            cargarCategorias();
        } catch (error) {
            Swal.fire('Error', error.response?.data?.message || 'Error al procesar la categoría.', 'error');
        }
    };

    const handleEliminar = (id, nombreCat) => {
        Swal.fire({
            title: `¿Eliminar "${nombreCat}"?`,
            text: "Esta acción no se podrá deshacer si la categoría no tiene movimientos asociados.",
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
                    await axios.delete(`/api/categorias/${id}`, {
                        headers: { Authorization: `Bearer ${token}` }
                    });
                    Swal.fire('¡Eliminada!', 'La categoría ha sido removida.', 'success');
                    cargarCategorias();
                } catch (error) {
                    Swal.fire('Error', error.response?.data?.message || 'No se puede eliminar la categoría.', 'error');
                }
            }
        });
    };

    // Filtros locales
    const categoriasFiltradas = categorias.filter(cat => 
        cat.nombre.toLowerCase().includes(buscarText.toLowerCase())
    );

    const totalIngresosCount = categorias.filter(c => c.tipo === 'Ingreso').length;
    const totalEgresosCount = categorias.filter(c => c.tipo === 'Egreso').length;

    if (cargando) {
        return (
            <div className="text-center py-5">
                <div className="spinner-border text-primary" role="status"></div>
                <p className="text-muted small mt-2">Cargando catálogo de categorías...</p>
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
                            <div className="d-flex justify-content-between align-items-center mb-1">
                                <span className="text-muted small fw-semibold">Total categorías</span>
                                <div className="rounded-circle p-2 d-flex align-items-center justify-content-center" style={{ width: '36px', height: '36px', backgroundColor: '#e0e7ff', color: '#4f46e5' }}>
                                    <i className="fa-solid fa-tags"></i>
                                </div>
                            </div>
                            <h3 className="fw-bold text-dark mb-0">{categorias.length}</h3>
                        </div>
                    </div>

                    <div className="col-12 col-md-4">
                        <div className="card border-0 shadow-sm rounded-4 p-3 bg-white h-100">
                            <div className="d-flex justify-content-between align-items-center mb-1">
                                <span className="text-muted small fw-semibold">Categorías de Ingreso</span>
                                <div className="rounded-circle p-2 text-success d-flex align-items-center justify-content-center" style={{ width: '36px', height: '36px', backgroundColor: '#d1fae5' }}>
                                    <i className="fa-solid fa-arrow-trend-up"></i>
                                </div>
                            </div>
                            <h3 className="fw-bold text-success mb-0">{totalIngresosCount}</h3>
                        </div>
                    </div>

                    <div className="col-12 col-md-4">
                        <div className="card border-0 shadow-sm rounded-4 p-3 bg-white h-100">
                            <div className="d-flex justify-content-between align-items-center mb-1">
                                <span className="text-muted small fw-semibold">Categorías de Egreso</span>
                                <div className="rounded-circle p-2 text-danger d-flex align-items-center justify-content-center" style={{ width: '36px', height: '36px', backgroundColor: '#fee2e2' }}>
                                    <i className="fa-solid fa-arrow-trend-down"></i>
                                </div>
                            </div>
                            <h3 className="fw-bold text-danger mb-0">{totalEgresosCount}</h3>
                        </div>
                    </div>
                </div>

                {/* BARRA SUPERIOR DE BÚSQUEDA Y BOTÓN NUEVA */}
                <div className="card border-0 shadow-sm rounded-4 p-3 mb-4 bg-white">
                    <div className="row g-3 align-items-center justify-content-between">
                        <div className="col-12 col-md-6">
                            <div className="input-group input-group-sm">
                                <span className="input-group-text bg-light border-0 text-muted ps-3">
                                    <i className="fa-solid fa-magnifying-glass"></i>
                                </span>
                                <input 
                                    type="text" 
                                    className="form-control form-control-sm bg-light border-0 ps-2 py-2 rounded-end-3" 
                                    placeholder="Buscar categoría por nombre..." 
                                    value={buscarText} 
                                    onChange={(e) => setBuscarText(e.target.value)} 
                                />
                            </div>
                        </div>

                        <div className="col-12 col-md-4 text-md-end">
                            <button 
                                onClick={abrirModalNuevo}
                                className="btn text-white fw-semibold px-3 py-2 rounded-3 shadow-sm d-inline-flex align-items-center gap-2"
                                style={{ backgroundColor: '#4f46e5', border: 'none' }}
                            >
                                <i className="fa-solid fa-plus fs-6"></i>
                                <span>Nueva categoría</span>
                            </button>
                        </div>
                    </div>
                </div>

                {/* TABLA ESTILIZADA DE CATEGORÍAS */}
                <div className="card border-0 shadow-sm rounded-4 p-4 bg-white">
                    <h6 className="fw-bold text-dark mb-3">Listado de Categorías</h6>

                    <div className="table-responsive">
                        <table className="table table-hover align-middle mb-0">
                            <thead className="table-light text-muted small fw-bold">
                                <tr>
                                    <th style={{ width: '60px' }}>#</th>
                                    <th>Nombre de Categoría</th>
                                    <th>Tipo Operativo</th>
                                    <th className="text-end pe-3" style={{ width: '120px' }}>Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="small">
                                {categoriasFiltradas.length === 0 ? (
                                    <tr>
                                        <td colSpan="4" className="text-center text-muted py-4">
                                            No se encontraron categorías registradas.
                                        </td>
                                    </tr>
                                ) : (
                                    categoriasFiltradas.map((cat, index) => {
                                        const esIngreso = cat.tipo === 'Ingreso';
                                        return (
                                            <tr key={cat.id}>
                                                <td className="text-muted fw-semibold">{index + 1}</td>
                                                <td>
                                                    <div className="d-flex align-items-center gap-2.5">
                                                        <div 
                                                            className="rounded-circle d-flex align-items-center justify-content-center flex-shrink-0"
                                                            style={{ 
                                                                width: '36px', 
                                                                height: '36px', 
                                                                backgroundColor: esIngreso ? '#d1fae5' : '#fee2e2',
                                                                color: esIngreso ? '#10b981' : '#ef4444'
                                                            }}
                                                        >
                                                            <i className={`fa-solid ${esIngreso ? 'fa-tag' : 'fa-tags'}`}></i>
                                                        </div>
                                                        <span className="fw-bold text-dark fs-6">{cat.nombre}</span>
                                                    </div>
                                                </td>
                                                <td>
                                                    <span className={`badge rounded-pill px-3 py-1.5 fw-semibold ${
                                                        esIngreso ? 'bg-success-subtle text-success' : 'bg-danger-subtle text-danger'
                                                    }`}>
                                                        <i className={`fa-solid ${esIngreso ? 'fa-arrow-up' : 'fa-arrow-down'} me-1`}></i>
                                                        {cat.tipo || 'Ingreso'}
                                                    </span>
                                                </td>
                                                <td className="text-end pe-3">
                                                    <div className="btn-group btn-group-sm">
                                                        <button 
                                                            onClick={() => abrirModalEditar(cat)}
                                                            className="btn btn-light border text-secondary me-1 rounded-2"
                                                            title="Editar categoría"
                                                        >
                                                            <i className="fa-regular fa-pen-to-square"></i>
                                                        </button>
                                                        <button 
                                                            onClick={() => handleEliminar(cat.id, cat.nombre)}
                                                            className="btn btn-light border text-danger rounded-2"
                                                            title="Eliminar categoría"
                                                        >
                                                            <i className="fa-regular fa-trash-can"></i>
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* MODAL CREAR / EDITAR CATEGORÍA */}
                {mostrarModal && (
                    <div className="modal d-block backdrop-blur" style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1050 }}>
                        <div className="modal-dialog modal-dialog-centered" style={{ maxWidth: '440px' }}>
                            <div className="modal-content rounded-4 border-0 shadow p-2">
                                
                                <div className="modal-header border-bottom-0 pb-0">
                                    <h5 className="modal-title fw-bold text-dark fs-5">
                                        {editando ? 'Modificar categoría' : 'Nueva categoría'}
                                    </h5>
                                    <button 
                                        type="button" 
                                        className="btn-close" 
                                        onClick={() => setMostrarModal(false)}
                                    ></button>
                                </div>

                                <form onSubmit={handleSubmit} className="modal-body pt-3">
                                    
                                    {/* Input Nombre */}
                                    <div className="mb-3">
                                        <label className="form-label small fw-semibold text-secondary mb-1">
                                            Nombre de la categoría *
                                        </label>
                                        <input 
                                            type="text" 
                                            className="form-control rounded-3 py-2 px-3 border-light-subtle bg-light"
                                            placeholder="Ej: Ventas al contado / Servicios de luz"
                                            value={nombre}
                                            onChange={(e) => setNombre(e.target.value)}
                                            required
                                            style={{ boxShadow: 'none' }}
                                        />
                                    </div>

                                    {/* Selector de Tipo (Ingreso / Egreso) */}
                                    <div className="mb-4">
                                        <label className="form-label small fw-semibold text-secondary mb-1">
                                            Tipo de operación
                                        </label>
                                        <div className="d-flex gap-2">
                                            <button
                                                type="button"
                                                onClick={() => setTipo('Ingreso')}
                                                className={`btn flex-fill py-2 rounded-3 fw-semibold d-flex align-items-center justify-content-center gap-2 border ${
                                                    tipo === 'Ingreso' ? 'btn-success text-white' : 'btn-light text-secondary'
                                                }`}
                                            >
                                                <i className="fa-solid fa-arrow-trend-up"></i> Ingreso
                                            </button>

                                            <button
                                                type="button"
                                                onClick={() => setTipo('Egreso')}
                                                className={`btn flex-fill py-2 rounded-3 fw-semibold d-flex align-items-center justify-content-center gap-2 border ${
                                                    tipo === 'Egreso' ? 'btn-danger text-white' : 'btn-light text-secondary'
                                                }`}
                                            >
                                                <i className="fa-solid fa-arrow-trend-down"></i> Egreso
                                            </button>
                                        </div>
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
                                            {editando ? 'Guardar cambios' : 'Crear categoría'}
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

export default Categorias;