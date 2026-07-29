import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Swal from 'sweetalert2';
import Select from 'react-select';

// Helper para dar formato en soles con separador de miles y 2 decimales (Ej: S/ 2,065.00)
const formatearSoles = (monto) => {
    const val = parseFloat(monto) || 0;
    return 'S/ ' + new Intl.NumberFormat('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }).format(val);
};

function Movimientos() {
    // Listas maestras
    const [cajas, setCajas] = useState([]);
    const [categorias, setCategorias] = useState([]);
    const [clientes, setClientes] = useState([]);
    const [almacenes, setAlmacenes] = useState([]);
    const [productos, setProductos] = useState([]);
    const [movimientos, setMovimientos] = useState([]);

    // Cargadores
    const [cargandoClientes, setCargandoClientes] = useState(false);
    const [cargandoAlmacenes, setCargandoAlmacenes] = useState(false);
    const [cargandoProductos, setCargandoProductos] = useState(false);
    const [cargandoCategorias, setCargandoCategorias] = useState(false);

    // Usuario logueado
    const usuarioLogueado = JSON.parse(localStorage.getItem('user'));

    // Filtros
    const [cajaActivaId, setCajaActivaId] = useState(null);
    const [buscarText, setBuscarText] = useState('');

    // Modales
    const [mostrarModal, setMostrarModal] = useState(false);
    const [editando, setEditando] = useState(false);
    const [movimientoId, setMovimientoId] = useState(null);

    const [mostrarModalMover, setMostrarModalMover] = useState(false);
    const [movimientoAMover, setMovimientoAMover] = useState(null);
    const [cajaDestinoId, setCajaDestinoId] = useState('');

    // Fecha / Hora Perú
    const obtenerFechaPeru = () => {
        const opciones = { timeZone: 'America/Lima', year: 'numeric', month: '2-digit', day: '2-digit' };
        const partes = new Intl.DateTimeFormat('es-PE', opciones).formatToParts(new Date());
        const d = partes.find(p => p.type === 'day').value;
        const m = partes.find(p => p.type === 'month').value;
        const a = partes.find(p => p.type === 'year').value;
        return `${a}-${m}-${d}`;
    };

    const obtenerHoraPeru = () => {
        const opciones = { timeZone: 'America/Lima', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false };
        return new Intl.DateTimeFormat('es-PE', opciones).format(new Date());
    };

    const fechaHoy = obtenerFechaPeru();

    // Campos del Modal
    const [fechaModal, setFechaModal] = useState(fechaHoy);
    const [horaModal, setHoraModal] = useState(obtenerHoraPeru());
    const [clienteId, setClienteId] = useState('');
    const [almacenId, setAlmacenId] = useState('');
    const [productoId, setProductoId] = useState('');
    const [precio, setPrecio] = useState('');
    const [cantidad, setCantidad] = useState(1);
    const [descripcion, setDescripcion] = useState('');
    const [observacion, setObservacion] = useState('');

    // TABLA DE DETALLE DE CATEGORÍAS
    const [detallesCategorias, setDetallesCategorias] = useState([]);
    const [catSeleccionadaId, setCatSeleccionadaId] = useState('');
    const [montoCatInput, setMontoCatInput] = useState('');

    useEffect(() => {
        cargarDatosIniciales();
    }, []);

    const cargarDatosIniciales = async () => {
        try {
            const token = localStorage.getItem('token');
            const config = { headers: { Authorization: `Bearer ${token}` } };

            const [resCajas, resCategorias, resClientes, resAlmacenes, resProductos] = await Promise.all([
                axios.get('/api/cajas?solo_activas=true', config),
                axios.get('/api/categorias', config),
                axios.get('/api/clientes', config),
                axios.get('/api/almacens', config),
                axios.get('/api/productos', config)
            ]);

            // Extraer de forma segura el arreglo de cajas
            const listaCajas = Array.isArray(resCajas.data) ? resCajas.data : (resCajas.data.cajas || []);

            setCajas(listaCajas);
            setCategorias(Array.isArray(resCategorias.data) ? resCategorias.data : []);
            setClientes(Array.isArray(resClientes.data) ? resClientes.data : []);
            setAlmacenes(Array.isArray(resAlmacenes.data) ? resAlmacenes.data : []);
            setProductos(Array.isArray(resProductos.data) ? resProductos.data : []);

            if (listaCajas.length > 0) {
                setCajaActivaId(listaCajas[0].id);
            }

            obtenerMovimientosHoy();
        } catch (error) {
            console.error("Error al cargar catálogos", error);
        }
    };

    // Refrescar desplegables
    const refrescarClientes = async () => {
        setCargandoClientes(true);
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get('/api/clientes', { headers: { Authorization: `Bearer ${token}` } });
            setClientes(Array.isArray(res.data) ? res.data : []);
        } catch (e) { console.error(e); } finally { setCargandoClientes(false); }
    };

    const refrescarAlmacenes = async () => {
        setCargandoAlmacenes(true);
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get('/api/almacens', { headers: { Authorization: `Bearer ${token}` } });
            setAlmacenes(Array.isArray(res.data) ? res.data : []);
        } catch (e) { console.error(e); } finally { setCargandoAlmacenes(false); }
    };

    const refrescarProductos = async () => {
        setCargandoProductos(true);
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get('/api/productos', { headers: { Authorization: `Bearer ${token}` } });
            setProductos(Array.isArray(res.data) ? res.data : []);
        } catch (e) { console.error(e); } finally { setCargandoProductos(false); }
    };

    const refrescarCategorias = async () => {
        setCargandoCategorias(true);
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get('/api/categorias', { headers: { Authorization: `Bearer ${token}` } });
            setCategorias(Array.isArray(res.data) ? res.data : []);
        } catch (e) { console.error(e); } finally { setCargandoCategorias(false); }
    };

    const obtenerMovimientosHoy = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get(`/api/movimientos?fecha=${fechaHoy}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setMovimientos(Array.isArray(res.data) ? res.data : []);
        } catch (error) {
            console.error("Error al cargar movimientos", error);
        }
    };

    // Mover Caja
    const abrirModalMover = (m) => {
        setMovimientoAMover(m);
        setCajaDestinoId('');
        setMostrarModalMover(true);
    };

    const handleConfirmarMoverCaja = async (e) => {
        e.preventDefault();
        if (!cajaDestinoId) {
            Swal.fire('Atención', 'Seleccione la caja de destino.', 'warning');
            return;
        }

        try {
            const token = localStorage.getItem('token');
            await axios.patch(`/api/movimientos/${movimientoAMover.id}/mover`, {
                caja_id: parseInt(cajaDestinoId)
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });

            setMostrarModalMover(false);
            setMovimientoAMover(null);
            setCajaDestinoId('');
            Swal.fire('¡Éxito!', 'Movimiento reasignado a la nueva caja.', 'success');
            obtenerMovimientosHoy();
        } catch (error) {
            Swal.fire('Error', error.response?.data?.message || 'Error al mover el registro.', 'error');
        }
    };

    // Selección de producto
    const handleSeleccionarProducto = (prodId) => {
        setProductoId(prodId);
        if (!prodId) {
            setPrecio('');
            return;
        }
        const prod = productos.find(p => p.id === parseInt(prodId));
        if (prod) {
            setPrecio(prod.precio);
            if (!descripcion) {
                setDescripcion(prod.descripcion);
            }
        }
    };

    const productosFiltradosModal = almacenId 
        ? productos.filter(p => p.almacen_id === parseInt(almacenId))
        : productos;

    const precioNum = parseFloat(precio) || 0;
    const cantNum = parseInt(cantidad) || 1;
    const importeCalculado = (precioNum * cantNum).toFixed(2);

    const opcionesClientes = clientes.map(c => ({
    value: c.id,
    label: `${c.num_documento} - ${c.razon}`
    }));
    // LÓGICA MULTI-CATEGORÍA CON VALORES NEGATIVOS
    const agregarCategoriaATabla = () => {
        if (!catSeleccionadaId) {
            Swal.fire('Atención', 'Seleccione una categoría.', 'warning');
            return;
        }

        const montoVal = parseFloat(montoCatInput);
        if (isNaN(montoVal) || montoVal === 0) {
            Swal.fire('Atención', 'Ingrese un importe válido diferente de cero (positivo para ingreso, negativo para egreso).', 'warning');
            return;
        }

        const catObj = categorias.find(c => c.id === parseInt(catSeleccionadaId));
        if (!catObj) return;

        setDetallesCategorias([...detallesCategorias, {
            categoria_id: catObj.id,
            nombre: catObj.nombre,
            tipo: catObj.tipo,
            importe: montoVal
        }]);

        setCatSeleccionadaId('');
        setMontoCatInput('');
    };

    const eliminarCategoriaDeTabla = (index) => {
        setDetallesCategorias(detallesCategorias.filter((_, i) => i !== index));
    };

    const sumaImportesCategorias = detallesCategorias.reduce((acc, curr) => acc + curr.importe, 0);

    const limpiarFormularioModal = () => {
        setEditando(false);
        setMovimientoId(null);
        setFechaModal(fechaHoy);
        setHoraModal(obtenerHoraPeru());
        setClienteId('');
        setAlmacenId('');
        setProductoId('');
        setPrecio('');
        setCantidad(1);
        setDescripcion('');
        setObservacion('');
        setDetallesCategorias([]);
        setCatSeleccionadaId('');
        setMontoCatInput('');
    };

    const activarEdicionMovimiento = (m) => {
        setEditando(true);
        setMovimientoId(m.id);
        setFechaModal(m.fecha);
        setHoraModal(m.hora);
        setClienteId(m.cliente_id || '');
        setAlmacenId(m.almacen_id || '');
        setProductoId(m.producto_id || '');
        setPrecio(m.precio || '');
        setCantidad(m.cantidad || 1);
        setDescripcion(m.descripcion || '');
        setObservacion(m.observacion || '');

        if (m.detalles && m.detalles.length > 0) {
            const arrDetalles = m.detalles.map(d => ({
                categoria_id: d.categoria_id,
                nombre: d.categoria?.nombre || 'Categoría',
                tipo: d.categoria?.tipo || 'Categoría',
                importe: parseFloat(d.importe)
            }));
            setDetallesCategorias(arrDetalles);
        } else {
            setDetallesCategorias([]);
        }

        setMostrarModal(true);
    };

    const handleSubmitMovimiento = async (e) => {
        e.preventDefault();

        if (!cajaActivaId) {
            Swal.fire('Atención', 'Seleccione una caja activa primero.', 'warning');
            return;
        }

        if (detallesCategorias.length === 0) {
            Swal.fire('Atención', 'Debe agregar al menos una categoría con su importe en la tabla.', 'warning');
            return;
        }

        const montoEsperado = precioNum !== 0 ? parseFloat(importeCalculado) : sumaImportesCategorias;

        if (precioNum !== 0 && Math.abs(sumaImportesCategorias - montoEsperado) > 0.01) {
            Swal.fire('Error de cálculo', `La suma de las categorías (S/ ${sumaImportesCategorias.toFixed(2)}) debe coincidir con el Importe Calculado por el producto (S/ ${montoEsperado.toFixed(2)}).`, 'error');
            return;
        }

        try {
            const token = localStorage.getItem('token');

            const payload = {
                fecha: fechaModal,
                hora: horaModal,
                descripcion,
                caja_id: cajaActivaId,
                monto: sumaImportesCategorias,
                detalles: detallesCategorias.map(d => ({
                    categoria_id: d.categoria_id,
                    importe: d.importe
                })),
                cliente_id: clienteId ? parseInt(clienteId) : null,
                almacen_id: almacenId ? parseInt(almacenId) : null,
                producto_id: productoId ? parseInt(productoId) : null,
                precio: precioNum !== 0 ? precioNum : null,
                cantidad: cantNum,
                observacion: observacion || null
            };

            if (editando) {
                await axios.put(`/api/movimientos/${movimientoId}`, payload, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                Swal.fire('¡Actualizado!', 'Movimiento modificado correctamente.', 'success');
            } else {
                payload.user_id = usuarioLogueado?.id;
                await axios.post('/api/movimientos', payload, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                Swal.fire('¡Guardado!', 'Movimiento registrado con éxito.', 'success');
            }

            setMostrarModal(false);
            limpiarFormularioModal();
            obtenerMovimientosHoy();
        } catch (error) {
            Swal.fire('Error', error.response?.data?.message || 'Error al procesar movimiento', 'error');
        }
    };

    // Filtro dinámico
    const movimientosGrid = movimientos.filter(m => {
        if (m.caja_id !== cajaActivaId) return false;
        if (!buscarText.trim()) return true;

        const term = buscarText.toLowerCase();
        const descMatch = m.descripcion?.toLowerCase().includes(term);
        const obsMatch = m.observacion?.toLowerCase().includes(term);
        const cliMatch = m.cliente?.razon?.toLowerCase().includes(term) || m.cliente?.num_documento?.includes(term);
        const prodMatch = m.producto?.descripcion?.toLowerCase().includes(term);

        return descMatch || obsMatch || cliMatch || prodMatch;
    });



    // Saldo Neto Matemático Directo y Desglose
    const saldoNetoTotal = movimientosGrid.reduce((acc, m) => acc + parseFloat(m.monto), 0);
    const totalIngresosHoy = movimientosGrid.filter(m => parseFloat(m.monto) > 0).reduce((acc, m) => acc + parseFloat(m.monto), 0);
    const totalEgresosHoy = movimientosGrid.filter(m => parseFloat(m.monto) < 0).reduce((acc, m) => acc + Math.abs(parseFloat(m.monto)), 0);

    return (
        <div className="w-100">
            
            {/* SELECCIÓN DE CAJA ACTIVA CON DISEÑO MODERNO */}
            <div className="card border-0 shadow-sm rounded-4 p-3 mb-4 bg-white">
                <div className="d-flex align-items-center gap-2 flex-wrap">
                    <span className="fw-bold text-dark me-2 small d-flex align-items-center gap-1">
                        <i className="fa-solid fa-cash-register text-primary fs-6"></i> Caja Activa:
                    </span>
                    {(Array.isArray(cajas) ? cajas : []).map(caja => {
                        const esActiva = cajaActivaId === caja.id;
                        return (
                            <button
                                key={caja.id}
                                onClick={() => setCajaActivaId(caja.id)}
                                className={`btn btn-sm rounded-3 px-3 py-1.5 fw-semibold transition-all d-flex align-items-center gap-1.5 ${
                                    esActiva ? 'text-white shadow-sm' : 'btn-light text-secondary border'
                                }`}
                                style={{
                                    backgroundColor: esActiva ? '#4f46e5' : '',
                                    borderColor: esActiva ? '#4f46e5' : ''
                                }}
                            >
                                <i className={`fa-solid ${esActiva ? 'fa-circle-dot text-white' : 'fa-circle text-muted'} extra-small`}></i>
                                <span>{caja.nombre}</span>
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* TARJETAS DE MÉTRICAS RÁPIDAS DE LA CAJA SELECCIONADA */}
            <div className="row g-3 mb-4">
                <div className="col-12 col-md-4">
                    <div className="card border-0 shadow-sm rounded-4 p-3 bg-white h-100">
                        <div className="d-flex justify-content-between align-items-center mb-1">
                            <span className="text-muted small fw-semibold">Ingresos del día</span>
                            <div className="rounded-circle p-2 text-success d-flex align-items-center justify-content-center" style={{ width: '36px', height: '36px', backgroundColor: '#d1fae5' }}>
                                <i className="fa-solid fa-arrow-trend-up"></i>
                            </div>
                        </div>
                        <h3 className="fw-bold text-success mb-0">{formatearSoles(totalIngresosHoy)}</h3>
                    </div>
                </div>

                <div className="col-12 col-md-4">
                    <div className="card border-0 shadow-sm rounded-4 p-3 bg-white h-100">
                        <div className="d-flex justify-content-between align-items-center mb-1">
                            <span className="text-muted small fw-semibold">Egresos del día</span>
                            <div className="rounded-circle p-2 text-danger d-flex align-items-center justify-content-center" style={{ width: '36px', height: '36px', backgroundColor: '#fee2e2' }}>
                                <i className="fa-solid fa-arrow-trend-down"></i>
                            </div>
                        </div>
                        <h3 className="fw-bold text-danger mb-0">{formatearSoles(totalEgresosHoy)}</h3>
                    </div>
                </div>

                <div className="col-12 col-md-4">
                    <div className="card border-0 shadow-sm rounded-4 p-3 bg-white h-100">
                        <div className="d-flex justify-content-between align-items-center mb-1">
                            <span className="text-muted small fw-semibold">Saldo Neto de Caja</span>
                            <div className="rounded-circle p-2 d-flex align-items-center justify-content-center" style={{ width: '36px', height: '36px', backgroundColor: '#e0e7ff', color: '#4f46e5' }}>
                                <i className="fa-solid fa-wallet"></i>
                            </div>
                        </div>
                        <h3 className={`fw-bold mb-0 ${saldoNetoTotal >= 0 ? 'text-dark' : 'text-danger'}`}>
                            {formatearSoles(saldoNetoTotal)}
                        </h3>
                    </div>
                </div>
            </div>

            {/* BARRA SUPERIOR: FECHA INALTERABLE + BÚSQUEDA + NUEVO MOVIMIENTO */}
            <div className="card border-0 shadow-sm rounded-4 p-3 mb-4 bg-white">
                <div className="row g-3 align-items-center justify-content-between">
                    <div className="col-12 col-md-8 d-flex gap-3 align-items-center flex-wrap">
                        <div>
                            <label className="form-label small fw-semibold text-secondary mb-1">Fecha Operativa</label>
                            <input 
                                type="text" 
                                className="form-control form-control-sm bg-light fw-bold text-dark border-0 rounded-3 text-center" 
                                value={fechaHoy} 
                                readOnly 
                                style={{ width: '120px' }}
                            />
                        </div>

                        <div className="flex-grow-1" style={{ maxWidth: '380px' }}>
                            <label className="form-label small fw-semibold text-secondary mb-1">Buscar Registros</label>
                            <div className="input-group input-group-sm">
                                <span className="input-group-text bg-light border-0 text-muted ps-3"><i className="fa-solid fa-magnifying-glass"></i></span>
                                <input 
                                    type="text" 
                                    className="form-control form-control-sm bg-light border-0 ps-2 py-2 rounded-end-3" 
                                    placeholder="Buscar por cliente, descripción, producto..." 
                                    value={buscarText} 
                                    onChange={(e) => setBuscarText(e.target.value)} 
                                />
                            </div>
                        </div>
                    </div>

                    <div className="col-12 col-md-4 text-md-end">
                        <button 
                            onClick={() => { limpiarFormularioModal(); setMostrarModal(true); }} 
                            className="btn text-white fw-semibold px-3 py-2 rounded-3 shadow-sm d-inline-flex align-items-center gap-2"
                            style={{ backgroundColor: '#4f46e5', border: 'none' }}
                        >
                            <i className="fa-solid fa-plus fs-6"></i>
                            <span>Nuevo Movimiento</span>
                        </button>
                    </div>
                </div>
            </div>

            {/* TABLA DE MOVIMIENTOS REGISTRADOS HOY */}
            <div className="card border-0 shadow-sm rounded-4 p-4 bg-white">
                <div className="d-flex justify-content-between align-items-center mb-3">
                    <h6 className="fw-bold text-dark m-0">Movimientos Registrados (Hoy)</h6>
                    <span className="badge bg-light text-secondary rounded-pill px-3 py-1.5 fw-semibold border">
                        {movimientosGrid.length} registros en esta caja
                    </span>
                </div>
                
                <div className="table-responsive">
                    <table className="table table-hover align-middle mb-0">
                        <thead className="table-light text-muted small fw-bold">
                            <tr>
                                <th>Hora / Usuario</th>
                                <th>Cliente</th>
                                <th>Descripción / Producto</th>
                                <th>Categorías (Desglose)</th>
                                <th className="text-center">Cant.</th>
                                <th>Precio Unit.</th>
                                <th>Monto (S/)</th>
                                <th>Observación</th>
                                <th className="text-end pe-3" style={{ width: '110px' }}>Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="small">
                            {movimientosGrid.map(m => {
    const valMonto = parseFloat(m.monto);
        const esPositivo = valMonto >= 0;

        // Obtener la inicial del usuario registrado o del usuario logueado como fallback
        const nombreUsuario = m.user?.name || usuarioLogueado?.name || 'Carlos Mendoza';
        const inicialUsuario = nombreUsuario.charAt(0).toUpperCase();

        return (
            <tr key={m.id}>
                {/* COLUMNA 1: INICIAL EN CÍRCULO EN MAYÚSCULA + HORA */}
                    <td>
                        <div className="d-flex align-items-center gap-2">
                            <div 
                                className="rounded-circle fw-bold text-white d-flex align-items-center justify-content-center flex-shrink-0 shadow-sm"
                                style={{ 
                                    width: '28px', 
                                    height: '28px', 
                                    backgroundColor: '#4f46e5',
                                    fontSize: '0.8rem'
                                }}
                                title={`Registrado/Editado por: ${nombreUsuario}`}
                            >
                                {inicialUsuario}
                            </div>
                            <span className="badge bg-light text-dark border fw-semibold px-2 py-1">
                                <i className="fa-regular fa-clock me-1 text-muted"></i>{m.hora}
                            </span>
                        </div>
                    </td>

                    {/* COLUMNA 2: CLIENTE */}

                                        {/* CLIENTE */}
                                        <td>
                                            {m.cliente ? (
                                                <div>
                                                    <span className="fw-bold text-dark d-block">{m.cliente.razon}</span>
                                                    <span className="text-muted extra-small">{m.cliente.num_documento}</span>
                                                </div>
                                            ) : <span className="text-muted">-</span>}
                                        </td>

                                        {/* DESCRIPCIÓN / PRODUCTO */}
                                        <td>
                                            <strong className="text-dark d-block">{m.descripcion}</strong>
                                            {m.producto && (
                                                <span className="badge bg-light text-primary border extra-small mt-1">
                                                    <i className="fa-solid fa-box me-1"></i>{m.producto.descripcion}
                                                </span>
                                            )}
                                        </td>

                                        {/* CATEGORÍAS */}
                                        <td>
                                            {m.detalles && m.detalles.length > 0 ? (
                                                <div className="d-flex flex-column gap-1">
                                                    {m.detalles.map((d, i) => {
                                                        const imp = parseFloat(d.importe);
                                                        const esIng = imp >= 0;
                                                        return (
                                                            <span key={i} className={`extra-small d-inline-flex align-items-center gap-1 ${esIng ? 'text-success' : 'text-danger'}`}>
                                                                <i className={`fa-solid ${esIng ? 'fa-plus-circle' : 'fa-minus-circle'}`}></i>
                                                                <strong>{d.categoria?.nombre}:</strong> {formatearSoles(imp)}
                                                            </span>
                                                        );
                                                    })}
                                                </div>
                                            ) : <span className="text-muted">-</span>}
                                        </td>

                                        <td className="text-center fw-bold">{m.cantidad || 1}</td>
                                        <td>{m.precio ? formatearSoles(m.precio) : '-'}</td>
                                        
                                        {/* MONTO PRINCIPAL */}
                                        <td>
                                            <span className={`fw-bold fs-6 ${esPositivo ? 'text-success' : 'text-danger'}`}>
                                                {esPositivo ? '+' : ''} {formatearSoles(valMonto)}
                                            </span>
                                        </td>

                                        <td className="text-muted">{m.observacion || '-'}</td>

                                        {/* SE ELIMINÓ LA COLUMNA ANTERIOR DE USUARIO */}

                                        {/* ACCIONES */}
                                        <td className="text-end pe-3">
                                            <div className="btn-group btn-group-sm">
                                                <button 
                                                    onClick={() => activarEdicionMovimiento(m)}
                                                    className="btn btn-light border text-secondary me-1 rounded-2"
                                                    title="Editar registro"
                                                >
                                                    <i className="fa-regular fa-pen-to-square"></i>
                                                </button>
                                                <button 
                                                    onClick={() => abrirModalMover(m)}
                                                    className="btn btn-light border text-warning rounded-2"
                                                    title="Mover de caja"
                                                >
                                                    <i className="fa-solid fa-arrow-right-to-bracket"></i>
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                        <tfoot className="table-light fw-bold">
                            <tr>
                                <td colSpan="6" className="text-end text-dark">Saldo Neto Total de Caja:</td>
                                <td className={`fs-5 ${saldoNetoTotal >= 0 ? 'text-success' : 'text-danger'}`}>
                                    {formatearSoles(saldoNetoTotal)}
                                </td>
                                <td colSpan="3"></td>
                            </tr>
                        </tfoot>
                    </table>
                </div>
            </div>

            {/* MODAL REGISTRO / EDICIÓN */}
            {mostrarModal && (
                <div className="modal d-block backdrop-blur" style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1050 }}>
                    <div className="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable">
                        <div className="modal-content rounded-4 border-0 shadow p-2">
                            
                            <div className="modal-header border-bottom-0 pb-0">
                                <h5 className="modal-title fw-bold text-dark fs-5">
                                    {editando ? 'Modificar Movimiento' : 'Registrar Movimiento de Caja'}
                                </h5>
                                <button 
                                    type="button" 
                                    className="btn-close" 
                                    onClick={() => { setMostrarModal(false); limpiarFormularioModal(); }}
                                ></button>
                            </div>

                            <form onSubmit={handleSubmitMovimiento} className="modal-body pt-3">
                                
                                {/* SECCIÓN 1: DETALLE COMERCIAL */}
                                <div className="p-3 rounded-3 bg-light border mb-3">
                                    <span className="small fw-bold text-secondary d-block mb-2 text-uppercase">
                                        <i className="fa-solid fa-store me-1 text-primary"></i> Detalle Comercial (Opcional)
                                    </span>
                                    
                                    <div className="row g-2 mb-2">
                                        <div className="col-md-6">
                                            <div className="d-flex justify-content-between align-items-center mb-1">
                                                <label className="form-label small fw-semibold text-secondary mb-0">Cliente</label>
                                                <button type="button" onClick={refrescarClientes} disabled={cargandoClientes} className="btn btn-link p-0 text-decoration-none extra-small fw-bold text-primary">
                                                    {cargandoClientes ? '⏳ Actualizando...' : '🔄 Actualizar'}
                                                </button>
                                            </div>
                                            {/* <select className="form-select form-select-sm rounded-3 py-2 border-light-subtle bg-white" value={clienteId} onChange={(e) => setClienteId(e.target.value)}>
                                                <option value="">-- Sin Cliente --</option>
                                                {clientes.map(c => (
                                                    <option key={c.id} value={c.id}>{c.num_documento} - {c.razon}</option>
                                                ))}
                                            </select> */}

                                            <Select
                                                options={opcionesClientes}
                                                value={opcionesClientes.find(op => op.value === parseInt(clienteId)) || null}
                                                onChange={(opcionSeleccionada) => setClienteId(opcionSeleccionada ? opcionSeleccionada.value : '')}
                                                isClearable
                                                placeholder="Buscar cliente..."
                                                noOptionsMessage={() => "No se encontraron clientes"}
                                                styles={{
                                                    control: (base) => ({
                                                        ...base,
                                                        borderRadius: '0.5rem',
                                                        backgroundColor: '#ffffff',
                                                        borderColor: '#dee2e6',
                                                        padding: '2px',
                                                        boxShadow: 'none',
                                                        '&:hover': { borderColor: '#4f46e5' }
                                                    })
                                                }}
                                            />
                                            
                                        </div>

                                        <div className="col-md-6">
                                            <div className="d-flex justify-content-between align-items-center mb-1">
                                                <label className="form-label small fw-semibold text-secondary mb-0">Almacén</label>
                                                <button type="button" onClick={refrescarAlmacenes} disabled={cargandoAlmacenes} className="btn btn-link p-0 text-decoration-none extra-small fw-bold text-primary">
                                                    {cargandoAlmacenes ? '⏳ Actualizando...' : '🔄 Actualizar'}
                                                </button>
                                            </div>
                                            <select className="form-select form-select-sm rounded-3 py-2 border-light-subtle bg-white" value={almacenId} onChange={(e) => setAlmacenId(e.target.value)}>
                                                <option value="">-- Todos los Almacenes --</option>
                                                {almacenes.map(a => (
                                                    <option key={a.id} value={a.id}>{a.nombre || a.descripcion}</option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>

                                    <div className="mb-2">
                                        <div className="d-flex justify-content-between align-items-center mb-1">
                                            <label className="form-label small fw-semibold text-secondary mb-0">Producto Catálogo</label>
                                            <button type="button" onClick={refrescarProductos} disabled={cargandoProductos} className="btn btn-link p-0 text-decoration-none extra-small fw-bold text-primary">
                                                {cargandoProductos ? '⏳ Actualizando...' : '🔄 Actualizar'}
                                            </button>
                                        </div>
                                        <select className="form-select form-select-sm rounded-3 py-2 border-light-subtle bg-white" value={productoId} onChange={(e) => handleSeleccionarProducto(e.target.value)}>
                                            <option value="">-- Ninguno (Ingreso manual directo) --</option>
                                            {productosFiltradosModal.map(p => (
                                                <option key={p.id} value={p.id}>{p.descripcion} (S/ {parseFloat(p.precio).toFixed(2)})</option>
                                            ))}
                                        </select>
                                    </div>

                                    {/* VALORES NUMÉRICOS */}
                                    <div className="row g-2 align-items-end mt-2">
                                        <div className="col-md-4">
                                            <label className="form-label small fw-semibold text-secondary mb-1">Precio Unit. (S/)</label>
                                            <input 
                                                type="number" 
                                                step="0.01" 
                                                className="form-control form-control-sm rounded-3 py-2 border-light-subtle bg-white"
                                                placeholder="Ej: 50.00 ó -50.00" 
                                                value={precio} 
                                                onChange={(e) => setPrecio(e.target.value)} 
                                            />
                                        </div>

                                        <div className="col-md-4">
                                            <label className="form-label small fw-semibold text-secondary mb-1">Cantidad</label>
                                            <input 
                                                type="number" 
                                                className="form-control form-control-sm rounded-3 py-2 border-light-subtle bg-white"
                                                value={cantidad} 
                                                onChange={(e) => setCantidad(e.target.value)} 
                                            />
                                        </div>

                                        <div className="col-md-4">
                                            <div className="p-2 rounded-3 bg-white text-center border">
                                                <span className="extra-small text-muted d-block fw-semibold">Importe Calculado</span>
                                                <strong className={`fs-6 ${parseFloat(importeCalculado) >= 0 ? 'text-success' : 'text-danger'}`}>
                                                    S/ {importeCalculado}
                                                </strong>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* SECCIÓN 2: DESCRIPCIÓN */}
                                <div className="mb-3">
                                    <label className="form-label small fw-semibold text-secondary mb-1">Descripción de la Operación *</label>
                                    <input 
                                        type="text" 
                                        className="form-control rounded-3 py-2 px-3 border-light-subtle bg-light"
                                        placeholder="Ej: Cobro de servicio / Pago de servicios" 
                                        value={descripcion} 
                                        onChange={(e) => setDescripcion(e.target.value)} 
                                        required 
                                        style={{ boxShadow: 'none' }}
                                    />
                                </div>

                                {/* SECCIÓN 3: TABLA DE CATEGORÍAS E IMPORTES */}
                                <div className="p-3 rounded-3 bg-light border mb-3">
                                    <div className="d-flex justify-content-between align-items-center mb-2">
                                        <span className="small fw-bold text-secondary text-uppercase">
                                            <i className="fa-solid fa-tags me-1 text-primary"></i> Desglose por Categorías *
                                        </span>
                                        <button type="button" onClick={refrescarCategorias} disabled={cargandoCategorias} className="btn btn-link p-0 text-decoration-none extra-small fw-bold text-primary">
                                            {cargandoCategorias ? '⏳ Actualizando...' : '🔄 Actualizar Categorías'}
                                        </button>
                                    </div>

                                    <div className="row g-2 align-items-end mb-2">
                                        <div className="col-md-6">
                                            <select className="form-select form-select-sm rounded-3 py-2 border-light-subtle bg-white" value={catSeleccionadaId} onChange={(e) => setCatSeleccionadaId(e.target.value)}>
                                                <option value="">-- Seleccionar Categoría --</option>
                                                {categorias.map(cat => (
                                                    <option key={cat.id} value={cat.id}>{cat.nombre}</option>
                                                ))}
                                            </select>
                                        </div>

                                        <div className="col-md-4">
                                            <input 
                                                type="number" 
                                                step="0.01" 
                                                className="form-control form-control-sm rounded-3 py-2 border-light-subtle bg-white"
                                                placeholder="Importe (+ ó -)" 
                                                value={montoCatInput} 
                                                onChange={(e) => setMontoCatInput(e.target.value)} 
                                            />
                                        </div>

                                        <div className="col-md-2">
                                            <button 
                                                type="button" 
                                                onClick={agregarCategoriaATabla} 
                                                className="btn btn-sm btn-success w-100 py-2 rounded-3 fw-semibold text-white d-flex align-items-center justify-content-center gap-1"
                                            >
                                                <i className="fa-solid fa-plus fs-7"></i> Añadir
                                            </button>
                                        </div>
                                    </div>

                                    <div className="table-responsive bg-white rounded-3 border">
                                        <table className="table table-sm align-middle mb-0">
                                            <thead className="table-light extra-small fw-bold text-secondary">
                                                <tr>
                                                    <th>Categoría</th>
                                                    <th>Importe (S/)</th>
                                                    <th className="text-center" style={{ width: '50px' }}>Quitar</th>
                                                </tr>
                                            </thead>
                                            <tbody className="extra-small">
                                                {detallesCategorias.length === 0 ? (
                                                    <tr>
                                                        <td colSpan="3" className="text-center text-muted py-2">Añada al menos una categoría con su importe.</td>
                                                    </tr>
                                                ) : (
                                                    detallesCategorias.map((d, index) => (
                                                        <tr key={index}>
                                                            <td className="fw-bold text-dark">{d.nombre}</td>
                                                            <td className={`fw-bold ${d.importe >= 0 ? 'text-success' : 'text-danger'}`}>
                                                                S/ {d.importe.toFixed(2)}
                                                            </td>
                                                            <td className="text-center">
                                                                <button 
                                                                    type="button" 
                                                                    onClick={() => eliminarCategoriaDeTabla(index)}
                                                                    className="btn btn-sm btn-light text-danger p-0 px-1 border"
                                                                >
                                                                    <i className="fa-solid fa-xmark"></i>
                                                                </button>
                                                            </td>
                                                        </tr>
                                                    ))
                                                )}
                                            </tbody>
                                            <tfoot className="table-light fw-bold extra-small">
                                                <tr>
                                                    <td className="text-end text-dark">Suma de Importes:</td>
                                                    <td className={`fs-6 ${sumaImportesCategorias >= 0 ? 'text-success' : 'text-danger'}`}>
                                                        S/ {sumaImportesCategorias.toFixed(2)}
                                                    </td>
                                                    <td></td>
                                                </tr>
                                            </tfoot>
                                        </table>
                                    </div>
                                </div>

                                {/* SECCIÓN 4: OBSERVACIONES */}
                                <div className="mb-2">
                                    <label className="form-label small fw-semibold text-secondary mb-1">Observaciones adicionales</label>
                                    <textarea 
                                        className="form-control rounded-3 py-2 px-3 border-light-subtle bg-light"
                                        rows="2"
                                        placeholder="Detalles sobre el pago, N° de comprobante..."
                                        value={observacion} 
                                        onChange={(e) => setObservacion(e.target.value)} 
                                        style={{ boxShadow: 'none' }}
                                    />
                                </div>

                                <div className="border-top pt-3 d-flex gap-2 justify-content-end">
                                    <button 
                                        type="button" 
                                        className="btn btn-light rounded-3 px-4 fw-semibold text-secondary" 
                                        onClick={() => { setMostrarModal(false); limpiarFormularioModal(); }}
                                    >
                                        Cancelar
                                    </button>
                                    <button 
                                        type="submit" 
                                        className="btn text-white rounded-3 px-4 fw-semibold" 
                                        style={{ backgroundColor: '#4f46e5', border: 'none' }}
                                    >
                                        {editando ? 'Actualizar Movimiento' : 'Guardar Movimiento'}
                                    </button>
                                </div>

                            </form>
                        </div>
                    </div>
                </div>
            )}

            {/* MODAL MOVER CAJA */}
            {mostrarModalMover && movimientoAMover && (
                <div className="modal d-block backdrop-blur" style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1050 }}>
                    <div className="modal-dialog modal-dialog-centered" style={{ maxWidth: '440px' }}>
                        <div className="modal-content rounded-4 border-0 shadow p-2">
                            
                            <div className="modal-header border-bottom-0 pb-0">
                                <h5 className="modal-title fw-bold text-dark fs-5">
                                    <i className="fa-solid fa-arrow-right-to-bracket me-2 text-warning"></i> Mover Registro de Caja
                                </h5>
                                <button type="button" className="btn-close" onClick={() => setMostrarModalMover(false)}></button>
                            </div>

                            <form onSubmit={handleConfirmarMoverCaja} className="modal-body pt-3">
                                <div className="p-3 bg-light rounded-3 border mb-3 extra-small">
                                    <p className="mb-1 text-dark"><strong>Descripción:</strong> {movimientoAMover.descripcion}</p>
                                    <p className="mb-0 text-dark"><strong>Monto:</strong> S/ {parseFloat(movimientoAMover.monto).toFixed(2)}</p>
                                </div>

                                <div className="mb-4">
                                    <label className="form-label small fw-semibold text-secondary mb-1">Seleccionar Caja Destino *</label>
                                    <select 
                                        className="form-select rounded-3 py-2 border-light-subtle bg-light text-dark"
                                        value={cajaDestinoId} 
                                        onChange={(e) => setCajaDestinoId(e.target.value)} 
                                        required
                                    >
                                        <option value="">-- Escoger Caja --</option>
                                        {cajas
                                            .filter(c => c.id !== movimientoAMover.caja_id)
                                            .map(c => (
                                                <option key={c.id} value={c.id}>{c.nombre}</option>
                                            ))
                                        }
                                    </select>
                                </div>

                                <div className="border-top pt-3 d-flex gap-2 justify-content-end">
                                    <button 
                                        type="button" 
                                        className="btn btn-light rounded-3 px-4 fw-semibold text-secondary" 
                                        onClick={() => setMostrarModalMover(false)}
                                    >
                                        Cancelar
                                    </button>
                                    <button 
                                        type="submit" 
                                        className="btn btn-warning text-white fw-semibold rounded-3 px-4"
                                    >
                                        Confirmar Mover
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

export default Movimientos;