import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Swal from 'sweetalert2';
import DataTable from 'react-data-table-component';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

function Reportes() {
    const [cajas, setCajas] = useState([]);
    const [categorias, setCategorias] = useState([]);
    const [movimientos, setMovimientos] = useState([]);
    const [cargando, setCargando] = useState(false);

    // Helper fecha Perú YYYY-MM-DD
    const obtenerFechaPeru = () => {
        const opciones = { timeZone: 'America/Lima', year: 'numeric', month: '2-digit', day: '2-digit' };
        const partes = new Intl.DateTimeFormat('es-PE', opciones).formatToParts(new Date());
        const d = partes.find(p => p.type === 'day').value;
        const m = partes.find(p => p.type === 'month').value;
        const a = partes.find(p => p.type === 'year').value;
        return `${a}-${m}-${d}`;
    };

    const fechaHoy = obtenerFechaPeru();

    // Filtros del Reporte
    const [cajaIdFilter, setCajaIdFilter] = useState('TODAS'); // 'TODAS' o ID
    const [fechaDesde, setFechaDesde] = useState(fechaHoy);
    const [fechaHasta, setFechaHasta] = useState(fechaHoy);
    const [buscarText, setBuscarText] = useState('');

    useEffect(() => {
        cargarInicial();
    }, []);

    const cargarInicial = async () => {
        try {
            const token = localStorage.getItem('token');
            const config = { headers: { Authorization: `Bearer ${token}` } };

            const [resCajas, resCats] = await Promise.all([
                axios.get('/api/cajas', config),
                axios.get('/api/categorias', config)
            ]);

            const listaCajas = Array.isArray(resCajas.data) ? resCajas.data : (resCajas.data.cajas || []);
            setCajas(listaCajas);
            setCategorias(Array.isArray(resCats.data) ? resCats.data : []);

            consultarReporte();
        } catch (error) {
            console.error("Error al cargar datos iniciales", error);
        }
    };

    const consultarReporte = async () => {
        if (fechaDesde > fechaHasta) {
            Swal.fire('Atención', 'La fecha "Desde" no puede ser mayor que la fecha "Hasta".', 'warning');
            return;
        }

        setCargando(true);
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get(`/api/movimientos?fecha_desde=${fechaDesde}&fecha_hasta=${fechaHasta}`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            const data = Array.isArray(res.data) ? res.data : [];
            setMovimientos(data);
        } catch (error) {
            console.error("Error al consultar reporte", error);
            Swal.fire('Error', 'No se pudieron obtener los movimientos.', 'error');
        } finally {
            setCargando(false);
        }
    };

    const formatearSoles = (monto) => {
        const val = parseFloat(monto) || 0;
        return new Intl.NumberFormat('en-US', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }).format(val);
    };

    // Filtro local por caja y búsqueda
    const movimientosFiltrados = movimientos.filter(m => {
        const perteneceCaja = (cajaIdFilter === 'TODAS') ? true : m.caja_id == cajaIdFilter;
        if (!perteneceCaja) return false;
        if (!buscarText.trim()) return true;

        const term = buscarText.toLowerCase();
        const descMatch = m.descripcion?.toLowerCase().includes(term);
        const cliMatch = m.cliente?.razon?.toLowerCase().includes(term) || m.cliente?.num_documento?.includes(term);
        const prodMatch = m.producto?.descripcion?.toLowerCase().includes(term);
        return descMatch || cliMatch || prodMatch;
    });

    // Totales del período
    const totalIngresos = movimientosFiltrados.filter(m => parseFloat(m.monto) > 0).reduce((acc, m) => acc + parseFloat(m.monto), 0);
    const totalEgresos = movimientosFiltrados.filter(m => parseFloat(m.monto) < 0).reduce((acc, m) => acc + Math.abs(parseFloat(m.monto)), 0);
    const saldoNeto = movimientosFiltrados.reduce((acc, m) => acc + parseFloat(m.monto), 0);


    // =========================================================
    // 📄 GENERACIÓN DE PDF: TABLA CRUZADA (SOLO CATEGORÍAS DE INGRESO)
    // =========================================================
    const generarPDF = () => {
        if (movimientosFiltrados.length === 0) {
            Swal.fire('Atención', 'No hay datos en la tabla para exportar.', 'warning');
            return;
        }

        const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });

        // Nombre de la caja filtrada
        const nombreCaja = cajaIdFilter === 'TODAS' 
            ? 'TODAS LAS CAJAS' 
            : (cajas.find(c => c.id == cajaIdFilter)?.nombre || 'CAJA').toUpperCase();

        // 1. TÍTULO Y SUBTÍTULO
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(13);
        doc.text(`REPORTE DE MOVIMIENTO DE CAJA ${nombreCaja}`, 148, 12, { align: 'center' });

        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');
        doc.text(`Reporte interno entre las fechas ${fechaDesde} y ${fechaHasta}`, 148, 17, { align: 'center' });

        // FILTRAR ÚNICAMENTE LAS CATEGORÍAS DE TIPO INGRESO PARA LAS COLUMNAS
        const categoriasIngreso = categorias.filter(c => {
            const t = c.tipo ? c.tipo.toLowerCase() : '';
            return t === 'ingreso' || t === 'ingresos';
        }).map(c => ({ id: c.id, nombre: c.nombre.toUpperCase() }));

        // ENCABEZADOS DE LA TABLA: Primeras 4 columnas + Categorías de Ingreso + TOTAL
        const tableHeaders = [
            'Fecha y Hora',
            'Caja',
            'Cliente',
            'Descripción y Producto',
            ...categoriasIngreso.map(c => c.nombre),
            'TOTAL'
        ];

        // MAPPING DE FILAS Y TOTALES
        const tableRows = [];
        const acumTotalesColumna = {};
        categoriasIngreso.forEach(c => { acumTotalesColumna[c.id] = 0; });
        let granTotalGeneral = 0;

        movimientosFiltrados.forEach(m => {
            const fechaHora = `${m.fecha}\n${m.hora}`;
            const cajaNombre = m.caja?.nombre || '-';
            const clienteStr = m.cliente ? `${m.cliente.razon}\n${m.cliente.num_documento || ''}` : '-';
            const descProd = `${m.descripcion}${m.producto ? '\n' + m.producto.descripcion : ''}`;

            const totalMontoFila = parseFloat(m.monto || 0);

            // Mapear valores únicamente para categorías de tipo INGRESO
            const rowCatCells = categoriasIngreso.map(cat => {
                let montoCatEnFila = 0;

                if (m.detalles && m.detalles.length > 0) {
                    const det = m.detalles.find(d => d.categoria_id === cat.id);
                    if (det) {
                        montoCatEnFila = parseFloat(det.importe);
                    }
                }

                // Solo si el valor es positivo (> 0) lo acumulamos y mostramos en la columna
                if (montoCatEnFila > 0) {
                    acumTotalesColumna[cat.id] += montoCatEnFila;
                    return formatearSoles(montoCatEnFila);
                }
                
                // Si no hay ingreso en esta categoría, la celda queda vacía
                return '';
            });

            granTotalGeneral += totalMontoFila;

            tableRows.push([
                fechaHora,
                cajaNombre,
                clienteStr,
                descProd,
                ...rowCatCells,
                formatearSoles(totalMontoFila) // Si es egreso negativo, viaja directamente a TOTAL
            ]);
        });

        // FILA DE TOTALES EN EL PIE DE LA TABLA
        const totalRow = [
            '',
            '',
            '',
            'TOTAL',
            ...categoriasIngreso.map(cat => formatearSoles(acumTotalesColumna[cat.id])),
            formatearSoles(granTotalGeneral)
        ];

        tableRows.push(totalRow);

        // CONFIGURACIÓN DE AUTOTABLE
        autoTable(doc, {
            startY: 22,
            head: [tableHeaders],
            body: tableRows,
            theme: 'grid',
            headStyles: {
                fillColor: [120, 120, 120], // Fondo gris de encabezados
                textColor: [255, 255, 255],
                fontStyle: 'bold',
                halign: 'center',
                valign: 'middle',
                fontSize: 8
            },
            bodyStyles: {
                fontSize: 7.5,
                valign: 'middle'
            },
            columnStyles: {
                0: { cellWidth: 26, halign: 'center', fontStyle: 'bold' },
                1: { cellWidth: 20, halign: 'center' },
                2: { cellWidth: 38 },
                3: { cellWidth: 42 }
            },
            didParseCell: function (data) {
                // Alineación a la derecha para celdas numéricas
                if (data.column.index >= 4) {
                    data.cell.styles.halign = 'right';
                }
                // Resaltado de la fila de totales
                if (data.row.index === tableRows.length - 1) {
                    data.cell.styles.fontStyle = 'bold';
                    data.cell.styles.fillColor = [240, 240, 240];
                }
            }
        });

        // =========================================================
        // 📊 SEGUNDA TABLA: REPORTE OTRAS CAJAS (SALDOS TOTALES)
        // =========================================================
        const finalY = doc.lastAutoTable.finalY + 8;

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(11);
        doc.text('Reporte Otras Cajas', 14, finalY);

        const otrasCajasRows = [];
        cajas.forEach(c => {
            const movsCaja = movimientos.filter(m => m.caja_id == c.id);
            const saldoCaja = movsCaja.reduce((acc, m) => acc + parseFloat(m.monto), 0);
            otrasCajasRows.push([c.nombre.toUpperCase(), formatearSoles(saldoCaja)]);
        });

        autoTable(doc, {
            startY: finalY + 3,
            head: [],
            body: otrasCajasRows,
            theme: 'grid',
            tableWidth: 65,
            margin: { left: 14 },
            bodyStyles: {
                fontSize: 8,
                fontStyle: 'bold'
            },
            columnStyles: {
                0: { cellWidth: 38, halign: 'left' },
                1: { cellWidth: 27, halign: 'right' }
            }
        });

        doc.save(`Reporte_Movimiento_Caja_${fechaDesde}_al_${fechaHasta}.pdf`);
    };

    // Columnas para el DataTable en pantalla
    const columnasReporte = [
        {
            name: 'Fecha / Hora',
            selector: row => `${row.fecha} ${row.hora}`,
            sortable: true,
            width: '180px',
            cell: row => {
                const nombreUsuario = row.user?.name || 'Usuario';
                const inicialUsuario = nombreUsuario.charAt(0).toUpperCase();
                return (
                    <div className="d-flex align-items-center gap-2 py-1">
                        <div 
                            className="rounded-circle fw-bold text-white d-flex align-items-center justify-content-center flex-shrink-0 shadow-sm"
                            style={{ width: '28px', height: '28px', backgroundColor: '#4f46e5', fontSize: '0.8rem' }}
                            title={`Registrado/Editado por: ${nombreUsuario}`}
                        >
                            {inicialUsuario}
                        </div>
                        <div>
                            <span className="fw-bold text-dark d-block">{row.fecha}</span>
                            <span className="text-muted extra-small"><i className="fa-regular fa-clock me-1"></i>{row.hora}</span>
                        </div>
                    </div>
                );
            }
        },
        {
            name: 'Caja',
            selector: row => row.caja ? row.caja.nombre : '',
            sortable: true,
            width: '120px',
            cell: row => (
                <span className="badge bg-light text-primary border px-2 py-1 fw-semibold">
                    <i className="fa-solid fa-cash-register me-1"></i>
                    {row.caja ? row.caja.nombre : 'Caja'}
                </span>
            )
        },
        {
            name: 'Cliente',
            selector: row => row.cliente ? row.cliente.razon : '',
            sortable: true,
            cell: row => (
                row.cliente ? (
                    <div>
                        <span className="fw-bold text-dark d-block">{row.cliente.razon}</span>
                        <span className="text-muted extra-small">{row.cliente.num_documento}</span>
                    </div>
                ) : <span className="text-muted">-</span>
            )
        },
        {
            name: 'Descripción / Producto',
            selector: row => row.descripcion,
            sortable: true,
            grow: 1.5,
            cell: row => (
                <div>
                    <strong className="text-dark d-block">{row.descripcion}</strong>
                    {row.producto && (
                        <span className="badge bg-light text-secondary border extra-small mt-1">
                            <i className="fa-solid fa-box me-1"></i>{row.producto.descripcion}
                        </span>
                    )}
                </div>
            )
        },
        {
            name: 'Categorías (Desglose)',
            cell: row => (
                row.detalles && row.detalles.length > 0 ? (
                    <div className="d-flex flex-column gap-1 py-1">
                        {row.detalles.map((d, i) => {
                            const imp = parseFloat(d.importe);
                            const esIng = imp >= 0;
                            return (
                                <span key={i} className={`extra-small d-inline-flex align-items-center gap-1 ${esIng ? 'text-success' : 'text-danger'}`}>
                                    <i className={`fa-solid ${esIng ? 'fa-plus-circle' : 'fa-minus-circle'}`}></i>
                                    <strong>{d.categoria?.nombre}:</strong> S/ {formatearSoles(imp)}
                                </span>
                            );
                        })}
                    </div>
                ) : <span className="text-muted">-</span>
            )
        },
        {
            name: 'Monto (S/)',
            selector: row => parseFloat(row.monto),
            sortable: true,
            right: true,
            width: '135px',
            cell: row => {
                const val = parseFloat(row.monto);
                const esPos = val >= 0;
                return (
                    <span className={`fw-bold fs-6 ${esPos ? 'text-success' : 'text-danger'}`}>
                        {esPos ? '+' : ''} S/ {formatearSoles(val)}
                    </span>
                );
            }
        },
        {
            name: 'Observación',
            selector: row => row.observacion || '',
            sortable: true,
            cell: row => <span className="text-muted extra-small">{row.observacion || '-'}</span>
        }
    ];

    const opcionesPaginacion = {
        rowsPerPageText: 'Filas por página:',
        rangeSeparatorText: 'de',
        selectAllRowsItem: true,
        selectAllRowsItemText: 'Todos'
    };

    return (
        <div className="w-100">
            
            {/* PANEL DE FILTROS Y BOTÓN PDF */}
            <div className="card border-0 shadow-sm rounded-4 p-4 mb-4 bg-white">
                <div className="d-flex justify-content-between align-items-center mb-3">
                    <h6 className="fw-bold text-dark m-0">
                        <i className="fa-solid fa-filter text-primary me-2"></i>
                        Filtros del Reporte
                    </h6>

                    <button 
                        onClick={generarPDF}
                        disabled={cargando || movimientosFiltrados.length === 0}
                        className="btn btn-danger fw-semibold px-3 py-2 rounded-3 shadow-sm d-inline-flex align-items-center gap-2"
                    >
                        <i className="fa-solid fa-file-pdf fs-6"></i>
                        <span>Descargar PDF</span>
                    </button>
                </div>

                <div className="row g-3 align-items-end">
                    
                    <div className="col-12 col-sm-6 col-md-3">
                        <label className="form-label small fw-semibold text-secondary mb-1">Fecha Desde *</label>
                        <input 
                            type="date" 
                            className="form-control rounded-3 py-2 px-3 border-light-subtle bg-light text-dark fw-semibold" 
                            value={fechaDesde}
                            onChange={(e) => setFechaDesde(e.target.value)}
                        />
                    </div>

                    <div className="col-12 col-sm-6 col-md-3">
                        <label className="form-label small fw-semibold text-secondary mb-1">Fecha Hasta *</label>
                        <input 
                            type="date" 
                            className="form-control rounded-3 py-2 px-3 border-light-subtle bg-light text-dark fw-semibold" 
                            value={fechaHasta}
                            onChange={(e) => setFechaHasta(e.target.value)}
                        />
                    </div>

                    <div className="col-12 col-sm-6 col-md-3">
                        <label className="form-label small fw-semibold text-secondary mb-1">Caja Seleccionada</label>
                        <select 
                            className="form-select rounded-3 py-2 border-light-subtle bg-light text-dark"
                            value={cajaIdFilter}
                            onChange={(e) => setCajaIdFilter(e.target.value)}
                        >
                            <option value="TODAS">-- Todas las Cajas --</option>
                            {cajas.map(c => (
                                <option key={c.id} value={c.id}>{c.nombre}</option>
                            ))}
                        </select>
                    </div>

                    <div className="col-12 col-sm-6 col-md-3">
                        <button 
                            onClick={consultarReporte}
                            disabled={cargando}
                            className="btn text-white fw-semibold w-100 py-2 rounded-3 shadow-sm d-flex align-items-center justify-content-center gap-2"
                            style={{ backgroundColor: '#4f46e5', border: 'none' }}
                        >
                            {cargando ? (
                                <span className="spinner-border spinner-border-sm" role="status"></span>
                            ) : (
                                <i className="fa-solid fa-magnifying-glass"></i>
                            )}
                            <span>{cargando ? 'Consultando...' : 'Mostrar Reporte'}</span>
                        </button>
                    </div>

                </div>
            </div>

            {/* TARJETAS DE MÉTRICAS */}
            <div className="row g-3 mb-4">
                <div className="col-12 col-md-4">
                    <div className="card border-0 shadow-sm rounded-4 p-3 bg-white h-100">
                        <div className="d-flex justify-content-between align-items-center mb-1">
                            <span className="text-muted small fw-semibold">Ingresos Totales (Período)</span>
                            <div className="rounded-circle p-2 text-success d-flex align-items-center justify-content-center" style={{ width: '36px', height: '36px', backgroundColor: '#d1fae5' }}>
                                <i className="fa-solid fa-arrow-trend-up"></i>
                            </div>
                        </div>
                        <h3 className="fw-bold text-success mb-0">S/ {formatearSoles(totalIngresos)}</h3>
                    </div>
                </div>

                <div className="col-12 col-md-4">
                    <div className="card border-0 shadow-sm rounded-4 p-3 bg-white h-100">
                        <div className="d-flex justify-content-between align-items-center mb-1">
                            <span className="text-muted small fw-semibold">Egresos Totales (Período)</span>
                            <div className="rounded-circle p-2 text-danger d-flex align-items-center justify-content-center" style={{ width: '36px', height: '36px', backgroundColor: '#fee2e2' }}>
                                <i className="fa-solid fa-arrow-trend-down"></i>
                            </div>
                        </div>
                        <h3 className="fw-bold text-danger mb-0">S/ {formatearSoles(totalEgresos)}</h3>
                    </div>
                </div>

                <div className="col-12 col-md-4">
                    <div className="card border-0 shadow-sm rounded-4 p-3 bg-white h-100">
                        <div className="d-flex justify-content-between align-items-center mb-1">
                            <span className="text-muted small fw-semibold">Saldo Neto del Período</span>
                            <div className="rounded-circle p-2 d-flex align-items-center justify-content-center" style={{ width: '36px', height: '36px', backgroundColor: '#e0e7ff', color: '#4f46e5' }}>
                                <i className="fa-solid fa-chart-line"></i>
                            </div>
                        </div>
                        <h3 className={`fw-bold mb-0 ${saldoNeto >= 0 ? 'text-dark' : 'text-danger'}`}>
                            S/ {formatearSoles(saldoNeto)}
                        </h3>
                    </div>
                </div>
            </div>

            {/* TABLA DATATABLE */}
            <div className="card border-0 shadow-sm rounded-4 p-4 bg-white">
                <div className="row g-3 align-items-center justify-content-between mb-3">
                    <div className="col-12 col-md-6">
                        <h6 className="fw-bold text-dark m-0">Detalle de Movimientos Encontrados</h6>
                    </div>
                    <div className="col-12 col-md-6">
                        <div className="input-group input-group-sm">
                            <span className="input-group-text bg-light border-0 text-muted ps-3">
                                <i className="fa-solid fa-magnifying-glass"></i>
                            </span>
                            <input 
                                type="text" 
                                className="form-control form-control-sm bg-light border-0 ps-2 py-2 rounded-end-3" 
                                placeholder="Filtrar resultado por cliente, descripción..." 
                                value={buscarText} 
                                onChange={(e) => setBuscarText(e.target.value)} 
                            />
                        </div>
                    </div>
                </div>

                <DataTable
                    columns={columnasReporte}
                    data={movimientosFiltrados}
                    pagination
                    paginationPerPage={10}
                    paginationRowsPerPageOptions={[10, 20, 50, 100]}
                    paginationComponentOptions={opcionesPaginacion}
                    noDataComponent={<div className="py-4 text-muted text-center">No se encontraron movimientos para el rango de fechas seleccionado.</div>}
                    highlightOnHover
                    responsive
                />
            </div>

        </div>
    );
}

export default Reportes;