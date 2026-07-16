import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

function Cajas() {
    const [nombre, setNombre] = useState('');
    const [cajas, setCajas] = useState([]);
    const [editando, setEditando] = useState(false);
    const [cajaId, setCajaId] = useState(null);

    const navigate = useNavigate();

    // Cargar las cajas al abrir la pantalla
    useEffect(() => {
        obtenerCajas();
    }, []);

    const obtenerCajas = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get('/api/cajas', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setCajas(response.data);
        } catch (error) {
            console.error("Error al obtener cajas", error);
        }
    };

    const activarEdicion=(caja)=>{
        setEditando(true);
        setCajaId(caja.id);
        setNombre(caja.nombre);
    }

    const cancelarEdicion=()=>{
        setEditando(false);
        setCajaId(null);
        setNombre('');
    }

    const handleSubmit = async (e) => {
        e.preventDefault();
        const token = localStorage.getItem('token');
        try {
            if(editando){
                await axios.put(`/api/cajas/${cajaId}`, { nombre }, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setEditando(false);
                setCajaId(null);
            }else{
                await axios.post('/api/cajas', { nombre }, {
                    headers: { Authorization: `Bearer ${token}` }
                });
            }
            
            setNombre(''); // Limpiar el input
            obtenerCajas(); // Recargar la lista
        } catch (error) {
            alert("Error al guardar la caja");
        }
    };

    return (
        <div style={{ background: '#fff', padding: '20px', borderRadius: '5px' }}>
            <h2>Módulo de Cajas</h2>
            {/* Botón Simple de Regreso utilizando HTML nativo */}
            <div style={{ marginBottom: '20px' }}>
                <button 
                    onClick={() => navigate('/dashboard')} 
                    style={{ padding: '8px 12px', cursor: 'pointer', fontWeight: 'bold' }}
                >
                    ← Volver al Dashboard
                </button>
            </div>
            {/* Formulario Simple */}
            <form onSubmit={handleSubmit} style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '5px' }}>Nombre de la Caja:</label>
                <input 
                    type="text" 
                    value={nombre} 
                    onChange={(e) => setNombre(e.target.value)} 
                    placeholder="Ej: Caja Principal" 
                    required 
                    style={{ padding: '5px', marginRight: '10px' }}
                />
                <button type="submit" style={{ padding: '5px 10px', cursor: 'pointer' }}>
                    {editando ? 'Actualizar Caja' : 'Registrar Caja'}
                </button>
                {editando && (
                    <button 
                        type="button" 
                        onClick={cancelarEdicion} 
                        style={{ padding: '5px 10px', marginLeft: '10px', cursor: 'pointer' }}
                    >
                        Cancelar
                    </button>
                )}
            </form>

            <hr />

            {/* Tabla Estándar HTML */}
            <h3>Listado de Cajas Registradas</h3>
            <table border="1" cellPadding="8" style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                    <tr style={{ background: '#eee' }}>
                        <th>ID</th>
                        <th>Nombre de la Caja</th>
                        <th>Fecha de Registro</th>
                        <th>Acciones</th> 
                    </tr>
                </thead>
                <tbody>
                    {cajas.length === 0 ? (
                        <tr>
                            <td colSpan="4" style={{ textAlign: 'center' }}>No hay cajas registradas aún.</td>
                        </tr>
                    ) : (
                        cajas.map((caja) => (
                            <tr key={caja.id}>
                                <td>{caja.id}</td>
                                <td>{caja.nombre}</td>
                                <td>{new Date(caja.created_at).toLocaleDateString()}</td>
                                <td>
                                    {/* Botón nativo de editar */}
                                    <button 
                                        onClick={() => activarEdicion(caja)} 
                                        style={{ padding: '3px 8px', cursor: 'pointer' }}
                                    >
                                        Editar
                                    </button>
                                </td>
                            </tr>
                        ))
                    )}
                </tbody>
            </table>
        </div>
    );
}

export default Cajas;