import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend
} from 'chart.js';
import { Bar } from 'react-chartjs-2';

ChartJS.register(
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend
);

function Dashboard() {
    const [metricas, setMetricas] = useState({
        saldo_total_cajas: 0,
        cajas_activas_count: 0,
        ingresos_hoy: 0,
        egresos_hoy: 0,
        saldo_neto_hoy: 0,
        resumen_cajas: [],
        resumen_categorias: []
    });

    const [cargando, setCargando] = useState(true);

    useEffect(() => {
        cargarMetricas();
    }, []);

    const cargarMetricas = async () => {
        try {
            const token = localStorage.getItem('token');
            const fechaHoy = new Date().toISOString().split('T')[0];

            const response = await axios.get(`/api/dashboard/metricas?fecha=${fechaHoy}`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            setMetricas(response.data);
        } catch (error) {
            console.error("Error al obtener datos del dashboard:", error);
        } finally {
            setCargando(false);
        }
    };

    const formatearSoles = (monto) => {
        const val = parseFloat(monto) || 0;
        return 'S/ ' + new Intl.NumberFormat('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(val);
    };

    // Configuración del gráfico de barras agrupadas por cada caja
    const dataGraficoCajas = {
        labels: metricas.resumen_cajas.map(item => item.caja),
        datasets: [
            {
                label: 'Ingresos (S/)',
                data: metricas.resumen_cajas.map(item => item.ingresos),
                backgroundColor: '#10b981',
                borderRadius: 6,
            },
            {
                label: 'Egresos (S/)',
                data: metricas.resumen_cajas.map(item => item.egresos),
                backgroundColor: '#ef4444',
                borderRadius: 6,
            }
        ]
    };

    const opcionesGrafico = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: 'top',
            }
        }
    };

    if (cargando) {
        return (
            <div className="text-center py-5">
                <div className="spinner-border text-primary" role="status"></div>
                <p className="text-muted small mt-2">Cargando métricas y tablas...</p>
            </div>
        );
    }

    return (
        <div className="container-fluid py-3">
            
            {/* ENCABEZADO */}
            <div className="d-flex justify-content-between align-items-center mb-4">
                <div>
                    <h4 className="fw-bold text-dark m-0">Dashboard Financiero</h4>
                    <span className="text-muted small">Resumen general de cajas y categorías</span>
                </div>
                <button 
                    onClick={() => { setCargando(true); cargarMetricas(); }}
                    className="btn btn-light border btn-sm fw-semibold d-inline-flex align-items-center gap-2"
                >
                    <i className="fa-solid fa-rotate"></i>
                    <span>Actualizar</span>
                </button>
            </div>

            {/* TARJETAS SUPERIORES */}
            <div className="row g-3 mb-4">
                <div className="col-12 col-sm-6 col-lg-3">
                    <div className="card border-0 shadow-sm rounded-4 p-3 bg-white h-100">
                        <span className="text-muted small fw-semibold d-block mb-1">Saldo Total en Cajas</span>
                        <h3 className="fw-bold text-primary mb-0">{formatearSoles(metricas.saldo_total_cajas)}</h3>
                    </div>
                </div>

                <div className="col-12 col-sm-6 col-lg-3">
                    <div className="card border-0 shadow-sm rounded-4 p-3 bg-white h-100">
                        <span className="text-muted small fw-semibold d-block mb-1">Cajas Activas</span>
                        <h3 className="fw-bold text-dark mb-0">{metricas.cajas_activas_count}</h3>
                    </div>
                </div>

                <div className="col-12 col-sm-6 col-lg-3">
                    <div className="card border-0 shadow-sm rounded-4 p-3 bg-white h-100">
                        <span className="text-muted small fw-semibold d-block mb-1">Ingresos de Hoy</span>
                        <h3 className="fw-bold text-success mb-0">{formatearSoles(metricas.ingresos_hoy)}</h3>
                    </div>
                </div>

                <div className="col-12 col-sm-6 col-lg-3">
                    <div className="card border-0 shadow-sm rounded-4 p-3 bg-white h-100">
                        <span className="text-muted small fw-semibold d-block mb-1">Egresos de Hoy</span>
                        <h3 className="fw-bold text-danger mb-0">{formatearSoles(metricas.egresos_hoy)}</h3>
                    </div>
                </div>
            </div>

            {/* GRÁFICO DE BARRAS POR CAJA */}
            <div className="card border-0 shadow-sm rounded-4 p-4 bg-white mb-4">
                <h6 className="fw-bold text-dark mb-3">
                    <i className="fa-solid fa-chart-column me-2 text-primary"></i>
                    Total de Ingresos y Egresos por Cada Caja
                </h6>
                <div style={{ minHeight: '300px' }}>
                    <Bar data={dataGraficoCajas} options={opcionesGrafico} />
                </div>
            </div>

            <div className="row g-4">
                
                {/* TABLA 1: TOTAL DE CAJAS (INGRESO, EGRESO Y NETO) */}
                <div className="col-12 col-lg-6">
                    <div className="card border-0 shadow-sm rounded-4 p-4 bg-white h-100">
                        <h6 className="fw-bold text-dark mb-3">
                            <i className="fa-solid fa-cash-register me-2 text-primary"></i>
                            Resumen Acumulado por Cajas
                        </h6>
                        <div className="table-responsive">
                            <table className="table table-hover align-middle mb-0 extra-small">
                                <thead className="table-light fw-bold">
                                    <tr>
                                        <th>Caja</th>
                                        <th className="text-end">Ingresos</th>
                                        <th className="text-end">Egresos</th>
                                        <th className="text-end">Neto</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {metricas.resumen_cajas.length === 0 ? (
                                        <tr>
                                            <td colSpan="4" className="text-center text-muted py-3">No hay cajas registradas.</td>
                                        </tr>
                                    ) : (
                                        metricas.resumen_cajas.map((c, idx) => (
                                            <tr key={idx}>
                                                <td className="fw-bold text-dark">{c.caja}</td>
                                                <td className="text-end text-success fw-semibold">{formatearSoles(c.ingresos)}</td>
                                                <td className="text-end text-danger fw-semibold">{formatearSoles(c.egresos)}</td>
                                                <td className={`text-end fw-bold ${c.neto >= 0 ? 'text-dark' : 'text-danger'}`}>
                                                    {formatearSoles(c.neto)}
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                {/* TABLA 2: DETALLE DE CAJAS CON SUS CATEGORÍAS ACUMULADAS */}
                <div className="col-12 col-lg-6">
                    <div className="card border-0 shadow-sm rounded-4 p-4 bg-white h-100">
                        <h6 className="fw-bold text-dark mb-3">
                            <i className="fa-solid fa-tags me-2 text-primary"></i>
                            Desglose de Categorías por Caja
                        </h6>
                        <div className="table-responsive" style={{ maxHeight: '350px', overflowY: 'auto' }}>
                            {metricas.resumen_categorias.map((grupo, idx) => (
                                <div key={idx} className="mb-3">
                                    <div className="p-2 bg-light rounded-3 fw-bold text-primary mb-2 border d-flex justify-content-between align-items-center">
                                        <span><i className="fa-solid fa-wallet me-1"></i> {grupo.caja}</span>
                                        <span className="badge bg-primary text-white">{grupo.categorias.length} Categ.</span>
                                    </div>

                                    {grupo.categorias.length === 0 ? (
                                        <span className="text-muted extra-small ms-2 d-block mb-2">Sin movimientos en categorías</span>
                                    ) : (
                                        <table className="table table-sm align-middle mb-2 extra-small">
                                            <thead className="table-light">
                                                <tr>
                                                    <th>Categoría</th>
                                                    <th>Tipo</th>
                                                    <th className="text-end">Suma Acumulada</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {grupo.categorias.map((cat, cIdx) => (
                                                    <tr key={cIdx}>
                                                        <td className="fw-bold">{cat.categoria}</td>
                                                        <td>
                                                            <span className={`badge ${cat.tipo === 'INGRESO' ? 'bg-success-subtle text-success' : 'bg-danger-subtle text-danger'}`}>
                                                                {cat.tipo}
                                                            </span>
                                                        </td>
                                                        <td className={`text-end fw-bold ${cat.total >= 0 ? 'text-success' : 'text-danger'}`}>
                                                            {formatearSoles(cat.total)}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

            </div>

        </div>
    );
}

export default Dashboard;