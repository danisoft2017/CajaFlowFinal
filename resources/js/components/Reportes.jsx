import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Swal from 'sweetalert2';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

function Reportes() {
    const obtenerFechaPeru = () => {
        const opciones = { timeZone: 'America/Lima', year: 'numeric', month: '2-digit', day: '2-digit' };
        const partes = new Intl.DateTimeFormat('es-PE', opciones).formatToParts(new Date());
        return `${partes.find(p => p.type === 'year').value}-${partes.find(p => p.type === 'month').value}-${partes.find(p => p.type === 'day').value}`;
    };

    const fechaHoy = obtenerFechaPeru();

    // Filtros
    const [fechaDesde, setFechaDesde] = useState(fechaHoy);
    const [fechaHasta, setFechaHasta] = useState(fechaHoy);
    const [cajaFiltroId, setCajaFiltroId] = useState('');
    const [buscarFiltro, setBuscarFiltro] = useState('');

    // Datos
    const [cajas, setCajas] = useState([]);
    const [categorias, setCategorias] = useState([]);
    const [movimientos, setMovimientos] = useState([]);
    const [cargando, setCargando] = useState(false);

    useEffect(() => {
        cargarFiltrosIniciales();
    }, []);

    const cargarFiltrosIniciales = async () => {
        try {
            const token = localStorage.getItem('token');
            const config = { headers: { Authorization: `Bearer ${token}` } };
            const [resCajas, resCats] = await Promise.all([
                axios.get('/api/cajas', config),
                axios.get('/api/categorias', config)
            ]);
            setCajas(Array.isArray(resCajas.data) ? resCajas.data : (resCajas.data.cajas || []));
            setCategorias(Array.isArray(resCats.data) ? resCats.data : []);
            generarReporte();
        } catch (error) {
            console.error("Error al cargar filtros iniciales", error);
        }
    };

    const generarReporte = async () => {
        setCargando(true);
        try {
            const token = localStorage.getItem('token');
            const url = `/api/movimientos?fecha_desde=${fechaDesde}&fecha_hasta=${fechaHasta}`;
            const res = await axios.get(url, { headers: { Authorization: `Bearer ${token}` } });
            setMovimientos(Array.isArray(res.data) ? res.data : []);
        } catch (error) {
            Swal.fire('Error', 'No se pudieron consultar los movimientos.', 'error');
        } finally {
            setCargando(false);
        }
    };

    const formatearSoles = (monto) => {
        const val = parseFloat(monto) || 0;
        return 'S/ ' + new Intl.NumberFormat('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(val);
    };

    // --- AGRUPACIÓN POR CAJA ---
    const movimientosFiltrados = movimientos.filter(m => {
        const coincideCaja = !cajaFiltroId || m.caja_id === parseInt(cajaFiltroId);
        const busqueda = buscarFiltro.toLowerCase();
        const clienteNom = m.cliente?.razon?.toLowerCase() || '';
        const clienteDoc = m.cliente?.num_documento?.toLowerCase() || '';
        const desc = m.descripcion?.toLowerCase() || '';
        const obs = m.observacion?.toLowerCase() || '';

        const coincideBusqueda = !buscarFiltro || clienteNom.includes(busqueda) || clienteDoc.includes(busqueda) || desc.includes(busqueda) || obs.includes(busqueda);

        return coincideCaja && coincideBusqueda;
    });

    // Agrupar por ID de Caja
    const agrupadoPorCaja = movimientosFiltrados.reduce((acc, m) => {
        const idCaja = m.caja_id || 0;
        const nombreCaja = m.caja ? m.caja.nombre : `Caja #${idCaja}`;

        if (!acc[idCaja]) {
            acc[idCaja] = {
                id: idCaja,
                nombre: nombreCaja,
                movimientos: [],
                totalIngresos: 0,
                totalEgresos: 0,
                neto: 0
            };
        }

        const monto = parseFloat(m.monto);
        acc[idCaja].movimientos.push(m);
        if (monto >= 0) {
            acc[idCaja].totalIngresos += monto;
        } else {
            acc[idCaja].totalEgresos += Math.abs(monto);
        }
        acc[idCaja].neto += monto;

        return acc;
    }, {});

    const listaGruposCaja = Object.values(agrupadoPorCaja);

    // Totales generales
    const granTotalIngresos = listaGruposCaja.reduce((acc, g) => acc + g.totalIngresos, 0);
    const granTotalEgresos = listaGruposCaja.reduce((acc, g) => acc + g.totalEgresos, 0);
    const granTotalNeto = granTotalIngresos - granTotalEgresos;

    // --- GENERACIÓN DE PDF PERSONALIZADO ---
    const exportarPDF = () => {
        if (listaGruposCaja.length === 0) {
            Swal.fire('Atención', 'No hay datos para exportar en el período seleccionado.', 'warning');
            return;
        }

        const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });

        // Título del PDF
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text("REPORTE DE MOVIMIENTO DE CAJAS", 14, 15);
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.text(`Reporte interno entre las fechas ${fechaDesde} al ${fechaHasta}`, 14, 21);

        let currentY = 26;

        // Extraer categorías dinámicamente o usar las registradas
        const listaNombresCategorias = categorias.length > 0 
            ? categorias.map(c => c.nombre.toUpperCase()) 
            : ['PENDIENTE', 'AREQUIPA', 'BCP', 'YAPE', 'PLIN', 'EFECTIVO'];

        // Recorrer cada Caja
        listaGruposCaja.forEach((grupo) => {
            // Nombre de la Caja
            doc.setFontSize(11);
            doc.setFont('helvetica', 'bold');
            doc.text(grupo.nombre.toUpperCase(), 14, currentY);
            currentY += 3;

            // Encabezados
            const tableHeaders = [['FECHA', 'CLIENTE', 'DESCRIPCION', ...listaNombresCategorias, 'TOTAL']];

            // Acumuladores por categoría
            const acumuladosCat = { TOTAL: 0 };
            listaNombresCategorias.forEach(c => acumuladosCat[c] = 0);

            // Filas
            const tableRows = grupo.movimientos.map(m => {
                const fechaHora = `${m.fecha}\n${m.hora}`;
                const clienteStr = m.cliente ? `${m.cliente.razon}\n${m.cliente.num_documento || ''}` : '- Eventual -';
                const descStr = m.descripcion || '-';

                const fila = [fechaHora, clienteStr, descStr];

                // Mapeo por columna de categoría
                listaNombresCategorias.forEach(catNombre => {
                    const det = m.detalles?.find(d => d.categoria?.nombre?.toUpperCase() === catNombre);
                    if (det) {
                        const imp = parseFloat(det.importe);
                        fila.push(imp !== 0 ? formatearSoles(imp) : '');
                        acumuladosCat[catNombre] += imp;
                    } else {
                        fila.push('');
                    }
                });

                const totalMov = parseFloat(m.monto);
                fila.push(formatearSoles(totalMov));
                acumuladosCat.TOTAL += totalMov;

                return fila;
            });

            // Fila de Totales de la Caja
            const filaTotal = ['TOTAL', '', ''];
            listaNombresCategorias.forEach(catNombre => {
                const val = acumuladosCat[catNombre];
                filaTotal.push(val !== 0 ? formatearSoles(val) : '');
            });
            filaTotal.push(formatearSoles(acumuladosCat.TOTAL));

            tableRows.push(filaTotal);

            // Renderizar Tabla de la Caja
            autoTable(doc, {
                startY: currentY,
                head: tableHeaders,
                body: tableRows,
                theme: 'grid',
                styles: { fontSize: 7, cellPadding: 2, valign: 'middle' },
                headStyles: { fillColor: [240, 240, 240], textColor: [0, 0, 0], fontStyle: 'bold', halign: 'center' },
                didParseCell: function (data) {
                    if (data.row.index === tableRows.length - 1) {
                        data.cell.styles.fontStyle = 'bold';
                        data.cell.styles.fillColor = [245, 245, 245];
                    }
                }
            });

            currentY = doc.lastAutoTable.finalY + 8;
        });

        // TABLA RESUMEN CAJAS
        doc.setFontSize(11);
        doc.setFont('helvetica', 'bold');
        doc.text("RESUMEN GENERAL POR CAJA", 14, currentY);
        currentY += 3;

        const resumenBody = listaGruposCaja.map(g => [
            g.nombre,
            formatearSoles(g.totalIngresos),
            formatearSoles(g.totalEgresos),
            formatearSoles(g.neto)
        ]);

        autoTable(doc, {
            startY: currentY,
            head: [['CAJA', 'INGRESO', 'EGRESO', 'NETO']],
            body: resumenBody,
            theme: 'grid',
            styles: { fontSize: 8, cellPadding: 2 },
            headStyles: { fillColor: [230, 230, 230], textColor: [0, 0, 0], fontStyle: 'bold' }
        });

        currentY = doc.lastAutoTable.finalY + 8;

        // TABLA RESUMEN POR CLIENTE
        doc.setFontSize(11);
        doc.setFont('helvetica', 'bold');
        doc.text("TOTAL DE MOVIMIENTO POR CLIENTE", 14, currentY);
        currentY += 3;

        const agrupadoCliente = movimientosFiltrados.reduce((acc, m) => {
            const nom = m.cliente ? m.cliente.razon : 'Cliente Eventual';
            acc[nom] = (acc[nom] || 0) + parseFloat(m.monto);
            return acc;
        }, {});

        const clientesBody = Object.entries(agrupadoCliente).map(([nombre, monto]) => [
            nombre,
            formatearSoles(monto)
        ]);

        clientesBody.push(['Total', formatearSoles(granTotalNeto)]);

        autoTable(doc, {
            startY: currentY,
            head: [['CLIENTE', 'MONTO TOTAL']],
            body: clientesBody,
            theme: 'grid',
            styles: { fontSize: 8, cellPadding: 2 },
            headStyles: { fillColor: [230, 230, 230], textColor: [0, 0, 0], fontStyle: 'bold' },
            didParseCell: function (data) {
                if (data.row.index === clientesBody.length - 1) {
                    data.cell.styles.fontStyle = 'bold';
                    data.cell.styles.fillColor = [245, 245, 245];
                }
            }
        });

        doc.save(`Reporte_Movimientos_${fechaDesde}_al_${fechaHasta}.pdf`);
    };

    return (
        <div className="container-fluid px-4 py-3">
            
            {/* ENCABEZADO Y FILTROS */}
            <div className="card border-0 shadow-sm rounded-4 p-4 mb-4 bg-white">
                <div className="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
                    <h5 className="fw-bold text-dark m-0 d-flex align-items-center gap-2">
                        <i className="fa-solid fa-chart-line text-primary fs-4"></i>
                        <span>Reporte Resumen de Movimientos por Caja</span>
                    </h5>

                    <div className="d-flex gap-2">
                        <button 
                            onClick={exportarPDF} 
                            className="btn btn-danger text-white fw-semibold rounded-3 d-inline-flex align-items-center gap-2 shadow-sm"
                        >
                            <i className="fa-solid fa-file-pdf"></i>
                            <span>Exportar PDF</span>
                        </button>

                        <button 
                            onClick={() => window.print()} 
                            className="btn btn-light border text-secondary fw-semibold rounded-3 d-inline-flex align-items-center gap-2"
                        >
                            <i className="fa-solid fa-print"></i>
                            <span>Imprimir</span>
                        </button>
                    </div>
                </div>

                {/* FILTROS DE FECHAS Y CAJAS */}
                <div className="row g-3 align-items-end">
                    <div className="col-12 col-md-3">
                        <label className="form-label small fw-semibold text-secondary mb-1">Desde</label>
                        <input 
                            type="date" 
                            className="form-control rounded-3 py-2 border-light-subtle bg-light fw-bold text-primary"
                            value={fechaDesde}
                            onChange={(e) => setFechaDesde(e.target.value)}
                        />
                    </div>

                    <div className="col-12 col-md-3">
                        <label className="form-label small fw-semibold text-secondary mb-1">Hasta</label>
                        <input 
                            type="date" 
                            className="form-control rounded-3 py-2 border-light-subtle bg-light fw-bold text-primary"
                            value={fechaHasta}
                            onChange={(e) => setFechaHasta(e.target.value)}
                        />
                    </div>

                    <div className="col-12 col-md-3">
                        <label className="form-label small fw-semibold text-secondary mb-1">Filtrar Caja</label>
                        <select 
                            className="form-select rounded-3 py-2 border-light-subtle bg-light fw-semibold"
                            value={cajaFiltroId}
                            onChange={(e) => setCajaFiltroId(e.target.value)}
                        >
                            <option value="">-- Todas las Cajas --</option>
                            {cajas.map(c => (
                                <option key={c.id} value={c.id}>{c.nombre}</option>
                            ))}
                        </select>
                    </div>

                    <div className="col-12 col-md-3">
                        <button 
                            onClick={generarReporte} 
                            disabled={cargando}
                            className="btn text-white fw-semibold w-100 py-2 rounded-3 shadow-sm d-flex align-items-center justify-content-center gap-2"
                            style={{ backgroundColor: '#4f46e5', border: 'none' }}
                        >
                            <i className={`fa-solid ${cargando ? 'fa-spin fa-rotate' : 'fa-magnifying-glass'}`}></i>
                            <span>{cargando ? 'Consultando...' : 'Generar Reporte'}</span>
                        </button>
                    </div>
                </div>
            </div>

            {/* TARJETAS GLOBALES */}
            <div className="row g-3 mb-4">
                <div className="col-12 col-md-4">
                    <div className="card border-0 shadow-sm rounded-4 p-3 bg-white h-100 border-start border-4 border-success">
                        <span className="text-muted extra-small fw-semibold text-uppercase d-block mb-1">Ingresos Totales</span>
                        <h4 className="fw-bold text-success mb-0">{formatearSoles(granTotalIngresos)}</h4>
                    </div>
                </div>

                <div className="col-12 col-md-4">
                    <div className="card border-0 shadow-sm rounded-4 p-3 bg-white h-100 border-start border-4 border-danger">
                        <span className="text-muted extra-small fw-semibold text-uppercase d-block mb-1">Egresos Totales</span>
                        <h4 className="fw-bold text-danger mb-0">{formatearSoles(granTotalEgresos)}</h4>
                    </div>
                </div>

                <div className="col-12 col-md-4">
                    <div className="card border-0 shadow-sm rounded-4 p-3 bg-white h-100 border-start border-4 border-primary">
                        <span className="text-muted extra-small fw-semibold text-uppercase d-block mb-1">Saldo Neto Período</span>
                        <h4 className={`fw-bold mb-0 ${granTotalNeto >= 0 ? 'text-primary' : 'text-danger'}`}>
                            {formatearSoles(granTotalNeto)}
                        </h4>
                    </div>
                </div>
            </div>

            {/* BUSCADOR RÁPIDO */}
            <div className="mb-4">
                <div className="input-group shadow-sm rounded-3">
                    <span className="input-group-text bg-white border-0 ps-3 text-muted">
                        <i className="fa-solid fa-magnifying-glass"></i>
                    </span>
                    <input 
                        type="text" 
                        className="form-control border-0 py-2.5 bg-white shadow-none"
                        placeholder="Filtrar resultado por cliente, RUC/DNI, descripción de producto u observación..."
                        value={buscarFiltro}
                        onChange={(e) => setBuscarFiltro(e.target.value)}
                    />
                </div>
            </div>

            {/* LISTADO DE REPORTES AGRUPADOS NIVEL 1: NOMBRE DE CAJA */}
            {listaGruposCaja.length === 0 ? (
                <div className="card border-0 shadow-sm rounded-4 p-5 text-center bg-white">
                    <i className="fa-solid fa-folder-open text-muted fs-1 mb-2"></i>
                    <p className="text-muted mb-0">No se encontraron movimientos registrados para el rango de fechas seleccionado.</p>
                </div>
            ) : (
                listaGruposCaja.map(grupo => (
                    <div key={grupo.id} className="card border-0 shadow-sm rounded-4 p-4 mb-4 bg-white overflow-hidden">
                        
                        {/* HEADER DE GRUPO: NOMBRE DE CAJA */}
                        <div className="d-flex justify-content-between align-items-center border-bottom pb-3 mb-3 flex-wrap gap-2">
                            <div className="d-flex align-items-center gap-2">
                                <div className="rounded-3 p-2 bg-primary bg-opacity-10 text-primary d-flex align-items-center justify-content-center" style={{ width: '40px', height: '40px' }}>
                                    <i className="fa-solid fa-box-archive fs-5"></i>
                                </div>
                                <div>
                                    <h5 className="fw-bold text-dark mb-0">{grupo.nombre}</h5>
                                    <span className="text-muted extra-small">{grupo.movimientos.length} movimiento(s) registrado(s)</span>
                                </div>
                            </div>

                            {/* RESUMEN DE LA CAJA */}
                            <div className="d-flex gap-3 text-end">
                                <div>
                                    <span className="extra-small text-muted d-block">Ingresos</span>
                                    <strong className="text-success small">{formatearSoles(grupo.totalIngresos)}</strong>
                                </div>
                                <div className="border-start ps-3">
                                    <span className="extra-small text-muted d-block">Egresos</span>
                                    <strong className="text-danger small">{formatearSoles(grupo.totalEgresos)}</strong>
                                </div>
                                <div className="border-start ps-3">
                                    <span className="extra-small text-muted d-block">Saldo Neto</span>
                                    <strong className="text-dark small">{formatearSoles(grupo.neto)}</strong>
                                </div>
                            </div>
                        </div>

                        {/* TABLA ORDENADA */}
                        <div className="table-responsive">
                            <table className="table table-hover align-middle mb-0" style={{ minWidth: '850px' }}>
                                <thead className="table-light text-secondary extra-small fw-bold">
                                    <tr>
                                        <th style={{ width: '130px' }}>Fecha / Hora</th>
                                        <th style={{ width: '220px' }}>Cliente</th>
                                        <th style={{ width: '250px' }}>Descripción / Productos</th>
                                        <th style={{ width: '220px' }}>Desglose Categorías / Forma Pago</th>
                                        <th className="text-end" style={{ width: '130px' }}>Total (S/)</th>
                                        <th>Observación</th>
                                    </tr>
                                </thead>
                                <tbody className="small">
                                    {grupo.movimientos.map(m => {
                                        const valMonto = parseFloat(m.monto);
                                        const esIngreso = valMonto >= 0;

                                        return (
                                            <tr key={m.id}>
                                                {/* FECHA Y HORA */}
                                                <td>
                                                    <span className="fw-semibold text-dark d-block">{m.fecha}</span>
                                                    <span className="text-muted extra-small d-block">
                                                        <i className="fa-regular fa-clock me-1"></i>{m.hora}
                                                    </span>
                                                </td>

                                                {/* CLIENTE */}
                                                <td>
                                                    {m.cliente ? (
                                                        <>
                                                            <strong className="text-dark d-block text-truncate" style={{ maxWidth: '210px' }} title={m.cliente.razon}>
                                                                {m.cliente.razon}
                                                            </strong>
                                                            <span className="badge bg-light text-secondary border extra-small mt-0.5">
                                                                {m.cliente.num_documento || 'Sin doc.'}
                                                            </span>
                                                        </>
                                                    ) : (
                                                        <span className="text-muted italic">- Eventual -</span>
                                                    )}
                                                </td>

                                                {/* DESCRIPCIÓN Y PRODUCTOS */}
                                                <td>
                                                    <strong className="text-dark d-block">{m.descripcion}</strong>
                                                    {m.detalles_productos && m.detalles_productos.map((dp, i) => (
                                                        <span key={i} className="badge bg-light text-dark border extra-small me-1 mt-1 font-monospace">
                                                            📦 {dp.cantidad}x {dp.producto?.descripcion} ({formatearSoles(dp.importe)})
                                                        </span>
                                                    ))}
                                                    {m.garantia && (
                                                        <span className="badge bg-warning bg-opacity-25 text-dark border border-warning extra-small me-1 mt-1 d-block w-fit">
                                                            🛡️ Garantía: S/ {m.garantia.monto_garantia} ({m.garantia.estado})
                                                        </span>
                                                    )}
                                                </td>

                                                {/* DESGLOSE DE CATEGORÍAS */}
                                                <td>
                                                    {m.detalles && m.detalles.length > 0 ? (
                                                        m.detalles.map((d, i) => {
                                                            const imp = parseFloat(d.importe);
                                                            const esPendiente = d.categoria?.nombre?.toUpperCase() === 'PENDIENTE';
                                                            const colorClass = esPendiente ? 'text-primary' : (imp >= 0 ? 'text-success' : 'text-danger');
                                                            const icon = esPendiente ? 'fa-clock' : (imp >= 0 ? 'fa-circle-plus' : 'fa-circle-minus');

                                                            return (
                                                                <div key={i} className="d-flex align-items-center justify-content-between extra-small py-0.5 border-bottom border-light">
                                                                    <span className="fw-semibold text-secondary">
                                                                        <i className={`fa-solid ${icon} ${colorClass} me-1`}></i>
                                                                        {d.categoria?.nombre}:
                                                                    </span>
                                                                    <span className={`fw-bold ms-2 ${colorClass}`}>
                                                                        {formatearSoles(imp)}
                                                                    </span>
                                                                </div>
                                                            );
                                                        })
                                                    ) : (
                                                        <span className="text-muted extra-small">- Sin desglose -</span>
                                                    )}
                                                </td>

                                                {/* MONTO TOTAL OPERACIÓN */}
                                                <td className="text-end">
                                                    <span className={`fw-bold fs-6 ${esIngreso ? 'text-success' : 'text-danger'}`}>
                                                        {esIngreso ? '+ ' : ''}{formatearSoles(valMonto)}
                                                    </span>
                                                </td>

                                                {/* OBSERVACIÓN */}
                                                <td className="text-muted extra-small">
                                                    {m.observacion ? (
                                                        <span title={m.observacion}>{m.observacion}</span>
                                                    ) : (
                                                        <span>-</span>
                                                    )}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>

                    </div>
                ))
            )}

        </div>
    );
}

export default Reportes;