import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

function Movimientos() {
    const [cajas, setCajas] = useState([]);
    const [categorias, setCategorias] = useState([]);
    const [movimientos, setMovimientos] = useState([]);
    const [cajaActivaId, setCajaActivaId] = useState(null);

    // Obtener usuario logueado en la sesión
    const usuarioLogueado = JSON.parse(localStorage.getItem('user'));

    // Funciones auxiliares para obtener Fecha y Hora exacta de Perú (America/Lima)
    const obtenerFechaPeru = () => {
        const ahora = new Date();
        const opciones = { timeZone: 'America/Lima', year: 'numeric', month: '2-digit', day: '2-digit' };
        const partes = new Intl.DateTimeFormat('es-PE', opciones).formatToParts(ahora);
        const dia = partes.find(p => p.type === 'day').value;
        const mes = partes.find(p => p.type === 'month').value;
        const anio = partes.find(p => p.type === 'year').value;
        return `${anio}-${mes}-${dia}`;
    };

    const obtenerHoraPeru = () => {
        const ahora = new Date();
        const opciones = { timeZone: 'America/Lima', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false };
        return new Intl.DateTimeFormat('es-PE', opciones).format(ahora);
    };

    // Estados de fecha y hora inicializados con Perú
    const [fecha, setFecha] = useState(obtenerFechaPeru());
    const [hora, setHora] = useState(obtenerHoraPeru());

    const [descripcion, setDescripcion] = useState('');
    const [categoriaId, setCategoriaId] = useState('');
    const [monto, setMonto] = useState('');

    const navigate = useNavigate();

    // Reloj en tiempo real: Actualiza la hora cada segundo
    useEffect(() => {
        const timer = setInterval(() => {
            setHora(obtenerHoraPeru());
            setFecha(obtenerFechaPeru());
        }, 1000);

        return () => clearInterval(timer); // Limpieza del timer al desmontar el componente
    }, []);

    useEffect(() => {
        cargarDatosIniciales();
    }, []);

    const cargarDatosIniciales = async () => {
        try {
            const token = localStorage.getItem('token');
            const config = { headers: { Authorization: `Bearer ${token}` } };

            const [resCajas, resCategorias, resMovimientos] = await Promise.all([
                axios.get('/api/cajas', config),
                axios.get('/api/categorias', config),
                axios.get('/api/movimientos', config)
            ]);

            setCajas(resCajas.data);
            setCategorias(resCategorias.data);
            setMovimientos(resMovimientos.data);

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
            alert("Primero debes seleccionar una caja.");
            return;
        }

        try {
            const token = localStorage.getItem('token');
            await axios.post('/api/movimientos', {
                fecha,
                hora,
                descripcion,
                caja_id: cajaActivaId,
                categoria_id: categoriaId,
                monto: parseFloat(monto),
                user_id: usuarioLogueado?.id // Enviamos también el id del usuario actual
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });

            // Limpiar formulario excepto fecha y hora (que siguen corriendo automáticamente)
            setDescripcion('');
            setMonto('');
            setCategoriaId('');

            // Recargar lista
            const resMovimientos = await axios.get('/api/movimientos', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setMovimientos(resMovimientos.data);
        } catch (error) {
            alert("Error al registrar el movimiento");
        }
    };

    const movimientosFiltrados = movimientos.filter(mov => mov.caja_id === cajaActivaId);

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
        <div style={{ background: '#fff', padding: '20px', borderRadius: '5px', maxWidth: '980px', margin: '20px auto' }}>
            
            <div style={{ marginBottom: '20px' }}>
                <button 
                    onClick={() => navigate('/dashboard')} 
                    style={{ padding: '8px 12px', cursor: 'pointer', fontWeight: 'bold' }}
                >
                    ← Volver al Dashboard
                </button>
            </div>

            <h2>Módulo de Movimientos</h2>

            {/* BOTONES TABS DE CAJAS */}
            <div style={{ marginBottom: '20px', borderBottom: '1px solid #ccc', paddingBottom: '10px' }}>
                <span style={{ marginRight: '10px', fontWeight: 'bold' }}>Filtrar por Caja:</span>
                {cajas.map(caja => (
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
                ))}
            </div>

            {/* FORMULARIO DE REGISTRO */}
            <form onSubmit={handleSubmit} style={{ background: '#f9f9f9', padding: '15px', borderRadius: '4px', marginBottom: '20px' }}>
                <h3>Registrar Movimiento</h3>
                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '10px' }}>
                    
                    {/* Input Fecha de Perú (Bloqueado) */}
                    <div>
                        <label style={{ display: 'block' }}>Fecha (Perú):</label>
                        <input 
                            type="text" 
                            value={fecha} 
                            readOnly 
                            style={{ padding: '5px', background: '#eee', border: '1px solid #ccc', cursor: 'not-allowed', width: '100px' }} 
                        />
                    </div>

                    {/* Input Hora de Perú (Actualización Automática y Bloqueado) */}
                    <div>
                        <label style={{ display: 'block' }}>Hora en Vivo:</label>
                        <input 
                            type="text" 
                            value={hora} 
                            readOnly 
                            style={{ padding: '5px', background: '#eee', border: '1px solid #ccc', cursor: 'not-allowed', width: '90px', fontWeight: 'bold' }} 
                        />
                    </div>

                    <div>
                        <label style={{ display: 'block' }}>Descripción:</label>
                        <input 
                            type="text" 
                            value={descripcion} 
                            onChange={(e) => setDescripcion(e.target.value)} 
                            placeholder="Ej: Pago de Luz" 
                            required 
                            style={{ padding: '5px', width: '180px' }} 
                        />
                    </div>

                    <div>
                        <label style={{ display: 'block' }}>Categoría:</label>
                        <select 
                            value={categoriaId} 
                            onChange={(e) => setCategoriaId(e.target.value)} 
                            required 
                            style={{ padding: '5px', width: '170px' }}
                        >
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
                        <input 
                            type="number" 
                            step="0.01" 
                            min="0.01" 
                            value={monto} 
                            onChange={(e) => setMonto(e.target.value)} 
                            placeholder="0.00" 
                            required 
                            style={{ padding: '5px', width: '90px' }} 
                        />
                    </div>
                </div>

                <button type="submit" style={{ padding: '6px 15px', cursor: 'pointer', fontWeight: 'bold' }}>
                    Guardar Movimiento
                </button>
            </form>

            <hr />

            {/* TABLA DE MOVIMIENTOS CON COLUMNA DE USUARIO */}
            <h3>Movimientos Registrados</h3>
            <table border="1" cellPadding="8" style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                    <tr style={{ background: '#eee' }}>
                        <th>Fecha</th>
                        <th>Hora</th>
                        <th>Descripción</th>
                        <th>Categoría</th>
                        <th>Usuario</th> {/* Columna de usuario */}
                        <th>Ingreso</th>
                        <th>Egreso</th>
                    </tr>
                </thead>
                <tbody>
                    {movimientosFiltrados.length === 0 ? (
                        <tr>
                            <td colSpan="7" style={{ textAlign: 'center' }}>No hay movimientos registrados en esta caja.</td>
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
                                    
                                    {/* Muestra el avatar y nombre del usuario que registró el movimiento */}
                                    <td>
                                        {mov.user ? `${mov.user.avatar || '👤'} ${mov.user.name}` : (usuarioLogueado?.name || 'Sistema')}
                                    </td>

                                    <td style={{ color: 'green', fontWeight: 'bold' }}>
                                        {esIngreso ? `S/ ${parseFloat(mov.monto).toFixed(2)}` : '-'}
                                    </td>
                                    <td style={{ color: 'red', fontWeight: 'bold' }}>
                                        {!esIngreso ? `S/ ${parseFloat(mov.monto).toFixed(2)}` : '-'}
                                    </td>
                                </tr>
                            );
                        })
                    )}
                </tbody>
                <tfoot>
                    <tr style={{ background: '#f5f5f5', fontWeight: 'bold' }}>
                        <td colSpan="5" style={{ textAlign: 'right' }}>Totales Parciales:</td>
                        <td style={{ color: 'green' }}>S/ {totalIngreso.toFixed(2)}</td>
                        <td style={{ color: 'red' }}>S/ {totalEgreso.toFixed(2)}</td>
                    </tr>
                    <tr style={{ background: '#eee', fontWeight: 'bold' }}>
                        <td colSpan="5" style={{ textAlign: 'right' }}>Saldo Neto de Caja:</td>
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