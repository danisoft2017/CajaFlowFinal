import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

function Usuarios() {
    const [usuarios, setUsuarios] = useState([]);
    
    const usuarioLogueado = JSON.parse(localStorage.getItem('user'));
    const esAdmin = usuarioLogueado?.role === 'admin' || usuarioLogueado?.role === 'superadmin';

    // Lista de emojis disponibles para avatar
    const avataresDisponibles = ['👤', '💇‍♀️', '💇‍♂️', '👩‍🦳', '👨‍🦳', '👩‍🦰', '👨‍🦰', '👩‍🦱', '👨‍🦱', '🧑‍💻', '👨‍💼', '👩‍💼'];

    // Estados para el formulario único (Crear / Editar)
    const [editando, setEditando] = useState(false);
    const [userId, setUserId] = useState(null);
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [passwordForm, setPasswordForm] = useState('');
    const [role, setRole] = useState('operador');
    const [avatar, setAvatar] = useState('👤');

    // Estado independiente para cambio rápido de llave 🔑
    const [cambiandoPass, setCambiandoPass] = useState(false);
    const [newPassword, setNewPassword] = useState('');

    const navigate = useNavigate();

    useEffect(() => {
        obtenerUsuarios();
    }, []);

    const obtenerUsuarios = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get('/api/usuarios', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setUsuarios(response.data);
        } catch (error) {
            console.error("Error al obtener usuarios", error);
        }
    };

    const activarEdicion = (user) => {
        setEditando(true);
        setCambiandoPass(false);
        setUserId(user.id);
        setName(user.name);
        setEmail(user.email);
        setRole(user.role);
        setAvatar(user.avatar || '👤');
    };

    const activarCambioPassword = (user) => {
        setCambiandoPass(true);
        setEditando(false);
        setUserId(user.id);
        setNewPassword('');
    };

    const cambiarEstadoUsuario = async (id) => {
        const token = localStorage.getItem('token');
        try {
            await axios.patch(`/api/usuarios/${id}/toggle`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            obtenerUsuarios();
        } catch (error) {
            alert("Error al cambiar el estado del usuario");
        }
    };

    const cancelarAccion = () => {
        setEditando(false);
        setCambiandoPass(false);
        setUserId(null);
        setName('');
        setEmail('');
        setPasswordForm('');
        setRole('operador');
        setAvatar('👤');
    };

    const handleSubmitFormulario = async (e) => {
        e.preventDefault();
        const token = localStorage.getItem('token');

        try {
            if (editando) {
                await axios.put(`/api/usuarios/${userId}`, { name, role, avatar }, {
                    headers: { Authorization: `Bearer ${token}` }
                });
            } else {
                await axios.post('/api/usuarios', { name, email, password: passwordForm, role, avatar }, {
                    headers: { Authorization: `Bearer ${token}` }
                });
            }
            cancelarAccion();
            obtenerUsuarios();
        } catch (error) {
            alert(error.response?.data?.message || "Error al procesar la solicitud");
        }
    };

    const handleSubmitPasswordSolo = async (e) => {
        e.preventDefault();
        const token = localStorage.getItem('token');
        try {
            await axios.put(`/api/usuarios/${userId}/password`, { password: newPassword }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            alert("Contraseña modificada con éxito");
            cancelarAccion();
        } catch (error) {
            alert("Error al cambiar contraseña");
        }
    };

    return (
        <div style={{ background: '#fff', padding: '20px', borderRadius: '5px', maxWidth: '950px', margin: '20px auto' }}>
            
            <div style={{ marginBottom: '20px' }}>
                <button onClick={() => navigate('/dashboard')} style={{ padding: '8px 12px', cursor: 'pointer', fontWeight: 'bold' }}>
                    ← Volver al Dashboard
                </button>
            </div>

            <h2>Módulo de Control de Usuarios</h2>
            <p>Tu rol actual: <strong style={{ color: esAdmin ? 'green' : 'blue' }}>{usuarioLogueado?.role}</strong></p>

            {/* FORMULARIO ÚNICO: AGREGAR O EDITAR DATOS */}
            {esAdmin && !cambiandoPass && (
                <form onSubmit={handleSubmitFormulario} style={{ background: '#f9f9f9', padding: '15px', marginBottom: '20px', borderRadius: '4px' }}>
                    <h3>{editando ? 'Modificar Usuario Seleccionado' : 'Añadir Nuevo Usuario'}</h3>
                    <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap', alignItems: 'flex-end' }}>
                        <div>
                            <label style={{ display: 'block' }}>Nombre:</label>
                            <input type="text" value={name} onChange={(e) => setName(e.target.value)} required style={{ padding: '5px' }} />
                        </div>
                        
                        <div>
                            <label style={{ display: 'block' }}>Correo Electrónico:</label>
                            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required disabled={editando} style={{ padding: '5px' }} />
                        </div>

                        {!editando && (
                            <div>
                                <label style={{ display: 'block' }}>Contraseña Inicial:</label>
                                <input type="password" value={passwordForm} onChange={(e) => setPasswordForm(e.target.value)} required style={{ padding: '5px' }} />
                            </div>
                        )}

                        <div>
                            <label style={{ display: 'block' }}>Rol de Acceso:</label>
                            <select value={role} onChange={(e) => setRole(e.target.value)} style={{ padding: '5px', width: '130px' }}>
                                <option value="operador">Operador</option>
                                <option value="admin">Administrador</option>
                            </select>
                        </div>

                        {/* SELECTOR DE AVATAR (EMOJI) */}
                        <div>
                            <label style={{ display: 'block' }}>Avatar:</label>
                            <select value={avatar} onChange={(e) => setAvatar(e.target.value)} style={{ padding: '5px', fontSize: '1.2em' }}>
                                {avataresDisponibles.map((emo, index) => (
                                    <option key={index} value={emo}>{emo}</option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <button type="submit" style={{ padding: '6px 12px', cursor: 'pointer', fontWeight: 'bold' }}>
                                {editando ? 'Actualizar' : 'Guardar Usuario'}
                            </button>
                            {editando && (
                                <button type="button" onClick={cancelarAccion} style={{ padding: '6px 12px', marginLeft: '5px', cursor: 'pointer' }}>
                                    Cancelar
                                </button>
                            )}
                        </div>
                    </div>
                </form>
            )}

            {/* FORMULARIO INDEPENDIENTE: CAMBIAR CONTRASEÑA */}
            {cambiandoPass && esAdmin && (
                <form onSubmit={handleSubmitPasswordSolo} style={{ background: '#f5f5f5', padding: '15px', marginBottom: '20px', borderRadius: '4px' }}>
                    <h3>Establecer Nueva Contraseña</h3>
                    <div style={{ marginBottom: '10px' }}>
                        <label>Nueva Contraseña:</label><br />
                        <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required placeholder="Mínimo 6 caracteres" style={{ padding: '5px' }} />
                    </div>
                    <button type="submit" style={{ padding: '5px 10px', cursor: 'pointer', fontWeight: 'bold' }}>Actualizar Contraseña</button>
                    <button type="button" onClick={cancelarAccion} style={{ padding: '5px 10px', marginLeft: '5px', cursor: 'pointer' }}>Cancelar</button>
                </form>
            )}

            <hr />

            {/* TABLA DE USUARIOS CON COLUMNA AVATAR */}
            <h3>Listado General de Usuarios</h3>
            <table border="1" cellPadding="8" style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                    <tr style={{ background: '#eee' }}>
                        <th>ID</th>
                        <th>Avatar</th> {/* Columna de Avatar */}
                        <th>Nombre</th>
                        <th>Correo Electrónico</th>
                        <th>Rol</th>
                        <th>Estado</th>
                        {esAdmin && <th>Acciones de Control</th>}
                    </tr>
                </thead>
                <tbody>
                    {usuarios.map((user) => (
                        <tr key={user.id} style={{ backgroundColor: user.activo ? '#fff' : '#fce8e6' }}>
                            <td>{user.id}</td>
                            <td style={{ fontSize: '1.5em', textAlign: 'center' }}>{user.avatar || '👤'}</td>
                            <td>{user.name}</td>
                            <td>{user.email}</td>
                            <td style={{ fontWeight: 'bold' }}>{user.role}</td>
                            <td style={{ color: user.activo ? 'green' : 'red', fontWeight: 'bold' }}>
                                {user.activo ? 'Activo' : 'Desactivado'}
                            </td>
                            
                            {esAdmin && (
                                <td>
                                    <button onClick={() => activarEdicion(user)} style={{ padding: '3px 8px', marginRight: '5px', cursor: 'pointer' }}>
                                        Editar
                                    </button>
                                    <button onClick={() => activarCambioPassword(user)} style={{ padding: '3px 8px', marginRight: '5px', cursor: 'pointer' }}>
                                        Contraseña 🔑
                                    </button>
                                    <button 
                                        onClick={() => cambiarEstadoUsuario(user.id)} 
                                        style={{ 
                                            padding: '3px 8px', 
                                            cursor: 'pointer',
                                            background: user.activo ? '#ff4d4d' : '#4da6ff',
                                            color: '#fff',
                                            border: 'none',
                                            borderRadius: '3px'
                                        }}
                                    >
                                        {user.activo ? 'Desactivar' : 'Activar'}
                                    </button>
                                </td>
                            )}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

export default Usuarios;