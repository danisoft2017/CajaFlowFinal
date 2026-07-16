import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

function Movimientos() {
    const [cajas, setCajas] = useState([]);
    const [categorias, setCategorias] = useState([]);
    const [movimientos, setMovimientos] = useState([]);

    // Caja seleccionada para filtrar (Filtro superior)
    const [cajaActivaId, setCajaActivaId] = useState(null);

    // Campos del formulario
    const [fecha, setFecha] = useState(new Date().toISOString().split('T')[0]); // Fecha de hoy por defecto
    const [hora, setHora] = useState(new Date().toTimeString().split(' ')[0].substring(0, 5)); // Hora actual por defecto
    const [descripcion, setDescripcion] = useState('');
    const [categoriaId, setCategoriaId] = useState('');
    const [monto, setMonto] = useState('');

    const navigate = useNavigate();

    useEffect(() => {
        cargarDatosIniciales();
    }, []);

    const cargarDatosIniciales = async () => {
        try {
            const token = localStorage.getItem('token');
            const config = { headers: { Authorization: `Bearer ${token}` } };

            // Cargar Cajas, Categorías y Movimientos en paralelo
            const [resCajas, resCategorias, resMovimientos] = await Promise.all([
                axios.get('/api/cajas', config),
                axios.get('/api/categorias', config),
                axios.get('/api/movimientos', config)
            ]);

            setCajas(resCajas.data);
            setCategorias(resCategorias.data);
            setMovimientos(resMovimientos.data);

            // Si hay cajas, activar la primera por defecto en los botones superiores
            if (resCajas.data.length > 0) {
                setCajaActivaId(resCajas.data[0].id);
            }
        } catch (error) {
            console.error("Error al cargar los datos", error);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!cajaActivaId) {
            alert("Primero debes registrar o seleccionar una caja.");
            return;
        }
        if (!categoriaId) {
            alert("Por favor, selecciona una categoría.");
            return;
        }

        try {
            const token = localStorage.getItem('token');
            const response = await axios.post('/api/movimientos', {
                fecha,
                hora,
                descripcion,
                caja_id: cajaActivaId, // Se asocia a la caja actualmente seleccionada en el tab
                categoria_id: categoriaId,
                monto: parseFloat(monto)
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });

            // Limpiar campos e inicializar hora
            setDescripcion('');
            setMonto('');
            setCategoriaId('');
            setHora(new Date().toTimeString().split(' ')[0].substring(0, 5));

            // Recargar movimientos de la base de datos
            const resMovimientos = await axios.get('/api/movimientos', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setMovimientos(resMovimientos.data);
        } catch (error) {
            alert("Error al registrar el movimiento");
        }
    };

    // 1. Filtrar movimientos correspondientes a la caja activa seleccionada arriba
    const movimientosFiltrados = movimientos.filter(mov => mov.caja_id === cajaActivaId);

    // 2. Calcular los totales de forma interactiva sobre la lista filtrada
    let totalIngreso = 0;
    let totalEgreso = 0;

    movimientosFiltrados.forEach(mov => {
        const valor = parseFloat(mov.monto);
        if (mov.categoria?.tipo === 'Ingreso') {
            totalIngreso += valor;
        } else if (mov.categoria?.tipo === 'Egreso') {
            totalEgreso += valor;
        }
    });

    const neto = totalIngreso - totalEgreso;

    return (
        <div style={{ background: '#fff', padding: '20px', borderRadius: '5px', maxWidth: '900px', margin: '20px auto' }}>
            
            {/* Botón de regreso */}
            <div style={{ marginBottom: '20px' }}>
                <button 
                    onClick={() => navigate('/dashboard')} 
                    style={{ padding: '8px 12px', cursor: 'pointer', fontWeight: 'bold' }}
                >
                    ← Volver al Dashboard
                </button>
            </div>

            <h2>Módulo de Movimientos (CajaFlow)</h2>

            {/* BOTONES TIPO TABS SUPERIORES PARA FILTRAR POR CAJA */}
            <div style={{ marginBottom: '20px', borderBottom: '1px solid #ccc', paddingBottom: '10px' }}>
                <span style={{ marginRight: '10px', fontWeight: 'bold' }}>Filtrar por Caja:</span>
                {cajas.length === 0 ? (
                    <span style={{ color: 'red' }}>Registra una caja primero en el módulo de Cajas.</span>
                ) : (
                    cajas.map(caja => (
                        <button
                            key={caja.id}
                            onClick={() => setCajaActivaId(caja.id)}
                            style={{
                                padding: '8px 15px',
                                marginRight: '5px',
                                cursor: 'pointer',
                                background: cajaActivaId === caja.id ? '#000' : '#e0e0e0',
                                color: cajaActivaId === caja.id ? '#fff' : '#000',
                                border: '1px solid #ccc',
                                fontWeight: 'bold'
                            }}
                        >
                            {caja.nombre}
                        </button>
                    ))
                )}
            </div>

            {/* FORMULARIO DE NUEVO REGISTRO */}
            <form onSubmit={handleSubmit} style={{ background: '#f9f9f9', padding: '15px', borderRadius: '4px', marginBottom: '20px' }}>
                <h3>Registrar Movimiento en la Caja Seleccionada</h3>
                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '10px' }}>
                    <div>
                        <label style={{ display: 'block' }}>Fecha:</label>
                        <input type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} required style={{ padding: '5px' }} />
                    </div>
                    <div>
                        <label style={{ display: 'block' }}>Hora:</label>
                        <input type="time" value={hora} onChange={(e) => setHora(e.target.value)} required style={{ padding: '5px' }} />
                    </div>
                    <div>
                        <label style={{ display: 'block' }}>Descripción:</label>
                        <input type="text" value={descripcion} onChange={(e) => setDescripcion(e.target.value)} placeholder="Ej: Pago de Luz" required style={{ padding: '5px', width: '200px' }} />
                    </div>
                    <div>
                        <label style={{ display: 'block' }}>Categoría:</label>
                        <select value={categoriaId} onChange={(e) => setCategoriaId(e.target.value)} required style={{ padding: '5px', width: '180px' }}>
                            <option value="">-- Seleccionar --</option>
                            {categorias.map(cat => (
                                <option key={cat.id} value={cat.id}>
                                    {cat.nombre} ({cat.tipo})
                                </option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label style={{ display: 'block' }}>Monto S/:</label>
                        <input type="number" step="0.01" min="0.01" value={monto} onChange={(e) => setMonto(e.target.value)} placeholder="0.00" required style={{ padding: '5px', width: '100px' }} />
                    </div>
                </div>
                <button type="submit" style={{ padding: '6px 15px', cursor: 'pointer', fontWeight: 'bold' }}>
                    Guardar Movimiento
                </button>
            </form>

            <hr />

            {/* TABLA DE MOVIMIENTOS CON COLUMNAS DE INGRESO Y EGRESO */}
            <h3>Movimientos Registrados</h3>
            <table border="1" cellPadding="8" style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                    <tr style={{ background: '#eee' }}>
                        <th>Fecha</th>
                        <th>Hora</th>
                        <th>Descripción</th>
                        <th>Categoría</th>
                        <th>Ingreso</th>
                        <th>Egreso</th>
                    </tr>
                </thead>
                <tbody>
                    {movimientosFiltrados.length === 0 ? (
                        <tr>
                            <td colSpan="6" style={{ textAlign: 'center' }}>No hay movimientos registrados en esta caja.</td>
                        </tr>
                    ) : (
                        movimientosFiltrados.map(mov => {
                            const esIngreso = mov.categoria?.tipo === 'Ingreso';
                            return (
                                <tr key={mov.id}>
                                    <td>{mov.fecha}</td>
                                    <td>{mov.hora}</td>
                                    <td>{mov.descripcion}</td>
                                    <td>{mov.categoria ? `${mov.categoria.nombre} (${mov.categoria.tipo})` : 'Sin categoría'}</td>
                                    {/* Columna Ingreso */}
                                    <td style={{ color: 'green', fontWeight: 'bold' }}>
                                        {esIngreso ? `S/ ${parseFloat(mov.monto).toFixed(2)}` : '-'}
                                    </td>
                                    {/* Columna Egreso */}
                                    <td style={{ color: 'red', fontWeight: 'bold' }}>
                                        {!esIngreso ? `S/ ${parseFloat(mov.monto).toFixed(2)}` : '-'}
                                    </td>
                                </tr>
                            );
                        })
                    )}
                </tbody>
                {/* FILA DE TOTALES AL FINAL */}
                <tfoot>
                    <tr style={{ background: '#f5f5f5', fontWeight: 'bold' }}>
                        <td colSpan="4" style={{ textAlign: 'right' }}>Totales Parciales:</td>
                        <td style={{ color: 'green' }}>S/ {totalIngreso.toFixed(2)}</td>
                        <td style={{ color: 'red' }}>S/ {totalEgreso.toFixed(2)}</td>
                    </tr>
                    <tr style={{ background: '#eee', fontWeight: 'bold' }}>
                        <td colSpan="4" style={{ textAlign: 'right' }}>Saldo Neto de Caja:</td>
                        <td colSpan="2" style={{ color: neto >= 0 ? 'green' : 'red', textAlign: 'center', fontSize: '1.1em' }}>
                            S/ {neto.toFixed(2)}
                        </td>
                    </tr>
                </tfoot>
            </table>
        </div>
    );
}

export default Movimientos;