import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';

function Dashboard() {
    const [datos, setDatos] = useState(null);
    const [cargando, setCargando] = useState(true);

    const chartLineRef = useRef(null);
    const chartLineInstance = useRef(null);

    const chartBarRef = useRef(null);
    const chartBarInstance = useRef(null);

    useEffect(() => {
        cargarMetricasReales();
    }, []);

    const cargarMetricasReales = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get('/api/dashboard/metricas', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setDatos(res.data);
        } catch (e) {
            console.error("Error al obtener datos reales del dashboard", e);
        } finally {
            setCargando(false);
        }
    };

    // Gráfico de Líneas Principal
    useEffect(() => {
        if (!cargando && datos && datos.chart && chartLineRef.current) {
            if (chartLineInstance.current) {
                chartLineInstance.current.destroy();
            }

            const ctx = chartLineRef.current.getContext('2d');

            const gradientIngresos = ctx.createLinearGradient(0, 0, 0, 300);
            gradientIngresos.addColorStop(0, 'rgba(79, 70, 229, 0.25)');
            gradientIngresos.addColorStop(1, 'rgba(79, 70, 229, 0.0)');

            const gradientEgresos = ctx.createLinearGradient(0, 0, 0, 300);
            gradientEgresos.addColorStop(0, 'rgba(239, 68, 68, 0.2)');
            gradientEgresos.addColorStop(1, 'rgba(239, 68, 68, 0.0)');

            chartLineInstance.current = new window.Chart(ctx, {
                type: 'line',
                data: {
                    labels: datos.chart.labels,
                    datasets: [
                        {
                            label: 'Ingresos',
                            data: datos.chart.ingresos,
                            borderColor: '#4f46e5',
                            backgroundColor: gradientIngresos,
                            fill: true,
                            tension: 0.4,
                            borderWidth: 3,
                            pointRadius: 3
                        },
                        {
                            label: 'Egresos',
                            data: datos.chart.egresos,
                            borderColor: '#ef4444',
                            backgroundColor: gradientEgresos,
                            fill: true,
                            tension: 0.4,
                            borderWidth: 2,
                            pointRadius: 3
                        }
                    ]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: { legend: { display: false } },
                    scales: {
                        x: { grid: { display: false } },
                        y: { 
                            grid: { color: '#f1f5f9' },
                            ticks: { callback: (value) => `S/${value/1000}k` }
                        }
                    }
                }
            });
        }
    }, [cargando, datos]);

    // Mini Gráfico de Barras Verticales
    useEffect(() => {
        if (!cargando && datos && datos.cajas && chartBarRef.current) {
            if (chartBarInstance.current) {
                chartBarInstance.current.destroy();
            }

            const ctxBar = chartBarRef.current.getContext('2d');

            chartBarInstance.current = new window.Chart(ctxBar, {
                type: 'bar',
                data: {
                    labels: datos.cajas.map(c => c.nombre),
                    datasets: [{
                        data: datos.cajas.map(c => c.monto),
                        backgroundColor: datos.cajas.map(c => c.color),
                        borderRadius: 6,
                        barThickness: 20
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: { legend: { display: false } },
                    scales: {
                        x: { grid: { display: false }, ticks: { font: { size: 9 } } },
                        y: { display: false }
                    }
                }
            });
        }
    }, [cargando, datos]);

    if (cargando) {
        return (
            <div className="text-center py-5">
                <div className="spinner-border text-primary" role="status"></div>
                <p className="text-muted small mt-2">Cargando estadísticas del sistema...</p>
            </div>
        );
    }

    if (!datos) return null;

    return (
        <div className="container">
            <div className="w-100 overflow-hidden">
                {/* TARJETAS PRINCIPALES */}
                <div className="row g-3 mb-4">
                    <div className="col-12 col-sm-6 col-xl-3">
                        <div className="card border-0 shadow-sm rounded-4 p-3 bg-white h-100">
                            <div className="d-flex justify-content-between align-items-center mb-2">
                                <span className="text-muted small fw-semibold">Saldo Total</span>
                                <div className="rounded-circle p-2 d-flex align-items-center justify-content-center" style={{ width: '38px', height: '38px', backgroundColor: '#e0e7ff', color: '#4f46e5' }}>
                                    <i className="fa-solid fa-wallet"></i>
                                </div>
                            </div>
                            <h3 className="fw-bold text-dark mb-1 text-truncate">
                                S/ {datos.saldo_total.toLocaleString('es-PE', { minimumFractionDigits: 2 })}
                            </h3>
                            <span className="text-muted small">{datos.total_cajas_activas || datos.cajas.length} cajas activas</span>
                        </div>
                    </div>

                    <div className="col-12 col-sm-6 col-xl-3">
                        <div className="card border-0 shadow-sm rounded-4 p-3 bg-white h-100">
                            <div className="d-flex justify-content-between align-items-center mb-2">
                                <span className="text-muted small fw-semibold">Ingresos del mes</span>
                                <div className="rounded-circle p-2 text-success d-flex align-items-center justify-content-center" style={{ width: '38px', height: '38px', backgroundColor: '#d1fae5' }}>
                                    <i className="fa-solid fa-arrow-trend-up"></i>
                                </div>
                            </div>
                            <h3 className="fw-bold text-dark mb-1 text-truncate">
                                S/ {datos.ingresos_mes.toLocaleString('es-PE', { minimumFractionDigits: 2 })}
                            </h3>
                            <span className="text-success small fw-semibold">
                                <i className="fa-solid fa-arrow-up me-1"></i>+8.4% vs mes anterior
                            </span>
                        </div>
                    </div>

                    <div className="col-12 col-sm-6 col-xl-3">
                        <div className="card border-0 shadow-sm rounded-4 p-3 bg-white h-100">
                            <div className="d-flex justify-content-between align-items-center mb-2">
                                <span className="text-muted small fw-semibold">Egresos del mes</span>
                                <div className="rounded-circle p-2 text-danger d-flex align-items-center justify-content-center" style={{ width: '38px', height: '38px', backgroundColor: '#fee2e2' }}>
                                    <i className="fa-solid fa-arrow-trend-down"></i>
                                </div>
                            </div>
                            <h3 className="fw-bold text-dark mb-1 text-truncate">
                                S/ {datos.egresos_mes.toLocaleString('es-PE', { minimumFractionDigits: 2 })}
                            </h3>
                            <span className="text-danger small fw-semibold">
                                <i className="fa-solid fa-arrow-down me-1"></i>-2.1% vs mes anterior
                            </span>
                        </div>
                    </div>

                    <div className="col-12 col-sm-6 col-xl-3">
                        <div className="card border-0 shadow-sm rounded-4 p-3 bg-white h-100">
                            <div className="d-flex justify-content-between align-items-center mb-2">
                                <span className="text-muted small fw-semibold">Balance general</span>
                                <div className="rounded-circle p-2 text-warning d-flex align-items-center justify-content-center" style={{ width: '38px', height: '38px', backgroundColor: '#fef3c7' }}>
                                    <i className="fa-solid fa-scale-balanced"></i>
                                </div>
                            </div>
                            <h3 className="fw-bold text-dark mb-1 text-truncate">
                                S/ {datos.balance_general.toLocaleString('es-PE', { minimumFractionDigits: 2 })}
                            </h3>
                            <span className="text-success small fw-semibold">
                                <i className="fa-solid fa-chart-line me-1"></i>Resultado neto del mes
                            </span>
                        </div>
                    </div>
                </div>

                {/* SECCIÓN INTERMEDIA: GRÁFICO TENDENCIA + SALDO POR CAJA */}
                <div className="row g-3 mb-4">
                    <div className="col-12 col-xl-8">
                        <div className="card border-0 shadow-sm rounded-4 p-4 bg-white h-100 overflow-hidden">
                            <div className="d-flex justify-content-between align-items-center mb-3">
                                <h6 className="fw-bold text-dark m-0">Ingresos vs Egresos — 2026</h6>
                                <div className="d-flex gap-3 small">
                                    <span className="text-secondary"><i className="fa-solid fa-circle text-danger fs-8 me-1"></i> Egresos</span>
                                    <span className="text-secondary"><i className="fa-solid fa-circle text-primary fs-8 me-1"></i> Ingresos</span>
                                </div>
                            </div>
                            <div style={{ height: '280px', width: '100%', position: 'relative' }}>
                                <canvas ref={chartLineRef}></canvas>
                            </div>
                        </div>
                    </div>

                    <div className="col-12 col-xl-4">
                        <div className="card border-0 shadow-sm rounded-4 p-4 bg-white h-100 d-flex flex-column justify-content-between overflow-hidden">
                            <h6 className="fw-bold text-dark mb-3">Saldo por caja</h6>
                            
                            <div className="d-flex flex-column gap-3 mb-3">
                                {datos.cajas.map((caja) => (
                                    <div key={caja.id}>
                                        <div className="d-flex justify-content-between small fw-semibold mb-1">
                                            <span className="text-dark text-truncate" style={{ maxWidth: '140px' }}>{caja.nombre}</span>
                                            <span className="text-muted">S/ {caja.monto.toLocaleString('es-PE', { minimumFractionDigits: 2 })}</span>
                                        </div>
                                        <div className="progress" style={{ height: '6px' }}>
                                            <div 
                                                className="progress-bar rounded" 
                                                role="progressbar" 
                                                style={{ width: `${caja.pct}%`, backgroundColor: caja.color }}
                                            ></div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div style={{ height: '110px', width: '100%', position: 'relative' }}>
                                <canvas ref={chartBarRef}></canvas>
                            </div>
                        </div>
                    </div>
                </div>

                {/* SECCIÓN INFERIOR: ÚLTIMOS MOVIMIENTOS */}
                <div className="card border-0 shadow-sm rounded-4 p-4 bg-white">
                    <div className="d-flex justify-content-between align-items-center mb-3">
                        <h6 className="fw-bold text-dark m-0">Últimos movimientos</h6>
                        <span className="badge bg-light text-secondary rounded-pill px-3 py-2 fw-semibold">
                            {datos.total_registros} registros
                        </span>
                    </div>

                    <div className="d-flex flex-column">
                        {datos.ultimos_movimientos.length === 0 ? (
                            <p className="text-muted small my-3 text-center">No hay movimientos recientes.</p>
                        ) : (
                            datos.ultimos_movimientos.map((m, idx) => {
                                const esPositivo = parseFloat(m.monto) >= 0;
                                return (
                                    <div 
                                        key={m.id} 
                                        className={`d-flex align-items-center justify-content-between py-3 flex-wrap gap-2 ${idx !== datos.ultimos_movimientos.length - 1 ? 'border-bottom' : ''}`}
                                    >
                                        <div className="d-flex align-items-center gap-3">
                                            <div 
                                                className="rounded-circle d-flex align-items-center justify-content-center flex-shrink-0" 
                                                style={{ 
                                                    width: '42px', 
                                                    height: '42px', 
                                                    backgroundColor: esPositivo ? '#d1fae5' : '#fee2e2',
                                                    color: esPositivo ? '#10b981' : '#ef4444'
                                                }}
                                            >
                                                <i className={`fa-solid ${esPositivo ? 'fa-arrow-trend-up' : 'fa-arrow-trend-down'}`}></i>
                                            </div>
                                            <div>
                                                <h6 className="mb-0 fw-bold text-dark small">{m.descripcion}</h6>
                                                <span className="text-muted extra-small">
                                                    {m.caja ? m.caja.nombre : 'Caja General'} · {m.fecha}
                                                </span>
                                            </div>
                                        </div>

                                        <div className={`fw-bold fs-6 ms-auto ${esPositivo ? 'text-success' : 'text-danger'}`}>
                                            {esPositivo ? '+S/ ' : '-S/ '}
                                            {Math.abs(parseFloat(m.monto)).toLocaleString('es-PE', { minimumFractionDigits: 2 })}
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>

            </div>
        </div>
    );
}

export default Dashboard;