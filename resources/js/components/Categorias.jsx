import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

function Categorias() {
    const [nombre, setNombre] = useState('');
    const [tipo, setTipo] = useState('Ingreso'); // "Ingreso" por defecto
    const [categorias, setCategorias] = useState([]);
    
    // Estados de edición
    const [editando, setEditando] = useState(false);
    const [categoriaId, setCategoriaId] = useState(null);

    const navigate = useNavigate();

    useEffect(() => {
        obtenerCategorias();
    }, []);

    const obtenerCategorias = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get('/api/categorias', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setCategorias(response.data);
        } catch (error) {
            console.error("Error al obtener categorías", error);
        }
    };

    const activarEdicion = (cat) => {
        setEditando(true);
        setCategoriaId(cat.id);
        setNombre(cat.nombre);
        setTipo(cat.tipo);
    };

    const cancelarEdicion = () => {
        setEditando(false);
        setCategoriaId(null);
        setNombre('');
        setTipo('Ingreso');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const token = localStorage.getItem('token');

        try {
            if (editando) {
                await axios.put(`/api/categorias/${categoriaId}`, { nombre, tipo }, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setEditando(false);
                setCategoriaId(null);
            } else {
                await axios.post('/api/categorias', { nombre, tipo }, {
                    headers: { Authorization: `Bearer ${token}` }
                });
            }
            
            setNombre('');
            setTipo('Ingreso');
            obtenerCategorias();
        } catch (error) {
            alert("Error al procesar la solicitud");
        }
    };

    return (
        <div style={{ background: '#fff', padding: '20px', borderRadius: '5px', maxWidth: '800px', margin: '20px auto' }}>
            
            {/* Botón de regreso */}
            <div style={{ marginBottom: '20px' }}>
                <button 
                    onClick={() => navigate('/dashboard')} 
                    style={{ padding: '8px 12px', cursor: 'pointer', fontWeight: 'bold' }}
                >
                    ← Volver al Dashboard
                </button>
            </div>

            <h2>Módulo de Categorías</h2>
            
            {/* Formulario de Registro/Edición */}
            <form onSubmit={handleSubmit} style={{ marginBottom: '20px' }}>
                <div style={{ marginBottom: '10px' }}>
                    <label style={{ display: 'block', marginBottom: '5px' }}>Nombre:</label>
                    <input 
                        type="text" 
                        value={nombre} 
                        onChange={(e) => setNombre(e.target.value)} 
                        placeholder="Ej: Servicios de Luz" 
                        required 
                        style={{ padding: '5px', width: '200px' }}
                    />
                </div>

                <div style={{ marginBottom: '15px' }}>
                    <label style={{ display: 'block', marginBottom: '5px' }}>Tipo:</label>
                    <select 
                        value={tipo} 
                        onChange={(e) => setTipo(e.target.value)}
                        style={{ padding: '5px', width: '212px' }}
                    >
                        <option value="Ingreso">Ingreso</option>
                        <option value="Egreso">Egreso</option>
                    </select>
                </div>
                
                <button type="submit" style={{ padding: '5px 10px', cursor: 'pointer', fontWeight: 'bold' }}>
                    {editando ? 'Actualizar Categoría' : 'Registrar Categoría'}
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
            <h3>Listado de Categorías</h3>
            <table border="1" cellPadding="8" style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                    <tr style={{ background: '#eee' }}>
                        <th>ID</th>
                        <th>Nombre</th>
                        <th>Tipo</th>
                        <th>Acciones</th>
                    </tr>
                </thead>
                <tbody>
                    {categorias.length === 0 ? (
                        <tr>
                            <td colSpan="4" style={{ textAlign: 'center' }}>No hay categorías registradas.</td>
                        </tr>
                    ) : (
                        categorias.map((cat) => (
                            <tr key={cat.id}>
                                <td>{cat.id}</td>
                                <td>{cat.nombre}</td>
                                <td style={{ color: cat.tipo === 'Ingreso' ? 'green' : 'red', fontWeight: 'bold' }}>
                                    {cat.tipo}
                                </td>
                                <td>
                                    <button 
                                        onClick={() => activarEdicion(cat)} 
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

export default Categorias;