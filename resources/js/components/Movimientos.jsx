import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Swal from 'sweetalert2';
import Select from 'react-select';

function Movimientos() {
    // Helper Fecha / Hora Perú
    const obtenerFechaPeru = () => {
        const opciones = { timeZone: 'America/Lima', year: 'numeric', month: '2-digit', day: '2-digit' };
        const partes = new Intl.DateTimeFormat('es-PE', opciones).formatToParts(new Date());
        return `${partes.find(p => p.type === 'year').value}-${partes.find(p => p.type === 'month').value}-${partes.find(p => p.type === 'day').value}`;
    };

    const obtenerHoraPeru = () => {
        return new Intl.DateTimeFormat('es-PE', { timeZone: 'America/Lima', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }).format(new Date());
    };

    // 📅 FECHA TRABAJO
    const [fechaTrabajo, setFechaTrabajo] = useState(obtenerFechaPeru());

    // ESTADOS PARA SALDO A FAVOR DEL CLIENTE
    const [saldoFavorDisponible, setSaldoFavorDisponible] = useState(0);
    const [usarSaldoFavor, setUsarSaldoFavor] = useState(false);

    // Listas maestras
    const [cajas, setCajas] = useState([]);
    const [categorias, setCategorias] = useState([]);
    const [clientes, setClientes] = useState([]);
    const [almacenes, setAlmacenes] = useState([]);
    const [productos, setProductos] = useState([]);
    const [movimientos, setMovimientos] = useState([]);
    const [garantias, setGarantias] = useState([]);

    // Estados de Carga
    const [cargandoCatalogos, setCargandoCatalogos] = useState(false);
    const [cargandoClientes, setCargandoClientes] = useState(false);
    const [cargandoProductos, setCargandoProductos] = useState(false);
    const [cargandoCategorias, setCargandoCategorias] = useState(false);
    const [cajaActivaId, setCajaActivaId] = useState(null);

    // Modales
    const [mostrarModal, setMostrarModal] = useState(false);
    const [tipoRegistro, setTipoRegistro] = useState('VENTA');
    const [editando, setEditando] = useState(false);
    const [movimientoId, setMovimientoId] = useState(null);

    // MODAL TRASLADO ENTRE CAJAS
    const [mostrarModalTraslado, setMostrarModalTraslado] = useState(false);
    const [movimientoOrigen, setMovimientoOrigen] = useState(null);
    const [cajaDestinoId, setCajaDestinoId] = useState('');
    const [numOperacionTraslado, setNumOperacionTraslado] = useState('');
    const [catDestinoId, setCatDestinoId] = useState('');
    const [montoTraslado, setMontoTraslado] = useState('');
    const [descTraslado, setDescTraslado] = useState('');

    // MODAL LISTADO Y DEVOLUCIÓN DE GARANTÍAS
    const [mostrarModalGarantias, setMostrarModalGarantias] = useState(false);
    const [filtroEstadoGarantia, setFiltroEstadoGarantia] = useState('PENDIENTE');
    const [buscarClienteGarantia, setBuscarClienteGarantia] = useState('');
    
    // Modal Confirmar Devolución Garantía
    const [garantiaADevolver, setGarantiaADevolver] = useState(null);
    const [cajaDevolucionGarantiaId, setCajaDevolucionGarantiaId] = useState('');
    const [catDevolucionGarantiaId, setCatDevolucionGarantiaId] = useState('');
    const [obsDevolucionGarantia, setObsDevolucionGarantia] = useState('');

    // Campos base del Modal Registro Movimiento
    const [fechaModal, setFechaModal] = useState(fechaTrabajo);
    const [horaModal, setHoraModal] = useState(obtenerHoraPeru());
    const [clienteId, setClienteId] = useState('');
    const [descripcion, setDescripcion] = useState('');
    const [observacion, setObservacion] = useState('');

    // CAMPOS GARANTÍA EN REGISTRO DE MOVIMIENTO
    const [tieneGarantia, setTieneGarantia] = useState(false);
    const [montoGarantiaInput, setMontoGarantiaInput] = useState('');

    // DETALLE DE PRODUCTOS
    const [detallesProductos, setDetallesProductos] = useState([]);
    const [prodAlmacenId, setProdAlmacenId] = useState('');
    const [prodSeleccionadoId, setProdSeleccionadoId] = useState('');
    const [prodPrecio, setProdPrecio] = useState('');
    const [prodCantidad, setProdCantidad] = useState(1);

    // DETALLE DE CATEGORÍAS
    const [detallesCategorias, setDetallesCategorias] = useState([]);
    const [catSeleccionadaId, setCatSeleccionadaId] = useState('');
    const [montoCatInput, setMontoCatInput] = useState('');

    useEffect(() => {
        cargarTodo();
    }, [fechaTrabajo]);

    // 🔄 RECARGA GLOBAL
    const cargarTodo = async () => {
        setCargandoCatalogos(true);
        try {
            const token = localStorage.getItem('token');
            const config = { headers: { Authorization: `Bearer ${token}` } };

            const [resCajas, resCats, resClis, resAlm, resProds, resMovs, resGarantias] = await Promise.all([
                axios.get('/api/cajas?solo_activas=true', config),
                axios.get('/api/categorias', config),
                axios.get('/api/clientes', config),
                axios.get('/api/almacens', config),
                axios.get('/api/productos', config),
                axios.get(`/api/movimientos?fecha=${fechaTrabajo}`, config),
                axios.get('/api/garantias', config)
            ]);

            const listaCajas = Array.isArray(resCajas.data) ? resCajas.data : (resCajas.data.cajas || []);
            setCajas(listaCajas);
            setCategorias(Array.isArray(resCats.data) ? resCats.data : []);
            setClientes(Array.isArray(resClis.data) ? resClis.data : []);
            setAlmacenes(Array.isArray(resAlm.data) ? resAlm.data : []);
            setProductos(Array.isArray(resProds.data) ? resProds.data : []);
            setMovimientos(Array.isArray(resMovs.data) ? resMovs.data : []);
            setGarantias(Array.isArray(resGarantias.data) ? resGarantias.data : []);

            if (listaCajas.length > 0 && !cajaActivaId) {
                setCajaActivaId(listaCajas[0].id);
            }
        } catch (error) {
            console.error("Error al refrescar datos", error);
        } finally {
            setCargandoCatalogos(false);
        }
    };

    const handleCambioCliente = async (op) => {
        const cId = op ? op.value : '';
        setClienteId(cId);
        setUsarSaldoFavor(false);

        if (cId) {
            try {
                const token = localStorage.getItem('token');
                const res = await axios.get(`/api/clientes/${cId}/saldo`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setSaldoFavorDisponible(res.data.saldo_favor || 0);
            } catch (err) {
                setSaldoFavorDisponible(0);
            }
        } else {
            setSaldoFavorDisponible(0);
        }
    };

    const recargarClientes = async () => {
        setCargandoClientes(true);
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get('/api/clientes', { headers: { Authorization: `Bearer ${token}` } });
            setClientes(Array.isArray(res.data) ? res.data : []);
        } catch (error) {
            console.error("Error al recargar clientes", error);
        } finally {
            setCargandoClientes(false);
        }
    };

    const recargarProductos = async () => {
        setCargandoProductos(true);
        try {
            const token = localStorage.getItem('token');
            const config = { headers: { Authorization: `Bearer ${token}` } };
            const [resProds, resAlm] = await Promise.all([
                axios.get('/api/productos', config),
                axios.get('/api/almacens', config)
            ]);
            setProductos(Array.isArray(resProds.data) ? resProds.data : []);
            setAlmacenes(Array.isArray(resAlm.data) ? resAlm.data : []);
        } catch (error) {
            console.error("Error al recargar productos", error);
        } finally {
            setCargandoProductos(false);
        }
    };

    const recargarCategorias = async () => {
        setCargandoCategorias(true);
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get('/api/categorias', { headers: { Authorization: `Bearer ${token}` } });
            setCategorias(Array.isArray(res.data) ? res.data : []);
        } catch (error) {
            console.error("Error al recargar categorías", error);
        } finally {
            setCargandoCategorias(false);
        }
    };

    const formatearSoles = (monto) => {
        const val = parseFloat(monto) || 0;
        return 'S/ ' + new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(val);
    };

    // --- MANEJO DE PRODUCTOS ---
    const handleSeleccionarProducto = (prodId) => {
        setProdSeleccionadoId(prodId);
        if (!prodId) {
            setProdPrecio('');
            return;
        }
        const prod = productos.find(p => p.id === parseInt(prodId));
        if (prod) setProdPrecio(prod.precio);
    };

    const agregarProductoATabla = () => {
        if (!prodSeleccionadoId) {
            Swal.fire('Atención', 'Seleccione un producto.', 'warning');
            return;
        }

        const pNum = parseFloat(prodPrecio) || 0;
        const cNum = parseInt(prodCantidad) || 1;

        if (pNum <= 0 || cNum <= 0) {
            Swal.fire('Atención', 'Ingrese un precio y cantidad válidos.', 'warning');
            return;
        }

        const prodObj = productos.find(p => p.id === parseInt(prodSeleccionadoId));
        const almObj = almacenes.find(a => a.id === parseInt(prodAlmacenId));

        const subtotal = pNum * cNum;

        setDetallesProductos([...detallesProductos, {
            almacen_id: prodAlmacenId ? parseInt(prodAlmacenId) : null,
            almacen_nombre: almObj ? (almObj.nombre || almObj.descripcion) : 'General',
            producto_id: prodObj.id,
            producto_nombre: prodObj.descripcion,
            precio: pNum,
            cantidad: cNum,
            importe: subtotal
        }]);

        if (!descripcion) {
            setDescripcion(prodObj.descripcion);
        }

        setProdSeleccionadoId('');
        setProdPrecio('');
        setProdCantidad(1);
    };

    const eliminarProductoDeTabla = (idx) => {
        setDetallesProductos(detallesProductos.filter((_, i) => i !== idx));
    };

    const sumaImportesProductos = detallesProductos.reduce((acc, p) => acc + p.importe, 0);

    // --- MANEJO DE CATEGORÍAS (CON ASIGNACIÓN DE CAJA) ---
    const agregarCategoriaATabla = () => {
        if (!catSeleccionadaId) {
            Swal.fire('Atención', 'Seleccione una categoría.', 'warning');
            return;
        }

        const montoVal = parseFloat(montoCatInput);
        if (isNaN(montoVal) || montoVal === 0) {
            Swal.fire('Atención', 'Ingrese un importe válido.', 'warning');
            return;
        }

        const catObj = categorias.find(c => c.id === parseInt(catSeleccionadaId));
        if (!catObj) return;

        // Auto-seleccionar la caja de origen según la categoría seleccionada
        if (catObj.caja_id) {
            setCajaActivaId(catObj.caja_id);
        }

        setDetallesCategorias([...detallesCategorias, {
            categoria_id: catObj.id,
            caja_id: catObj.caja_id,
            caja_nombre: catObj.caja?.nombre || 'General',
            nombre: catObj.nombre,
            tipo: catObj.tipo || 'INGRESO',
            importe: montoVal
        }]);

        setCatSeleccionadaId('');
        setMontoCatInput('');
    };

    const eliminarCategoriaDeTabla = (idx) => {
        setDetallesCategorias(detallesCategorias.filter((_, i) => i !== idx));
    };

    const sumaImportesCategorias = detallesCategorias.reduce((acc, c) => acc + c.importe, 0);

    const limpiarFormularioModal = () => {
        setEditando(false);
        setMovimientoId(null);
        setTipoRegistro('VENTA');
        setFechaModal(fechaTrabajo);
        setHoraModal(obtenerHoraPeru());
        setClienteId('');
        setDescripcion('');
        setObservacion('');
        setTieneGarantia(false);
        setMontoGarantiaInput('');
        setDetallesProductos([]);
        setDetallesCategorias([]);
        setProdAlmacenId('');
        setProdSeleccionadoId('');
        setProdPrecio('');
        setProdCantidad(1);
        setCatSeleccionadaId('');
        setMontoCatInput('');
    };

    const activarEdicionMovimiento = (m) => {
        setEditando(true);
        setMovimientoId(m.id);
        setFechaModal(m.fecha);
        setHoraModal(m.hora);
        setClienteId(m.cliente_id || '');
        setDescripcion(m.descripcion || '');
        setObservacion(m.observacion || '');

        const tieneProds = m.detalles_productos && m.detalles_productos.length > 0;
        setTipoRegistro(tieneProds ? 'VENTA' : 'LIBRE');

        if (m.garantia) {
            setTieneGarantia(true);
            setMontoGarantiaInput(m.garantia.monto_garantia);
        } else {
            setTieneGarantia(false);
            setMontoGarantiaInput('');
        }

        if (tieneProds) {
            setDetallesProductos(m.detalles_productos.map(dp => ({
                almacen_id: dp.almacen_id,
                almacen_nombre: dp.almacen ? (dp.almacen.nombre || dp.almacen.descripcion) : 'General',
                producto_id: dp.producto_id,
                producto_nombre: dp.producto?.descripcion || 'Producto',
                precio: parseFloat(dp.precio),
                cantidad: dp.cantidad,
                importe: parseFloat(dp.importe)
            })));
        } else {
            setDetallesProductos([]);
        }

        if (m.detalles && m.detalles.length > 0) {
            setDetallesCategorias(m.detalles.map(d => ({
                categoria_id: d.categoria_id,
                caja_nombre: d.categoria?.caja?.nombre || 'General',
                nombre: d.categoria?.nombre || 'Categoría',
                tipo: d.categoria?.tipo || 'INGRESO',
                importe: parseFloat(d.importe)
            })));
        } else {
            setDetallesCategorias([]);
        }

        setMostrarModal(true);
    };

    // ELIMINAR MOVIMIENTO
    const handleEliminarMovimiento = (m) => {
        Swal.fire({
            title: '¿Eliminar Movimiento?',
            text: `Se eliminará el registro "${m.descripcion}" de S/ ${Math.abs(parseFloat(m.monto)).toFixed(2)}.`,
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
                    await axios.delete(`/api/movimientos/${m.id}`, {
                        headers: { Authorization: `Bearer ${token}` }
                    });
                    Swal.fire('¡Eliminado!', 'El movimiento fue eliminado.', 'success');
                    cargarTodo();
                } catch (error) {
                    Swal.fire('Error', 'No se pudo eliminar el movimiento.', 'error');
                }
            }
        });
    };

    // TRASLADO ENTRE CAJAS
    const abrirModalTraslado = (m) => {
        const cajaOrigenObj = cajas.find(c => c.id === m.caja_id);
        const montoAbsoluto = Math.abs(parseFloat(m.monto));

        setMovimientoOrigen(m);
        setMontoTraslado(montoAbsoluto.toString());
        setDescTraslado(`Traslado recibido de ${cajaOrigenObj ? cajaOrigenObj.nombre : 'Caja'}`);
        setNumOperacionTraslado('');
        setCatDestinoId(categorias.length > 0 ? categorias[0].id.toString() : '');

        const cajaDiferente = cajas.find(c => c.id !== m.caja_id);
        setCajaDestinoId(cajaDiferente ? cajaDiferente.id.toString() : '');

        setMostrarModalTraslado(true);
    };

    const handleConfirmarTraslado = async (e) => {
        e.preventDefault();

        if (!cajaDestinoId) {
            Swal.fire('Atención', 'Seleccione la caja destino.', 'warning');
            return;
        }

        const montoNum = parseFloat(montoTraslado);
        if (isNaN(montoNum) || montoNum <= 0) {
            Swal.fire('Atención', 'Ingrese un monto válido a trasladar.', 'warning');
            return;
        }

        try {
            const token = localStorage.getItem('token');
            const cajaDestinoObj = cajas.find(c => c.id === parseInt(cajaDestinoId));

            const payload = {
                fecha: fechaTrabajo,
                hora: obtenerHoraPeru(),
                descripcion: descTraslado,
                caja_id: parseInt(cajaDestinoId),
                cliente_id: movimientoOrigen?.cliente_id || null,
                monto: montoNum,
                observacion: numOperacionTraslado ? `N° Operación: ${numOperacionTraslado}` : 'Traslado entre cajas',
                detalles: [
                    {
                        categoria_id: parseInt(catDestinoId),
                        importe: montoNum
                    }
                ],
                detalles_productos: []
            };

            await axios.post('/api/movimientos', payload, {
                headers: { Authorization: `Bearer ${token}` }
            });

            Swal.fire('¡Traslado Exitoso!', `Se acreditaron S/ ${formatearSoles(montoNum)} a la caja ${cajaDestinoObj ? cajaDestinoObj.nombre : ''}.`, 'success');

            setMostrarModalTraslado(false);
            cargarTodo();
        } catch (error) {
            Swal.fire('Error', error.response?.data?.message || 'Error al procesar el traslado.', 'error');
        }
    };

    // --- LÓGICA DE DEVOLUCIÓN DE GARANTÍA ---
    const prepararDevolucionGarantia = (garantia) => {
        setGarantiaADevolver(garantia);
        setCajaDevolucionGarantiaId(cajaActivaId ? cajaActivaId.toString() : (cajas.length > 0 ? cajas[0].id.toString() : ''));
        setCatDevolucionGarantiaId(categorias.length > 0 ? categorias[0].id.toString() : '');
        setObsDevolucionGarantia('');
    };

    const handleConfirmarDevolucionGarantia = async (e) => {
        e.preventDefault();
        if (!garantiaADevolver) return;

        try {
            const token = localStorage.getItem('token');
            const payload = {
                caja_id: parseInt(cajaDevolucionGarantiaId),
                categoria_id: parseInt(catDevolucionGarantiaId),
                fecha: fechaTrabajo,
                hora: obtenerHoraPeru(),
                observacion: obsDevolucionGarantia || 'Devolución de garantía a cliente'
            };

            await axios.post(`/api/garantias/${garantiaADevolver.id}/devolver`, payload, {
                headers: { Authorization: `Bearer ${token}` }
            });

            Swal.fire('¡Garantía Devuelta!', `Se registró el egreso de S/ ${garantiaADevolver.monto_garantia} en la caja.`, 'success');

            setGarantiaADevolver(null);
            cargarTodo();
        } catch (error) {
            Swal.fire('Error', error.response?.data?.message || 'No se pudo realizar la devolución de garantía.', 'error');
        }
    };

    // --- GUARDADO DE MOVIMIENTO ---
    const handleSubmitMovimiento = async (e) => {
        e.preventDefault();

        if (!descripcion.trim()) {
            Swal.fire('Atención', 'Ingrese la descripción del movimiento.', 'warning');
            return;
        }

        if (detallesCategorias.length === 0) {
            Swal.fire('Atención', 'Debe agregar al menos una categoría con su importe.', 'warning');
            return;
        }

        // Obtener el ID de la caja a partir de la primera categoría agregada en el desglose
        const cajaDestinoFinal = detallesCategorias[0]?.caja_id || cajaActivaId;

        if (tipoRegistro === 'VENTA') {
            if (detallesProductos.length === 0) {
                Swal.fire('Atención', 'En modo venta debe agregar al menos un producto a la lista.', 'warning');
                return;
            }

            if (Math.abs(sumaImportesCategorias - sumaImportesProductos) > 0.01) {
                Swal.fire('Cuadre incorrecto', `El total de categorías (${formatearSoles(sumaImportesCategorias)}) no coincide con el total de productos (${formatearSoles(sumaImportesProductos)}).`, 'warning');
                return;
            }
        }

        try {
            const token = localStorage.getItem('token');
            const payload = {
                fecha: fechaModal,
                hora: horaModal,
                descripcion,
                caja_id: cajaDestinoFinal, // 👈 Asigna la caja derivada de la categoría seleccionada
                cliente_id: clienteId ? parseInt(clienteId) : null,
                monto: sumaImportesCategorias,
                observacion: observacion || null,
                tiene_garantia: tieneGarantia,
                monto_garantia: tieneGarantia ? parseFloat(montoGarantiaInput) : null,
                usar_saldo_favor: usarSaldoFavor,
                detalles: detallesCategorias.map(d => ({
                    categoria_id: d.categoria_id,
                    importe: d.importe
                })),
                detalles_productos: tipoRegistro === 'VENTA' ? detallesProductos.map(dp => ({
                    almacen_id: dp.almacen_id,
                    producto_id: dp.producto_id,
                    precio: dp.precio,
                    cantidad: dp.cantidad,
                    importe: dp.importe
                })) : []
            };

            if (editando) {
                await axios.put(`/api/movimientos/${movimientoId}`, payload, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                Swal.fire('¡Actualizado!', 'Movimiento modificado.', 'success');
            } else {
                await axios.post('/api/movimientos', payload, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                Swal.fire('¡Guardado!', 'Movimiento registrado con éxito.', 'success');
            }

            setMostrarModal(false);
            limpiarFormularioModal();
            // Actualizar la caja activa a la caja a la que se envió el movimiento para ver el registro de inmediato
            setCajaActivaId(cajaDestinoFinal);
            cargarTodo();
        } catch (error) {
            Swal.fire('Error', error.response?.data?.message || 'Error al procesar el movimiento.', 'error');
        }
    };

    const opcionesClientes = clientes.map(c => ({
        value: c.id,
        label: `${c.num_documento || ''} - ${c.razon}`
    }));

    // FILTRAR MOVIMIENTOS Y CÁLCULO DE MÉTRICAS
    const movimientosGrid = movimientos.filter(m => m.caja_id === cajaActivaId);

    const totalIngresos = movimientosGrid
        .filter(m => parseFloat(m.monto) > 0)
        .reduce((acc, m) => acc + parseFloat(m.monto), 0);

    const totalEgresos = movimientosGrid
        .filter(m => parseFloat(m.monto) < 0)
        .reduce((acc, m) => acc + Math.abs(parseFloat(m.monto)), 0);

    const saldoNeto = totalIngresos - totalEgresos;

    // FILTRAR LISTA DE GARANTÍAS PARA EL MODAL DE GARANTÍAS
    const garantiasFiltradas = garantias.filter(g => {
        const coincideEstado = filtroEstadoGarantia === 'TODOS' || g.estado === filtroEstadoGarantia;
        const nombreCliente = g.cliente?.razon || '';
        const docCliente = g.cliente?.num_documento || '';
        const busqueda = buscarClienteGarantia.toLowerCase();

        const coincideCliente = nombreCliente.toLowerCase().includes(busqueda) || docCliente.toLowerCase().includes(busqueda);

        return coincideEstado && coincideCliente;
    });

    const totalGarantiasPendientes = garantias.filter(g => g.estado === 'PENDIENTE').length;

    return (
        <div className="w-100">
            
            {/* SELECCIÓN DE FECHA + SELECCIÓN DE CAJA + BOTÓN GARANTÍAS + BOTÓN ACTUALIZAR */}
            <div className="card border-0 shadow-sm rounded-4 p-3 mb-4 bg-white">
                <div className="d-flex justify-content-between align-items-center flex-wrap gap-3">
                    
                    {/* NAVEGADOR DE FECHA DE TRABAJO */}
                    <div className="d-flex align-items-center gap-2">
                        <label className="fw-bold text-dark small mb-0 d-flex align-items-center gap-1">
                            <i className="fa-regular fa-calendar-days text-primary fs-6"></i> Fecha:
                        </label>
                        <input 
                            type="date" 
                            className="form-control form-control-sm rounded-3 fw-bold border-light-subtle bg-light text-primary"
                            value={fechaTrabajo}
                            onChange={(e) => setFechaTrabajo(e.target.value)}
                            style={{ maxWidth: '160px', boxShadow: 'none' }}
                        />
                        {fechaTrabajo !== obtenerFechaPeru() && (
                            <button 
                                onClick={() => setFechaTrabajo(obtenerFechaPeru())} 
                                className="btn btn-sm btn-outline-secondary rounded-3 extra-small fw-semibold"
                            >
                                Ir a Hoy
                            </button>
                        )}
                    </div>

                    {/* SELECTOR DE CAJA ACTIVA */}
                    <div className="d-flex align-items-center gap-2 flex-wrap">
                        <span className="fw-bold text-dark small">
                            <i className="fa-solid fa-cash-register me-1 text-primary"></i> Caja:
                        </span>
                        {cajas.map(caja => (
                            <button
                                key={caja.id}
                                onClick={() => setCajaActivaId(caja.id)}
                                className={`btn btn-sm rounded-3 fw-semibold transition-all ${cajaActivaId === caja.id ? 'btn-primary text-white shadow-sm' : 'btn-light text-secondary border'}`}
                                style={{ backgroundColor: cajaActivaId === caja.id ? '#4f46e5' : '' }}
                            >
                                {caja.nombre}
                            </button>
                        ))}
                    </div>

                    {/* BOTONES ACCIÓN: MODAL GARANTÍAS & REFRESCAR */}
                    <div className="d-flex align-items-center gap-2">
                        <button 
                            onClick={() => setMostrarModalGarantias(true)} 
                            className="btn btn-warning btn-sm text-dark fw-bold rounded-3 d-inline-flex align-items-center gap-2 shadow-sm"
                        >
                            <i className="fa-solid fa-shield-halved"></i>
                            <span>Garantías</span>
                            {totalGarantiasPendientes > 0 && (
                                <span className="badge bg-danger text-white rounded-circle px-1.5 py-0.5">
                                    {totalGarantiasPendientes}
                                </span>
                            )}
                        </button>

                        <button 
                            onClick={cargarTodo} 
                            disabled={cargandoCatalogos}
                            className="btn btn-light border text-secondary btn-sm rounded-3 fw-semibold d-inline-flex align-items-center gap-2"
                        >
                            <i className={`fa-solid fa-rotate ${cargandoCatalogos ? 'fa-spin text-primary' : ''}`}></i>
                            <span>{cargandoCatalogos ? 'Actualizando...' : 'Actualizar'}</span>
                        </button>
                    </div>

                </div>
            </div>

            {/* 📊 TARJETAS SOBRE EL GRID: INGRESOS, EGRESOS Y NETO */}
            <div className="row g-3 mb-4">
                <div className="col-12 col-md-4">
                    <div className="card border-0 shadow-sm rounded-4 p-3 bg-white h-100">
                        <div className="d-flex justify-content-between align-items-center mb-1">
                            <span className="text-muted small fw-semibold">Ingresos del Día</span>
                            <div className="rounded-circle p-2 text-success d-flex align-items-center justify-content-center" style={{ width: '36px', height: '36px', backgroundColor: '#d1fae5' }}>
                                <i className="fa-solid fa-arrow-trend-up"></i>
                            </div>
                        </div>
                        <h3 className="fw-bold text-success mb-0">{formatearSoles(totalIngresos)}</h3>
                    </div>
                </div>

                <div className="col-12 col-md-4">
                    <div className="card border-0 shadow-sm rounded-4 p-3 bg-white h-100">
                        <div className="d-flex justify-content-between align-items-center mb-1">
                            <span className="text-muted small fw-semibold">Egresos / Salidas</span>
                            <div className="rounded-circle p-2 text-danger d-flex align-items-center justify-content-center" style={{ width: '36px', height: '36px', backgroundColor: '#fee2e2' }}>
                                <i className="fa-solid fa-arrow-trend-down"></i>
                            </div>
                        </div>
                        <h3 className="fw-bold text-danger mb-0">{formatearSoles(totalEgresos)}</h3>
                    </div>
                </div>

                <div className="col-12 col-md-4">
                    <div className="card border-0 shadow-sm rounded-4 p-3 bg-white h-100">
                        <div className="d-flex justify-content-between align-items-center mb-1">
                            <span className="text-muted small fw-semibold">Saldo Neto ({fechaTrabajo})</span>
                            <div className="rounded-circle p-2 d-flex align-items-center justify-content-center" style={{ width: '36px', height: '36px', backgroundColor: '#e0e7ff', color: '#4f46e5' }}>
                                <i className="fa-solid fa-wallet"></i>
                            </div>
                        </div>
                        <h3 className={`fw-bold mb-0 ${saldoNeto >= 0 ? 'text-dark' : 'text-danger'}`}>
                            {formatearSoles(saldoNeto)}
                        </h3>
                    </div>
                </div>
            </div>

            {/* TABLA DE MOVIMIENTOS */}
            <div className="card border-0 shadow-sm rounded-4 p-4 bg-white">
                <div className="d-flex justify-content-between align-items-center mb-3">
                    <h6 className="fw-bold text-dark m-0">
                        Movimientos del Día <span className="text-primary fw-bold">({fechaTrabajo})</span>
                    </h6>
                    <button 
                        onClick={() => { limpiarFormularioModal(); setMostrarModal(true); }} 
                        className="btn text-white fw-semibold px-3 py-2 rounded-3 shadow-sm d-inline-flex align-items-center gap-2"
                        style={{ backgroundColor: '#4f46e5', border: 'none' }}
                    >
                        <i className="fa-solid fa-plus fs-6"></i>
                        <span>Nuevo Movimiento</span>
                    </button>
                </div>

                <div className="table-responsive">
                    <table className="table table-hover align-middle mb-0">
                        <thead className="table-light text-muted small fw-bold">
                            <tr>
                                <th>Hora / Usuario</th>
                                <th>Cliente</th>
                                <th>Descripción / Ítems</th>
                                <th>Desglose Categorías</th>
                                <th>Monto (S/)</th>
                                <th>Observación</th>
                                <th className="text-end pe-3">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="small">
                            {movimientosGrid.length === 0 ? (
                                <tr>
                                    <td colSpan="7" className="text-center text-muted py-4">
                                        No hay movimientos registrados para el {fechaTrabajo}.
                                    </td>
                                </tr>
                            ) : (
                                movimientosGrid.map(m => {
                                    const valMonto = parseFloat(m.monto);
                                    const esPos = valMonto >= 0;
                                    const inicialUser = m.user?.name ? m.user.name.charAt(0).toUpperCase() : 'U';

                                    return (
                                        <tr key={m.id}>
                                            <td>
                                                <div className="d-flex align-items-center gap-2">
                                                    <div className="rounded-circle fw-bold text-white d-flex align-items-center justify-content-center flex-shrink-0 shadow-sm" style={{ width: '28px', height: '28px', backgroundColor: '#4f46e5', fontSize: '0.8rem' }}>
                                                        {inicialUser}
                                                    </div>
                                                    <span className="badge bg-light text-dark border fw-semibold px-2 py-1">{m.hora}</span>
                                                </div>
                                            </td>
                                            <td>{m.cliente ? m.cliente.razon : '-'}</td>
                                            <td>
                                                <strong className="text-dark d-block">{m.descripcion}</strong>
                                                {m.detalles_productos && m.detalles_productos.map((dp, idx) => (
                                                    <span key={idx} className="badge bg-light text-secondary border extra-small me-1 mt-1">
                                                        {dp.cantidad}x {dp.producto?.descripcion} ({formatearSoles(dp.importe)})
                                                    </span>
                                                ))}
                                                {m.garantia && (
                                                    <span className={`badge ${m.garantia.estado === 'PENDIENTE' ? 'bg-warning text-dark' : 'bg-secondary text-white'} extra-small me-1 mt-1`}>
                                                        🛡️ Garantía: S/ {m.garantia.monto_garantia} ({m.garantia.estado})
                                                    </span>
                                                )}
                                            </td>
                                            <td>
                                                {m.detalles && m.detalles.map((d, i) => (
                                                    <div key={i} className="extra-small">
                                                        • <strong>{d.categoria?.nombre}:</strong> <span className={parseFloat(d.importe) >= 0 ? 'text-success' : 'text-danger'}>{formatearSoles(d.importe)}</span>
                                                    </div>
                                                ))}
                                            </td>
                                            <td>
                                                <span className={`fw-bold fs-6 ${esPos ? 'text-success' : 'text-danger'}`}>
                                                    {formatearSoles(valMonto)}
                                                </span>
                                            </td>
                                            <td className="text-muted">{m.observacion || '-'}</td>
                                            
                                            <td className="text-end pe-3">
                                                <div className="d-inline-flex gap-1">
                                                    {/* <button 
                                                        onClick={() => activarEdicionMovimiento(m)} 
                                                        className="btn btn-light btn-sm border text-secondary rounded-2 px-2 py-1"
                                                        title="Editar Movimiento"
                                                    >
                                                        <i className="fa-regular fa-pen-to-square"></i>
                                                    </button> */}

                                                    {/* <button 
                                                        onClick={() => abrirModalTraslado(m)} 
                                                        className="btn btn-light btn-sm border text-primary rounded-2 px-2 py-1"
                                                        title="Trasladar/Mover a otra caja"
                                                    >
                                                        <i className="fa-solid fa-arrows-rotate"></i>
                                                    </button> */}

                                                    <button 
                                                        onClick={() => handleEliminarMovimiento(m)} 
                                                        className="btn btn-light btn-sm border text-danger rounded-2 px-2 py-1"
                                                        title="Eliminar Movimiento"
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

            {/* 🛡️ MODAL DE GESTIÓN Y CONSULTA DE GARANTÍAS */}
            {mostrarModalGarantias && (
                <div className="modal d-block backdrop-blur" style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1060 }}>
                    <div className="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable">
                        <div className="modal-content rounded-4 border-0 shadow p-2">
                            
                            <div className="modal-header border-bottom-0 pb-0 d-flex justify-content-between align-items-center">
                                <h5 className="modal-title fw-bold text-dark fs-5">
                                    <i className="fa-solid fa-shield-halved text-warning me-2"></i>
                                    Control de Garantías de Clientes
                                </h5>
                                <button type="button" className="btn-close" onClick={() => setMostrarModalGarantias(false)}></button>
                            </div>

                            <div className="modal-body pt-3">
                                
                                {/* FILTROS Y BÚSQUEDA EN GARANTÍAS */}
                                <div className="row g-2 mb-3">
                                    <div className="col-md-7">
                                        <input 
                                            type="text" 
                                            className="form-control form-control-sm rounded-3 py-2 bg-light border-light-subtle"
                                            placeholder="🔍 Buscar garantía por Cliente o DNI/RUC..."
                                            value={buscarClienteGarantia}
                                            onChange={(e) => setBuscarClienteGarantia(e.target.value)}
                                        />
                                    </div>
                                    <div className="col-md-5">
                                        <div className="btn-group btn-group-sm w-100" role="group">
                                            <button 
                                                type="button" 
                                                onClick={() => setFiltroEstadoGarantia('PENDIENTE')}
                                                className={`btn fw-bold ${filtroEstadoGarantia === 'PENDIENTE' ? 'btn-warning text-dark' : 'btn-light border text-secondary'}`}
                                            >
                                                Pendientes
                                            </button>
                                            <button 
                                                type="button" 
                                                onClick={() => setFiltroEstadoGarantia('DEVUELTO')}
                                                className={`btn fw-bold ${filtroEstadoGarantia === 'DEVUELTO' ? 'btn-success text-white' : 'btn-light border text-secondary'}`}
                                            >
                                                Devueltas
                                            </button>
                                            <button 
                                                type="button" 
                                                onClick={() => setFiltroEstadoGarantia('TODOS')}
                                                className={`btn fw-bold ${filtroEstadoGarantia === 'TODOS' ? 'btn-secondary text-white' : 'btn-light border text-secondary'}`}
                                            >
                                                Todas
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                {/* TABLA LISTADO DE GARANTÍAS */}
                                <div className="table-responsive bg-white rounded-3 border">
                                    <table className="table table-hover align-middle mb-0 extra-small">
                                        <thead className="table-light fw-bold">
                                            <tr>
                                                <th>Fecha Depósito</th>
                                                <th>Cliente</th>
                                                <th>Monto Garantía</th>
                                                <th>Estado</th>
                                                <th>Fecha Devolución</th>
                                                <th className="text-end pe-3">Acción</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {garantiasFiltradas.length === 0 ? (
                                                <tr>
                                                    <td colSpan="6" className="text-center text-muted py-4">No se encontraron garantías registradas.</td>
                                                </tr>
                                            ) : (
                                                garantiasFiltradas.map(g => {
                                                    const esPendiente = g.estado === 'PENDIENTE';

                                                    return (
                                                        <tr key={g.id}>
                                                            <td className="fw-bold text-dark">{g.fecha_deposito}</td>
                                                            <td>
                                                                <strong className="text-dark d-block">{g.cliente ? g.cliente.razon : 'Cliente Eventual'}</strong>
                                                                <span className="text-muted extra-small">{g.cliente ? g.cliente.num_documento : '-'}</span>
                                                            </td>
                                                            <td className="fw-bold text-primary fs-6">{formatearSoles(g.monto_garantia)}</td>
                                                            <td>
                                                                <span className={`badge rounded-pill px-2.5 py-1 fw-semibold ${esPendiente ? 'bg-warning text-dark' : 'bg-success-subtle text-success border border-success-subtle'}`}>
                                                                    {g.estado}
                                                                </span>
                                                            </td>
                                                            <td className="text-muted">
                                                                {g.fecha_devolucion ? g.fecha_devolucion : '-'}
                                                            </td>
                                                            <td className="text-end pe-3">
                                                                {esPendiente ? (
                                                                    <button 
                                                                        onClick={() => prepararDevolucionGarantia(g)} 
                                                                        className="btn btn-sm btn-success fw-bold px-2 py-1 rounded-2 shadow-sm d-inline-flex align-items-center gap-1"
                                                                    >
                                                                        <i className="fa-solid fa-hand-holding-dollar"></i>
                                                                        <span>Devolver</span>
                                                                    </button>
                                                                ) : (
                                                                    <span className="text-muted extra-small italic">Devuelta en Mov. #{g.movimiento_devolucion_id || ''}</span>
                                                                )}
                                                            </td>
                                                        </tr>
                                                    );
                                                })
                                            )}
                                        </tbody>
                                    </table>
                                </div>

                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* 💵 MODAL SECUNDARIO DE CONFIRMACIÓN DE DEVOLUCIÓN DE GARANTÍA */}
            {garantiaADevolver && (
                <div className="modal d-block backdrop-blur" style={{ backgroundColor: 'rgba(0,0,0,0.6)', zIndex: 1070 }}>
                    <div className="modal-dialog modal-dialog-centered" style={{ maxWidth: '440px' }}>
                        <div className="modal-content rounded-4 border-0 shadow p-2">
                            <div className="modal-header border-bottom-0 pb-0">
                                <h5 className="modal-title fw-bold text-dark fs-5">
                                    <i className="fa-solid fa-hand-holding-dollar text-success me-2"></i>
                                    Confirmar Devolución de Garantía
                                </h5>
                                <button type="button" className="btn-close" onClick={() => setGarantiaADevolver(null)}></button>
                            </div>

                            <form onSubmit={handleConfirmarDevolucionGarantia} className="modal-body pt-3">
                                <div className="p-3 bg-light rounded-3 border mb-3">
                                    <span className="extra-small text-muted d-block mb-1">Cliente Receptor:</span>
                                    <strong className="text-dark d-block fs-6">{garantiaADevolver.cliente ? garantiaADevolver.cliente.razon : 'Cliente Eventual'}</strong>
                                    <span className="extra-small text-muted d-block mt-2">Monto a Devolver:</span>
                                    <h3 className="fw-bold text-danger mb-0">{formatearSoles(garantiaADevolver.monto_garantia)}</h3>
                                </div>

                                <div className="mb-3">
                                    <label className="form-label small fw-semibold text-secondary mb-1">Caja de Salida (Egreso) *</label>
                                    <select 
                                        className="form-select rounded-3 py-2 border-light-subtle bg-light text-dark fw-semibold"
                                        value={cajaDevolucionGarantiaId}
                                        onChange={(e) => setCajaDevolucionGarantiaId(e.target.value)}
                                        required
                                    >
                                        {cajas.map(c => (
                                            <option key={c.id} value={c.id}>{c.nombre}</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="mb-3">
                                    <label className="form-label small fw-semibold text-secondary mb-1">Categoría del Egreso *</label>
                                    <select 
                                        className="form-select rounded-3 py-2 border-light-subtle bg-light"
                                        value={catDevolucionGarantiaId}
                                        onChange={(e) => setCatDevolucionGarantiaId(e.target.value)}
                                        required
                                    >
                                        {categorias.map(cat => (
                                            <option key={cat.id} value={cat.id}>{cat.nombre}</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="mb-3">
                                    <label className="form-label small fw-semibold text-secondary mb-1">Observación de Devolución</label>
                                    <input 
                                        type="text" 
                                        className="form-control rounded-3 py-2 border-light-subtle bg-light"
                                        placeholder="Ej: Devolución entregada en efectivo"
                                        value={obsDevolucionGarantia}
                                        onChange={(e) => setObsDevolucionGarantia(e.target.value)}
                                    />
                                </div>

                                <div className="border-top pt-3 d-flex gap-2 justify-content-end">
                                    <button type="button" className="btn btn-light rounded-3 px-4 fw-semibold text-secondary" onClick={() => setGarantiaADevolver(null)}>
                                        Cancelar
                                    </button>
                                    <button type="submit" className="btn btn-success text-white rounded-3 px-4 fw-semibold">
                                        Procesar Devolución (- S/ {garantiaADevolver.monto_garantia})
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            {/* MODAL TRASLADO ENTRE CAJAS */}
            {mostrarModalTraslado && (
                <div className="modal d-block backdrop-blur" style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1060 }}>
                    <div className="modal-dialog modal-dialog-centered" style={{ maxWidth: '460px' }}>
                        <div className="modal-content rounded-4 border-0 shadow p-2">
                            <div className="modal-header border-bottom-0 pb-0">
                                <h5 className="modal-title fw-bold text-dark fs-5">
                                    <i className="fa-solid fa-arrows-rotate text-primary me-2"></i>
                                    Trasladar Importe a Otra Caja
                                </h5>
                                <button type="button" className="btn-close" onClick={() => setMostrarModalTraslado(false)}></button>
                            </div>

                            <form onSubmit={handleConfirmarTraslado} className="modal-body pt-3">
                                <div className="p-3 bg-light rounded-3 border mb-3">
                                    <span className="extra-small text-muted d-block mb-1">Fecha del Traslado:</span>
                                    <span className="badge bg-primary text-white mb-2">{fechaTrabajo}</span>
                                    <span className="extra-small text-muted d-block mb-1">Origen:</span>
                                    <strong className="text-dark d-block">{movimientoOrigen?.descripcion}</strong>
                                    <span className="badge bg-secondary text-white extra-small mt-1">
                                        Importe Original: S/ {Math.abs(parseFloat(movimientoOrigen?.monto || 0)).toFixed(2)}
                                    </span>
                                </div>

                                <div className="mb-3">
                                    <label className="form-label small fw-semibold text-secondary mb-1">Caja Destino (Acreditación) *</label>
                                    <select 
                                        className="form-select rounded-3 py-2 border-light-subtle bg-light text-dark fw-semibold"
                                        value={cajaDestinoId}
                                        onChange={(e) => setCajaDestinoId(e.target.value)}
                                        required
                                    >
                                        <option value="">-- Seleccionar Caja Receptora --</option>
                                        {cajas.filter(c => c.id !== movimientoOrigen?.caja_id).map(c => (
                                            <option key={c.id} value={c.id}>{c.nombre}</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="mb-3">
                                    <label className="form-label small fw-semibold text-secondary mb-1">Categoría Destino *</label>
                                    <select 
                                        className="form-select rounded-3 py-2 border-light-subtle bg-light"
                                        value={catDestinoId}
                                        onChange={(e) => setCatDestinoId(e.target.value)}
                                        required
                                    >
                                        {categorias.map(cat => (
                                            <option key={cat.id} value={cat.id}>{cat.nombre}</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="mb-3">
                                    <label className="form-label small fw-semibold text-secondary mb-1">Monto a Trasladar (+) *</label>
                                    <div className="input-group">
                                        <span className="input-group-text bg-light border-light-subtle fw-bold">S/</span>
                                        <input 
                                            type="number" 
                                            step="0.01" 
                                            className="form-control rounded-end-3 py-2 border-light-subtle bg-light fw-bold text-success fs-5"
                                            value={montoTraslado}
                                            onChange={(e) => setMontoTraslado(e.target.value)}
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="mb-3">
                                    <label className="form-label small fw-semibold text-secondary mb-1">N° de Operación / Ref.</label>
                                    <input 
                                        type="text" 
                                        className="form-control rounded-3 py-2 border-light-subtle bg-light"
                                        placeholder="Ej: OP-984512"
                                        value={numOperacionTraslado}
                                        onChange={(e) => setNumOperacionTraslado(e.target.value)}
                                    />
                                </div>

                                <div className="mb-3">
                                    <label className="form-label small fw-semibold text-secondary mb-1">Descripción del Traslado *</label>
                                    <input 
                                        type="text" 
                                        className="form-control rounded-3 py-2 border-light-subtle bg-light"
                                        value={descTraslado}
                                        onChange={(e) => setDescTraslado(e.target.value)}
                                        required
                                    />
                                </div>

                                <div className="border-top pt-3 d-flex gap-2 justify-content-end">
                                    <button type="button" className="btn btn-light rounded-3 px-4 fw-semibold text-secondary" onClick={() => setMostrarModalTraslado(false)}>
                                        Cancelar
                                    </button>
                                    <button type="submit" className="btn text-white rounded-3 px-4 fw-semibold" style={{ backgroundColor: '#4f46e5', border: 'none' }}>
                                        Confirmar Traslado
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            {/* MODAL REGISTRO MOVIMIENTO */}
            {mostrarModal && (
                <div className="modal d-block backdrop-blur" style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1050 }}>
                    <div className="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable">
                        <div className="modal-content rounded-4 border-0 shadow p-2">
                            
                            <div className="modal-header border-bottom-0 pb-0 d-flex justify-content-between align-items-center">
                                <h5 className="modal-title fw-bold text-dark fs-5">
                                    {editando ? 'Modificar Movimiento' : 'Nuevo Movimiento de Caja'}
                                </h5>
                                <button type="button" className="btn-close" onClick={() => { setMostrarModal(false); limpiarFormularioModal(); }}></button>
                            </div>

                            <form onSubmit={handleSubmitMovimiento} className="modal-body pt-3">
                                
                                {/* 📅 FECHA Y HORA */}
                                <div className="row g-2 mb-3">
                                    <div className="col-md-6">
                                        <label className="form-label small fw-semibold text-secondary mb-1">Fecha de Operación *</label>
                                        <input 
                                            type="date" 
                                            className="form-control rounded-3 py-2 px-3 border-light-subtle bg-light fw-semibold text-primary"
                                            value={fechaModal}
                                            onChange={(e) => setFechaModal(e.target.value)}
                                            required
                                        />
                                    </div>
                                    <div className="col-md-6">
                                        <label className="form-label small fw-semibold text-secondary mb-1">Hora *</label>
                                        <input 
                                            type="text" 
                                            className="form-control rounded-3 py-2 px-3 border-light-subtle bg-light fw-semibold"
                                            value={horaModal}
                                            onChange={(e) => setHoraModal(e.target.value)}
                                            required
                                        />
                                    </div>
                                </div>

                                {/* SELECTOR TIPO DE MOVIMIENTO */}
                                <div className="p-2 bg-light rounded-3 d-flex gap-2 mb-3 border">
                                    <button 
                                        type="button" 
                                        onClick={() => setTipoRegistro('VENTA')}
                                        className={`btn btn-sm w-50 fw-bold rounded-2 transition-all ${tipoRegistro === 'VENTA' ? 'btn-white bg-white text-primary shadow-sm border' : 'btn-light text-muted'}`}
                                    >
                                        <i className="fa-solid fa-cart-shopping me-1"></i> Venta / Con Productos
                                    </button>
                                    <button 
                                        type="button" 
                                        onClick={() => { setTipoRegistro('LIBRE'); setDetallesProductos([]); }}
                                        className={`btn btn-sm w-50 fw-bold rounded-2 transition-all ${tipoRegistro === 'LIBRE' ? 'btn-white bg-white text-primary shadow-sm border' : 'btn-light text-muted'}`}
                                    >
                                        <i className="fa-solid fa-receipt me-1"></i> Movimiento Libre / Saldo a Favor
                                    </button>
                                </div>

                                {/* SELECCIÓN DE CLIENTE */}
                                <div className="mb-3 p-3 bg-light rounded-3 border">
                                    <div className="d-flex justify-content-between align-items-center mb-1">
                                        <label className="form-label small fw-semibold text-secondary mb-0">
                                            Cliente Receptor / Comprador {tipoRegistro === 'LIBRE' ? '(Recomendado para Saldo a Favor)' : '(Opcional)'}
                                        </label>
                                        <button 
                                            type="button" 
                                            onClick={recargarClientes} 
                                            disabled={cargandoClientes}
                                            className="btn btn-link p-0 text-decoration-none extra-small fw-semibold text-primary d-inline-flex align-items-center gap-1"
                                        >
                                            <i className={`fa-solid fa-rotate ${cargandoClientes ? 'fa-spin' : ''}`}></i>
                                            <span>Actualizar Clientes</span>
                                        </button>
                                    </div>

                                    <Select
                                        options={opcionesClientes}
                                        value={opcionesClientes.find(op => op.value === parseInt(clienteId)) || null}
                                        onChange={handleCambioCliente}
                                        isClearable
                                        placeholder="🔍 Buscar cliente por DNI/RUC o Nombre..."
                                    />

                                    {clienteId && saldoFavorDisponible > 0 && (
                                        <div className="mt-2 p-2.5 bg-success-subtle border border-success-subtle rounded-3 d-flex justify-content-between align-items-center">
                                            <div>
                                                <span className="extra-small fw-bold text-success d-block">
                                                    <i className="fa-solid fa-wallet me-1"></i> Este cliente tiene un Saldo a Favor disponible:
                                                </span>
                                                <h5 className="fw-bold text-success mb-0">{formatearSoles(saldoFavorDisponible)}</h5>
                                            </div>
                                            
                                            <div className="form-check form-switch">
                                                <input 
                                                    className="form-check-input" 
                                                    type="checkbox" 
                                                    role="switch"
                                                    id="checkUsarSaldo"
                                                    checked={usarSaldoFavor}
                                                    onChange={(e) => {
                                                        setUsarSaldoFavor(e.target.checked);
                                                        if (e.target.checked) {
                                                            const descuento = Math.min(saldoFavorDisponible, sumaImportesProductos || 0);
                                                            setMontoCatInput(descuento.toString());
                                                        }
                                                    }}
                                                />
                                                <label className="form-check-label extra-small fw-bold text-dark" htmlFor="checkUsarSaldo">
                                                    Usar Saldo a Favor
                                                </label>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* TABLA PRODUCTOS */}
                                {tipoRegistro === 'VENTA' && (
                                    <div className="p-3 rounded-3 bg-light border mb-3">
                                        <div className="d-flex justify-content-between align-items-center mb-2">
                                            <span className="small fw-bold text-secondary text-uppercase mb-0">
                                                <i className="fa-solid fa-boxes-stacked me-1 text-primary"></i> Detalle de Productos
                                            </span>
                                            <button 
                                                type="button" 
                                                onClick={recargarProductos} 
                                                disabled={cargandoProductos}
                                                className="btn btn-link p-0 text-decoration-none extra-small fw-semibold text-primary d-inline-flex align-items-center gap-1"
                                            >
                                                <i className={`fa-solid fa-rotate ${cargandoProductos ? 'fa-spin' : ''}`}></i>
                                                <span>Actualizar Productos</span>
                                            </button>
                                        </div>

                                        <div className="row g-2 align-items-end mb-2">
                                            <div className="col-md-3">
                                                <label className="extra-small text-muted mb-1">Almacén</label>
                                                <select className="form-select form-select-sm" value={prodAlmacenId} onChange={(e) => setProdAlmacenId(e.target.value)}>
                                                    <option value="">-- General --</option>
                                                    {almacenes.map(a => (
                                                        <option key={a.id} value={a.id}>{a.nombre || a.descripcion}</option>
                                                    ))}
                                                </select>
                                            </div>

                                            <div className="col-md-4">
                                                <label className="extra-small text-muted mb-1">Producto *</label>
                                                <select className="form-select form-select-sm" value={prodSeleccionadoId} onChange={(e) => handleSeleccionarProducto(e.target.value)}>
                                                    <option value="">-- Seleccionar --</option>
                                                    {productos.map(p => (
                                                        <option key={p.id} value={p.id}>{p.descripcion}</option>
                                                    ))}
                                                </select>
                                            </div>

                                            <div className="col-md-2">
                                                <label className="extra-small text-muted mb-1">Precio</label>
                                                <input type="number" step="0.01" className="form-control form-control-sm" placeholder="S/" value={prodPrecio} onChange={(e) => setProdPrecio(e.target.value)} />
                                            </div>

                                            <div className="col-md-2">
                                                <label className="extra-small text-muted mb-1">Cant.</label>
                                                <input type="number" className="form-control form-control-sm text-center" value={prodCantidad} onChange={(e) => setProdCantidad(e.target.value)} />
                                            </div>

                                            <div className="col-md-1">
                                                <button type="button" onClick={agregarProductoATabla} className="btn btn-sm btn-primary w-100 fw-semibold" style={{ backgroundColor: '#4f46e5' }}>
                                                    ➕
                                                </button>
                                            </div>
                                        </div>

                                        <div className="table-responsive bg-white rounded-3 border">
                                            <table className="table table-sm align-middle mb-0">
                                                <thead className="table-light extra-small fw-bold">
                                                    <tr>
                                                        <th>Producto</th>
                                                        <th>Almacén</th>
                                                        <th className="text-center">Cant.</th>
                                                        <th className="text-end">Precio</th>
                                                        <th className="text-end">Importe</th>
                                                        <th className="text-center">Quitar</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="extra-small">
                                                    {detallesProductos.length === 0 ? (
                                                        <tr>
                                                            <td colSpan="6" className="text-center text-muted py-2">Ningún producto añadido a la venta.</td>
                                                        </tr>
                                                    ) : (
                                                        detallesProductos.map((dp, idx) => (
                                                            <tr key={idx}>
                                                                <td className="fw-bold">{dp.producto_nombre}</td>
                                                                <td>{dp.almacen_nombre}</td>
                                                                <td className="text-center fw-bold">{dp.cantidad}</td>
                                                                <td className="text-end">{formatearSoles(dp.precio)}</td>
                                                                <td className="text-end fw-bold text-dark">{formatearSoles(dp.importe)}</td>
                                                                <td className="text-center">
                                                                    <button type="button" onClick={() => eliminarProductoDeTabla(idx)} className="btn btn-sm btn-light text-danger p-0 px-1">✕</button>
                                                                </td>
                                                            </tr>
                                                        ))
                                                    )}
                                                </tbody>
                                                <tfoot className="table-light extra-small fw-bold">
                                                    <tr>
                                                        <td colSpan="4" className="text-end">Suma Total Productos:</td>
                                                        <td className="text-end text-primary fs-6">{formatearSoles(sumaImportesProductos)}</td>
                                                        <td></td>
                                                    </tr>
                                                </tfoot>
                                            </table>
                                        </div>
                                    </div>
                                )}

                                {/* DESCRIPCIÓN GENERAL */}
                                <div className="mb-3">
                                    <label className="form-label small fw-semibold text-secondary mb-1">Descripción del Movimiento *</label>
                                    <input type="text" className="form-control rounded-3 py-2 px-3 border-light-subtle bg-light" placeholder="Ej: Venta de mostrador / Pago de internet / Gastos varios" value={descripcion} onChange={(e) => setDescripcion(e.target.value)} required />
                                </div>

                                {/* DESGLOSE DE CATEGORÍAS (MOSTRANDO CAJA - CATEGORÍA - TIPO) */}
                                <div className="p-3 rounded-3 bg-light border mb-3">
                                    <div className="d-flex justify-content-between align-items-center mb-2">
                                        <span className="small fw-bold text-secondary text-uppercase mb-0">
                                            <i className="fa-solid fa-tags me-1 text-primary"></i> Categorías / Formas de Pago *
                                        </span>
                                        <button 
                                            type="button" 
                                            onClick={recargarCategorias} 
                                            disabled={cargandoCategorias}
                                            className="btn btn-link p-0 text-decoration-none extra-small fw-semibold text-primary d-inline-flex align-items-center gap-1"
                                        >
                                            <i className={`fa-solid fa-rotate ${cargandoCategorias ? 'fa-spin' : ''}`}></i>
                                            <span>Actualizar Categorías</span>
                                        </button>
                                    </div>

                                    <div className="row g-2 align-items-end mb-2">
                                        <div className="col-md-6">
                                            <select className="form-select form-select-sm fw-semibold" value={catSeleccionadaId} onChange={(e) => setCatSeleccionadaId(e.target.value)}>
                                                <option value="">-- Seleccionar (Caja - Categoría - Tipo) --</option>
                                                {categorias.map(cat => (
                                                    <option key={cat.id} value={cat.id}>
                                                        {cat.caja ? cat.caja.nombre : 'General'} - {cat.nombre} - ({cat.tipo || 'INGRESO'})
                                                    </option>
                                                ))}
                                            </select>
                                        </div>

                                        <div className="col-md-4">
                                            <input type="number" step="0.01" className="form-control form-control-sm" placeholder="Monto (+ ó -)" value={montoCatInput} onChange={(e) => setMontoCatInput(e.target.value)} />
                                        </div>

                                        <div className="col-md-2">
                                            <button type="button" onClick={agregarCategoriaATabla} className="btn btn-sm btn-success w-100 fw-bold">
                                                + Añadir
                                            </button>
                                        </div>
                                    </div>

                                    <div className="table-responsive bg-white rounded-3 border">
                                        <table className="table table-sm align-middle mb-0">
                                            <thead className="table-light extra-small fw-bold">
                                                <tr>
                                                    <th>Caja / Categoría</th>
                                                    <th>Tipo</th>
                                                    <th>Importe (S/)</th>
                                                    <th className="text-center">Quitar</th>
                                                </tr>
                                            </thead>
                                            <tbody className="extra-small">
                                                {detallesCategorias.length === 0 ? (
                                                    <tr>
                                                        <td colSpan="4" className="text-center text-muted py-2">Añada al menos una categoría con su importe.</td>
                                                    </tr>
                                                ) : (
                                                    detallesCategorias.map((d, idx) => (
                                                        <tr key={idx}>
                                                            <td className="fw-bold">
                                                                <span className="badge bg-light text-dark border me-1">{d.caja_nombre}</span>
                                                                {d.nombre}
                                                            </td>
                                                            <td>
                                                                <span className={`badge ${d.tipo === 'INGRESO' ? 'bg-success-subtle text-success border border-success-subtle' : 'bg-danger-subtle text-danger border border-danger-subtle'}`}>
                                                                    {d.tipo}
                                                                </span>
                                                            </td>
                                                            <td className={`fw-bold ${d.importe >= 0 ? 'text-success' : 'text-danger'}`}>{formatearSoles(d.importe)}</td>
                                                            <td className="text-center">
                                                                <button type="button" onClick={() => eliminarCategoriaDeTabla(idx)} className="btn btn-sm btn-light text-danger p-0 px-1">✕</button>
                                                            </td>
                                                        </tr>
                                                    ))
                                                )}
                                            </tbody>
                                            <tfoot className="table-light extra-small fw-bold">
                                                <tr>
                                                    <td colSpan="2" className="text-end">Monto Total Movimiento:</td>
                                                    <td className={`fs-6 ${sumaImportesCategorias >= 0 ? 'text-success' : 'text-danger'}`}>{formatearSoles(sumaImportesCategorias)}</td>
                                                    <td></td>
                                                </tr>
                                            </tfoot>
                                        </table>
                                    </div>
                                </div>

                                {/* 🛡️ SECCIÓN SWITCH: INCLUIR GARANTÍA */}
                                <div className="p-3 bg-warning-subtle rounded-3 border border-warning-subtle mb-3">
                                    <div className="form-check form-switch mb-0">
                                        <input 
                                            className="form-check-input" 
                                            type="checkbox" 
                                            role="switch" 
                                            id="checkTieneGarantia"
                                            checked={tieneGarantia}
                                            onChange={(e) => setTieneGarantia(e.target.checked)}
                                        />
                                        <label className="form-check-label fw-bold text-dark small" htmlFor="checkTieneGarantia">
                                            🛡️ ¿Este movimiento incluye Depósito de Garantía?
                                        </label>
                                    </div>

                                    {tieneGarantia && (
                                        <div className="mt-2 pt-2 border-top border-warning-subtle row g-2 align-items-center">
                                            <div className="col-md-6">
                                                <label className="extra-small fw-bold text-dark mb-1">Monto de la Garantía *</label>
                                                <div className="input-group input-group-sm">
                                                    <span className="input-group-text bg-white border-light-subtle fw-bold">S/</span>
                                                    <input 
                                                        type="number" 
                                                        step="0.01" 
                                                        className="form-control fw-bold text-primary"
                                                        placeholder="Ej: 100.00"
                                                        value={montoGarantiaInput}
                                                        onChange={(e) => setMontoGarantiaInput(e.target.value)}
                                                        required={tieneGarantia}
                                                    />
                                                </div>
                                            </div>
                                            <div className="col-md-6">
                                                <span className="extra-small text-muted d-block mt-3">
                                                    Esta garantía se registrará a nombre del cliente para que pueda ser devuelta en el futuro.
                                                </span>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* OBSERVACIÓN */}
                                <div className="mb-2">
                                    <label className="form-label small fw-semibold text-secondary mb-1">Observaciones</label>
                                    <textarea className="form-control rounded-3" rows="2" value={observacion} onChange={(e) => setObservacion(e.target.value)} />
                                </div>

                                <div className="border-top pt-3 d-flex gap-2 justify-content-end">
                                    <button type="button" className="btn btn-light rounded-3 px-4 fw-semibold text-secondary" onClick={() => { setMostrarModal(false); limpiarFormularioModal(); }}>
                                        Cancelar
                                    </button>
                                    <button type="submit" className="btn text-white rounded-3 px-4 fw-semibold" style={{ backgroundColor: '#4f46e5', border: 'none' }}>
                                        {editando ? 'Actualizar Movimiento' : 'Guardar Movimiento'}
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