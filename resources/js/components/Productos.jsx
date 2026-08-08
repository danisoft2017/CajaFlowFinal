import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Swal from 'sweetalert2';
// 1. IMPORTAR DATATABLE
import DataTable from 'react-data-table-component';

function Productos() {
    const [productos, setProductos] = useState([]);
    const [almacenes, setAlmacenes] = useState([]);
    const [cargando, setCargando] = useState(true);
    const [buscarText, setBuscarText] = useState('');
    const [almacenFiltroId, setAlmacenFiltroId] = useState('TODOS'); // 'TODOS' o ID del almacén

    // Modal Productos
    const [mostrarModalProd, setMostrarModalProd] = useState(false);
    const [editandoProd, setEditandoProd] = useState(false);
    const [prodId, setProdId] = useState(null);
    const [descripcion, setDescripcion] = useState('');
    const [precio, setPrecio] = useState('');
    const [almacenId, setAlmacenId] = useState('');

    // Modal Almacenes
    const [mostrarModalAlmacen, setMostrarModalAlmacen] = useState(false);
    const [nuevoAlmacenNombre, setNuevoAlmacenNombre] = useState('');
    const [almacenEditandoId, setAlmacenEditandoId] = useState(null);
    const [almacenEditandoNombre, setAlmacenEditandoNombre] = useState('');

    useEffect(() => {
        cargarDatos();
    }, []);

    const cargarDatos = async () => {
        try {
            const token = localStorage.getItem('token');
            const config = { headers: { Authorization: `Bearer ${token}` } };

            const [resProd, resAlm] = await Promise.all([
                axios.get('/api/productos', config),
                axios.get('/api/almacens', config)
            ]);

            setProductos(Array.isArray(resProd.data) ? resProd.data : []);
            setAlmacenes(Array.isArray(resAlm.data) ? resAlm.data : []);
        } catch (error) {
            console.error("Error al cargar datos", error);
        } finally {
            setCargando(false);
        }
    };

    // --- PRODUCTOS ---
    const limpiarFormProd = () => {
        setEditandoProd(false);
        setProdId(null);
        setDescripcion('');
        setPrecio('');
        setAlmacenId(almacenes.length > 0 ? almacenes[0].id : '');
    };

    const abrirModalNuevoProd = (idAlmacenPreseleccionado = null) => {
        limpiarFormProd();
        if (idAlmacenPreseleccionado) {
            setAlmacenId(idAlmacenPreseleccionado);
        }
        setMostrarModalProd(true);
    };

    const abrirModalEditarProd = (prod) => {
        setEditandoProd(true);
        setProdId(prod.id);
        setDescripcion(prod.descripcion || '');
        setPrecio(prod.precio || '');
        setAlmacenId(prod.almacen_id || (prod.almacen ? prod.almacen.id : ''));
        setMostrarModalProd(true);
    };

    const handleSubmitProducto = async (e) => {
        e.preventDefault();
        if (!descripcion.trim() || !precio) {
            Swal.fire('Atención', 'Ingrese descripción y precio.', 'warning');
            return;
        }

        try {
            const token = localStorage.getItem('token');
            const payload = {
                descripcion,
                precio: parseFloat(precio),
                almacen_id: almacenId || null
            };

            if (editandoProd) {
                await axios.put(`/api/productos/${prodId}`, payload, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                Swal.fire('¡Actualizado!', 'Producto modificado.', 'success');
            } else {
                await axios.post('/api/productos', payload, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                Swal.fire('¡Guardado!', 'Nuevo producto registrado.', 'success');
            }

            setMostrarModalProd(false);
            limpiarFormProd();
            cargarDatos();
        } catch (error) {
            Swal.fire('Error', error.response?.data?.message || 'Error al procesar el producto.', 'error');
        }
    };

    const handleEliminarProducto = (id, nombreProd) => {
        Swal.fire({
            title: `¿Eliminar "${nombreProd}"?`,
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
                    await axios.delete(`/api/productos/${id}`, {
                        headers: { Authorization: `Bearer ${token}` }
                    });
                    Swal.fire('¡Eliminado!', 'El producto ha sido borrado.', 'success');
                    cargarDatos();
                } catch (error) {
                    Swal.fire('Error', error.response?.data?.message || 'No se pudo eliminar.', 'error');
                }
            }
        });
    };

    // --- ALMACENES ---
    const handleCrearAlmacen = async (e) => {
        e.preventDefault();
        if (!nuevoAlmacenNombre.trim()) return;

        try {
            const token = localStorage.getItem('token');
            // Se envía tanto 'descripcion' como 'nombre' para compatibilidad total con Laravel
            await axios.post('/api/almacens', { 
                descripcion: nuevoAlmacenNombre,
                nombre: nuevoAlmacenNombre 
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setNuevoAlmacenNombre('');
            Swal.fire('¡Almacén Creado!', '', 'success');
            cargarDatos();
        } catch (error) {
            Swal.fire('Error', error.response?.data?.message || 'No se pudo crear el almacén.', 'error');
        }
    };

    const handleGuardarEditAlmacen = async (id) => {
        if (!almacenEditandoNombre.trim()) return;

        try {
            const token = localStorage.getItem('token');
            await axios.put(`/api/almacens/${id}`, { 
                descripcion: almacenEditandoNombre,
                nombre: almacenEditandoNombre 
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setAlmacenEditandoId(null);
            cargarDatos();
        } catch (error) {
            Swal.fire('Error', error.response?.data?.message || 'No se pudo modificar el almacén.', 'error');
        }
    };

    // FILTRADO COMBINADO POR ALMACÉN Y BÚSQUEDA
    const productosFiltrados = productos.filter(p => {
        const term = buscarText.toLowerCase();
        const descMatch = p.descripcion?.toLowerCase().includes(term);

        // Filtro por Almacén Seleccionado
        const perteneceAlmacen = (almacenFiltroId === 'TODOS') 
            ? true 
            : (almacenFiltroId === 'SIN_ALMACEN' 
                ? (!p.almacen_id && !p.almacen) 
                : (p.almacen_id == almacenFiltroId || (p.almacen && p.almacen.id == almacenFiltroId)));

        return descMatch && perteneceAlmacen;
    });

    // 2. ESTRUCTURA DE COLUMNAS PARA DATATABLE
    const columnasDataTable = [
        {
            name: 'ID',
            selector: row => row.id,
            sortable: true,
            width: '80px'
        },
        {
            name: 'Descripción',
            selector: row => row.descripcion,
            sortable: true,
            grow: 2,
            cell: row => (
                <div className="d-flex align-items-center gap-2.5 py-1">
                    <div 
                        className="rounded-circle d-flex align-items-center justify-content-center flex-shrink-0"
                        style={{ width: '36px', height: '36px', backgroundColor: '#e0e7ff', color: '#4f46e5' }}
                    >
                        <i className="fa-solid fa-box fs-6"></i>
                    </div>
                    <span className="fw-bold text-dark fs-6">{row.descripcion}</span>
                </div>
            )
        },
        {
            name: 'Precio Unitario',
            selector: row => parseFloat(row.precio || 0),
            sortable: true,
            cell: row => (
                <span className="fw-bold text-success fs-6">
                    S/ {parseFloat(row.precio || 0).toFixed(2)}
                </span>
            )
        },
        {
            name: 'Almacén Asignado',
            selector: row => row.almacen ? (row.almacen.nombre || row.almacen.descripcion) : '',
            sortable: true,
            cell: row => (
                <span className="badge bg-light text-dark border px-2.5 py-1.5 rounded-pill fw-semibold">
                    <i className="fa-solid fa-warehouse text-muted me-1"></i>
                    {row.almacen 
                        ? (row.almacen.nombre || row.almacen.descripcion || 'Almacén sin nombre') 
                        : 'Sin Almacén'}
                </span>
            )
        },
        {
            name: 'Acciones',
            right: true,
            width: '130px',
            cell: row => (
                <div className="btn-group btn-group-sm">
                    <button 
                        onClick={() => abrirModalEditarProd(row)}
                        className="btn btn-light border text-secondary me-1 rounded-2"
                        title="Editar producto"
                    >
                        <i className="fa-regular fa-pen-to-square"></i>
                    </button>
                    <button 
                        onClick={() => handleEliminarProducto(row.id, row.descripcion)}
                        className="btn btn-light border text-danger rounded-2"
                        title="Eliminar producto"
                    >
                        <i className="fa-regular fa-trash-can"></i>
                    </button>
                </div>
            )
        }
    ];

    // TRADUCCIÓN AL ESPAÑOL PARA LA PAGINACIÓN
    const opcionesPaginacion = {
        rowsPerPageText: 'Filas por página:',
        rangeSeparatorText: 'de',
        selectAllRowsItem: true,
        selectAllRowsItemText: 'Todos'
    };

    if (cargando) {
        return (
            <div className="text-center py-5">
                <div className="spinner-border text-primary" role="status"></div>
                <p className="text-muted small mt-2">Cargando catálogo de productos y almacenes...</p>
            </div>
        );
    }

    return (
        <div className="container">
            
            {/* TARJETAS DE CONTENIDO POR ALMACÉN */}
            <div className="d-flex justify-content-between align-items-center mb-3">
                <h6 className="fw-bold text-dark m-0">Contenido de Almacenes</h6>
                <button 
                    onClick={() => setMostrarModalAlmacen(true)}
                    className="btn btn-sm btn-light border text-primary fw-semibold rounded-3 d-flex align-items-center gap-1"
                >
                    <i className="fa-solid fa-gear"></i> Administrar Almacenes
                </button>
            </div>

            <div className="row g-3 mb-4">
                {/* OPCIÓN 'TODOS' */}
                <div className="col-12 col-sm-6 col-md-3">
                    <div 
                        onClick={() => setAlmacenFiltroId('TODOS')}
                        className={`card border-0 shadow-sm rounded-4 p-3 cursor-pointer transition-all ${
                            almacenFiltroId === 'TODOS' ? 'border border-2 border-primary bg-primary-subtle' : 'bg-white'
                        }`}
                        style={{ cursor: 'pointer' }}
                    >
                        <div className="d-flex justify-content-between align-items-center">
                            <div>
                                <span className="text-muted extra-small fw-bold d-block text-uppercase">Visión Global</span>
                                <h6 className="fw-bold text-dark mb-0">Todos los Almacenes</h6>
                            </div>
                            <div className="rounded-circle p-2 bg-primary text-white d-flex align-items-center justify-content-center" style={{ width: '36px', height: '36px' }}>
                                <i className="fa-solid fa-boxes-stacked fs-6"></i>
                            </div>
                        </div>
                        <div className="mt-3 d-flex justify-content-between align-items-center extra-small">
                            <span className="fw-semibold text-muted">{productos.length} productos totales</span>
                            <span className="badge bg-primary rounded-pill">Ver todos</span>
                        </div>
                    </div>
                </div>

                {/* TARJETA POR CADA ALMACÉN */}
                {almacenes.map((alm) => {
                    const nombreAlm = alm.nombre || alm.descripcion || `Almacén ${alm.id}`;
                    const prodsEnAlmacen = productos.filter(p => p.almacen_id == alm.id || (p.almacen && p.almacen.id == alm.id));
                    const totalValorAlm = prodsEnAlmacen.reduce((acc, p) => acc + parseFloat(p.precio || 0), 0);
                    const esSeleccionado = almacenFiltroId == alm.id;

                    return (
                        <div key={alm.id} className="col-12 col-sm-6 col-md-3">
                            <div 
                                onClick={() => setAlmacenFiltroId(alm.id)}
                                className={`card border-0 shadow-sm rounded-4 p-3 transition-all h-100 ${
                                    esSeleccionado ? 'border border-2 border-primary bg-indigo-subtle shadow' : 'bg-white'
                                }`}
                                style={{ cursor: 'pointer' }}
                            >
                                <div className="d-flex justify-content-between align-items-center mb-2">
                                    <div className="overflow-hidden">
                                        <span className="text-muted extra-small fw-bold d-block text-uppercase">Almacén</span>
                                        <h6 className="fw-bold text-dark mb-0 text-truncate">{nombreAlm}</h6>
                                    </div>
                                    <div className="rounded-circle p-2 d-flex align-items-center justify-content-center flex-shrink-0" style={{ width: '36px', height: '36px', backgroundColor: '#e0e7ff', color: '#4f46e5' }}>
                                        <i className="fa-solid fa-warehouse fs-6"></i>
                                    </div>
                                </div>
                                
                                <div className="mt-2 pt-2 border-top d-flex justify-content-between align-items-center extra-small">
                                    <span className="fw-bold text-dark">{prodsEnAlmacen.length} ítems</span>
                                    <span className="text-success fw-bold">S/ {totalValorAlm.toFixed(2)}</span>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* BÚSQUEDA Y BOTÓN NUEVO PRODUCTO */}
            <div className="card border-0 shadow-sm rounded-4 p-3 mb-4 bg-white">
                <div className="row g-3 align-items-center justify-content-between">
                    <div className="col-12 col-md-5">
                        <div className="input-group input-group-sm">
                            <span className="input-group-text bg-light border-0 text-muted ps-3">
                                <i className="fa-solid fa-magnifying-glass"></i>
                            </span>
                            <input 
                                type="text" 
                                className="form-control form-control-sm bg-light border-0 ps-2 py-2 rounded-end-3" 
                                placeholder="Buscar en la lista filtrada..." 
                                value={buscarText} 
                                onChange={(e) => setBuscarText(e.target.value)} 
                            />
                        </div>
                    </div>

                    <div className="col-12 col-md-7 text-md-end d-flex gap-2 justify-content-md-end">
                        <button 
                            onClick={() => abrirModalNuevoProd(almacenFiltroId !== 'TODOS' ? almacenFiltroId : null)}
                            className="btn text-white fw-semibold px-3 py-2 rounded-3 shadow-sm d-inline-flex align-items-center gap-2"
                            style={{ backgroundColor: '#4f46e5', border: 'none' }}
                        >
                            <i className="fa-solid fa-plus fs-6"></i>
                            <span>Nuevo producto</span>
                        </button>
                    </div>
                </div>
            </div>

            {/* 3. REEMPLAZO DE LA TABLA HTML POR DATATABLE */}
            <div className="card border-0 shadow-sm rounded-4 p-4 bg-white">
                <div className="d-flex justify-content-between align-items-center mb-3">
                    <h6 className="fw-bold text-dark m-0">
                        Ítems en: {almacenFiltroId === 'TODOS' ? 'Todos los Almacenes' : (almacenes.find(a => a.id == almacenFiltroId)?.nombre || 'Almacén')}
                    </h6>
                    <span className="badge bg-light text-secondary rounded-pill px-3 py-1.5 fw-semibold border">
                        {productosFiltrados.length} registros
                    </span>
                </div>

                <DataTable
                    columns={columnasDataTable}
                    data={productosFiltrados}
                    pagination
                    paginationPerPage={10}
                    paginationRowsPerPageOptions={[5, 10, 15, 20]}
                    paginationComponentOptions={opcionesPaginacion}
                    noDataComponent={<div className="py-4 text-muted text-center">No hay productos registrados en esta selección.</div>}
                    highlightOnHover
                    responsive
                />
            </div>

            {/* MODAL CREAR / EDITAR PRODUCTO */}
            {mostrarModalProd && (
                <div className="modal d-block backdrop-blur" style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1050 }}>
                    <div className="modal-dialog modal-dialog-centered" style={{ maxWidth: '480px' }}>
                        <div className="modal-content rounded-4 border-0 shadow p-2">
                            
                            <div className="modal-header border-bottom-0 pb-0">
                                <h5 className="modal-title fw-bold text-dark fs-5">
                                    {editandoProd ? 'Modificar producto' : 'Nuevo producto'}
                                </h5>
                                <button 
                                    type="button" 
                                    className="btn-close" 
                                    onClick={() => setMostrarModalProd(false)}
                                ></button>
                            </div>

                            <form onSubmit={handleSubmitProducto} className="modal-body pt-3">
                                
                                <div className="mb-3">
                                    <label className="form-label small fw-semibold text-secondary mb-1">
                                        Descripción del producto *
                                    </label>
                                    <input 
                                        type="text" 
                                        className="form-control rounded-3 py-2 px-3 border-light-subtle bg-light"
                                        placeholder="Ej: Cerveza Pilsen 620ml"
                                        value={descripcion}
                                        onChange={(e) => setDescripcion(e.target.value)}
                                        required
                                        style={{ boxShadow: 'none' }}
                                    />
                                </div>

                                <div className="row g-2 mb-4">
                                    <div className="col-6">
                                        <label className="form-label small fw-semibold text-secondary mb-1">
                                            Precio Unitario (S/) *
                                        </label>
                                        <input 
                                            type="number" 
                                            step="0.01"
                                            className="form-control rounded-3 py-2 px-3 border-light-subtle bg-light"
                                            placeholder="0.00"
                                            value={precio}
                                            onChange={(e) => setPrecio(e.target.value)}
                                            required
                                            style={{ boxShadow: 'none' }}
                                        />
                                    </div>

                                    <div className="col-6">
                                        <label className="form-label small fw-semibold text-secondary mb-1">
                                            Almacén asignado
                                        </label>
                                        <select 
                                            className="form-select rounded-3 py-2 border-light-subtle bg-light text-dark"
                                            value={almacenId}
                                            onChange={(e) => setAlmacenId(e.target.value)}
                                        >
                                            <option value="">-- Sin Almacén --</option>
                                            {almacenes.map(alm => {
                                                const nombreMostrar = alm.nombre || alm.descripcion || `Almacén #${alm.id}`;
                                                return (
                                                    <option key={alm.id} value={alm.id}>
                                                        {nombreMostrar}
                                                    </option>
                                                );
                                            })}
                                        </select>
                                    </div>
                                </div>

                                <div className="border-top pt-3 d-flex gap-2 justify-content-end">
                                    <button 
                                        type="button" 
                                        className="btn btn-light rounded-3 px-4 fw-semibold text-secondary"
                                        onClick={() => setMostrarModalProd(false)}
                                    >
                                        Cancelar
                                    </button>
                                    <button 
                                        type="submit" 
                                        className="btn text-white rounded-3 px-4 fw-semibold"
                                        style={{ backgroundColor: '#4f46e5', border: 'none' }}
                                    >
                                        {editandoProd ? 'Guardar cambios' : 'Guardar producto'}
                                    </button>
                                </div>

                            </form>
                        </div>
                    </div>
                </div>
            )}

            {/* MODAL DE GESTIÓN DE ALMACENES */}
            {mostrarModalAlmacen && (
                <div className="modal d-block backdrop-blur" style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1050 }}>
                    <div className="modal-dialog modal-dialog-centered" style={{ maxWidth: '460px' }}>
                        <div className="modal-content rounded-4 border-0 shadow p-2">
                            
                            <div className="modal-header border-bottom-0 pb-0">
                                <h5 className="modal-title fw-bold text-dark fs-5">
                                    Gestión de almacenes
                                </h5>
                                <button 
                                    type="button" 
                                    className="btn-close" 
                                    onClick={() => setMostrarModalAlmacen(false)}
                                ></button>
                            </div>

                            <div className="modal-body pt-3">
                                
                                <form onSubmit={handleCrearAlmacen} className="mb-4 bg-light p-3 rounded-3 border">
                                    <label className="form-label small fw-semibold text-secondary mb-1">Nuevo almacén</label>
                                    <div className="input-group">
                                        <input 
                                            type="text" 
                                            className="form-control rounded-start-3 py-2 px-3 border-light-subtle bg-white"
                                            placeholder="Ej: Almacén Principal"
                                            value={nuevoAlmacenNombre}
                                            onChange={(e) => setNuevoAlmacenNombre(e.target.value)}
                                            style={{ boxShadow: 'none' }}
                                        />
                                        <button 
                                            type="submit" 
                                            className="btn text-white rounded-end-3 px-3 fw-semibold"
                                            style={{ backgroundColor: '#4f46e5', border: 'none' }}
                                        >
                                            Agregar
                                        </button>
                                    </div>
                                </form>

                                <h6 className="fw-bold text-dark small mb-2">Almacenes existentes:</h6>

                                {/* DENTRO DEL MODAL DE GESTIÓN DE ALMACENES */}
                                    <div className="d-flex flex-column gap-2 overflow-auto" style={{ maxHeight: '220px' }}>
                                        {almacenes.length === 0 ? (
                                            <p className="text-muted extra-small my-2 text-center">No hay almacenes creados.</p>
                                        ) : (
                                            almacenes.map(alm => {
                                                // Nombre real proveniente del Backend (soporta descripcion, nombre o fallback)
                                                const nombreMostrar = alm.descripcion || alm.nombre || alm.nombre_almacen || `Almacén #${alm.id}`;

                                                return (
                                                    <div key={alm.id} className="p-2.5 rounded-3 border bg-white d-flex align-items-center justify-content-between">
                                                        {almacenEditandoId === alm.id ? (
                                                            <div className="input-group input-group-sm w-100">
                                                                <input 
                                                                    type="text" 
                                                                    className="form-control"
                                                                    value={almacenEditandoNombre}
                                                                    onChange={(e) => setAlmacenEditandoNombre(e.target.value)}
                                                                />
                                                                <button 
                                                                    onClick={() => handleGuardarEditAlmacen(alm.id)}
                                                                    className="btn btn-success"
                                                                >
                                                                    <i className="fa-solid fa-check"></i>
                                                                </button>
                                                                <button 
                                                                    onClick={() => setAlmacenEditandoId(null)}
                                                                    className="btn btn-light"
                                                                >
                                                                    <i className="fa-solid fa-xmark"></i>
                                                                </button>
                                                            </div>
                                                        ) : (
                                                            <>
                                                                <div className="d-flex align-items-center gap-2">
                                                                    <i className="fa-solid fa-warehouse text-muted"></i>
                                                                    {/* AHORA SÍ MUESTRA EL NOMBRE REAL */}
                                                                    <span className="fw-semibold text-dark small">{nombreMostrar}</span>
                                                                </div>
                                                                <button 
                                                                    onClick={() => {
                                                                        setAlmacenEditandoId(alm.id);
                                                                        setAlmacenEditandoNombre(nombreMostrar);
                                                                    }}
                                                                    className="btn btn-light btn-sm border text-secondary px-2 py-1 rounded-2"
                                                                >
                                                                    <i className="fa-regular fa-pen-to-square me-1"></i> Editar
                                                                </button>
                                                            </>
                                                        )}
                                                    </div>
                                                );
                                            })
                                        )}
                                    </div>

                                <div className="border-top pt-3 mt-3 text-end">
                                    <button 
                                        type="button" 
                                        className="btn btn-secondary rounded-3 px-4 fw-semibold"
                                        onClick={() => setMostrarModalAlmacen(false)}
                                    >
                                        Cerrar
                                    </button>
                                </div>

                            </div>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
}

export default Productos;