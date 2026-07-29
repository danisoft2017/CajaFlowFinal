import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Swal from 'sweetalert2';

function Usuarios() {
    const [usuarios, setUsuarios] = useState([]);
    const [cargando, setCargando] = useState(true);
    const [buscarText, setBuscarText] = useState('');

    const usuarioLogueado = JSON.parse(localStorage.getItem('user')) || {};
    const esAdmin = usuarioLogueado?.role === 'admin' || usuarioLogueado?.role === 'superadmin';

    // Lista de emojis disponibles para avatar
    const avataresDisponibles = ['👤', '💇‍♀️', '💇‍♂️', '👩‍🦳', '👨‍🦳', '👩‍🦰', '👨‍🦰', '👩‍🦱', '👨‍🦱', '🧑‍💻', '👨‍💼', '👩‍💼'];

    // Estados para Modal Crear / Editar
    const [mostrarModalUser, setMostrarModalUser] = useState(false);
    const [editando, setEditando] = useState(false);
    const [userId, setUserId] = useState(null);
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [passwordForm, setPasswordForm] = useState('');
    const [role, setRole] = useState('operador');
    const [avatar, setAvatar] = useState('👤');

    // Estados para Modal Independiente de Contraseña 🔑
    const [mostrarModalPass, setMostrarModalPass] = useState(false);
    const [userPassId, setUserPassId] = useState(null);
    const [userNamePass, setUserNamePass] = useState('');
    const [newPassword, setNewPassword] = useState('');

    useEffect(() => {
        obtenerUsuarios();
    }, []);

    const obtenerUsuarios = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get('/api/usuarios', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setUsuarios(Array.isArray(response.data) ? response.data : []);
        } catch (error) {
            console.error("Error al obtener usuarios", error);
        } finally {
            setCargando(false);
        }
    };

    const cancelarAccion = () => {
        setMostrarModalUser(false);
        setMostrarModalPass(false);
        setEditando(false);
        setUserId(null);
        setUserPassId(null);
        setUserNamePass('');
        setName('');
        setEmail('');
        setPasswordForm('');
        setNewPassword('');
        setRole('operador');
        setAvatar('👤');
    };

    const abrirModalNuevo = () => {
        cancelarAccion();
        setMostrarModalUser(true);
    };

    const activarEdicion = (user) => {
        setEditando(true);
        setUserId(user.id);
        setName(user.name);
        setEmail(user.email);
        setRole(user.role);
        setAvatar(user.avatar || '👤');
        setMostrarModalUser(true);
    };

    const activarCambioPassword = (user) => {
        setUserPassId(user.id);
        setUserNamePass(user.name);
        setNewPassword('');
        setMostrarModalPass(true);
    };

    const cambiarEstadoUsuario = async (user) => {
        const accionStr = user.activo ? 'desactivar' : 'activar';
        
        Swal.fire({
            title: `¿Deseas ${accionStr} a ${user.name}?`,
            text: user.activo ? 'El usuario no podrá ingresar al sistema.' : 'El usuario podrá acceder nuevamente.',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: user.activo ? '#ef4444' : '#10b981',
            cancelButtonColor: '#94a3b8',
            confirmButtonText: `Sí, ${accionStr}`,
            cancelButtonText: 'Cancelar'
        }).then(async (result) => {
            if (result.isConfirmed) {
                try {
                    const token = localStorage.getItem('token');
                    await axios.patch(`/api/usuarios/${user.id}/toggle`, {}, {
                        headers: { Authorization: `Bearer ${token}` }
                    });
                    Swal.fire('¡Estado actualizado!', `El usuario ha sido ${user.activo ? 'desactivado' : 'activado'}.`, 'success');
                    obtenerUsuarios();
                } catch (error) {
                    Swal.fire('Error', 'Error al cambiar el estado del usuario.', 'error');
                }
            }
        });
    };

    const handleSubmitFormulario = async (e) => {
        e.preventDefault();
        const token = localStorage.getItem('token');

        try {
            if (editando) {
                await axios.put(`/api/usuarios/${userId}`, { name, role, avatar }, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                Swal.fire('¡Actualizado!', 'Datos del usuario modificados correctamente.', 'success');
            } else {
                await axios.post('/api/usuarios', { name, email, password: passwordForm, role, avatar }, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                Swal.fire('¡Guardado!', 'Nuevo usuario registrado con éxito.', 'success');
            }
            cancelarAccion();
            obtenerUsuarios();
        } catch (error) {
            Swal.fire('Error', error.response?.data?.message || 'Error al procesar la solicitud', 'error');
        }
    };

    const handleSubmitPasswordSolo = async (e) => {
        e.preventDefault();
        if (!newPassword.trim() || newPassword.length < 6) {
            Swal.fire('Atención', 'La contraseña debe tener al menos 6 caracteres.', 'warning');
            return;
        }

        const token = localStorage.getItem('token');
        try {
            await axios.put(`/api/usuarios/${userPassId}/password`, { password: newPassword }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            Swal.fire('¡Contraseña actualizada!', `Se cambió la clave de ${userNamePass}.`, 'success');
            cancelarAccion();
        } catch (error) {
            Swal.fire('Error', 'Error al cambiar la contraseña.', 'error');
        }
    };

    // Filtro local
    const usuariosFiltrados = usuarios.filter(u => {
        const term = buscarText.toLowerCase();
        const nameMatch = u.name?.toLowerCase().includes(term);
        const emailMatch = u.email?.toLowerCase().includes(term);
        return nameMatch || emailMatch;
    });

    const countAdmins = usuarios.filter(u => u.role === 'admin' || u.role === 'superadmin').length;
    const countOperadores = usuarios.filter(u => u.role === 'operador').length;

    if (cargando) {
        return (
            <div className="text-center py-5">
                <div className="spinner-border text-primary" role="status"></div>
                <p className="text-muted small mt-2">Cargando directorio de usuarios...</p>
            </div>
        );
    }

    return (
        <div className="container">
            
            {/* TARJETAS DE MÉTRICAS SUPERIORES */}
            <div className="row g-3 mb-4">
                <div className="col-12 col-md-4">
                    <div className="card border-0 shadow-sm rounded-4 p-3 bg-white h-100">
                        <div className="d-flex justify-content-between align-items-center mb-1">
                            <span className="text-muted small fw-semibold">Total usuarios</span>
                            <div className="rounded-circle p-2 d-flex align-items-center justify-content-center" style={{ width: '36px', height: '36px', backgroundColor: '#e0e7ff', color: '#4f46e5' }}>
                                <i className="fa-solid fa-users"></i>
                            </div>
                        </div>
                        <h3 className="fw-bold text-dark mb-0">{usuarios.length}</h3>
                    </div>
                </div>

                <div className="col-12 col-md-4">
                    <div className="card border-0 shadow-sm rounded-4 p-3 bg-white h-100">
                        <div className="d-flex justify-content-between align-items-center mb-1">
                            <span className="text-muted small fw-semibold">Administradores</span>
                            <div className="rounded-circle p-2 text-primary d-flex align-items-center justify-content-center" style={{ width: '36px', height: '36px', backgroundColor: '#cff4fc', color: '#0891b2' }}>
                                <i className="fa-solid fa-user-shield"></i>
                            </div>
                        </div>
                        <h3 className="fw-bold text-info mb-0">{countAdmins}</h3>
                    </div>
                </div>

                <div className="col-12 col-md-4">
                    <div className="card border-0 shadow-sm rounded-4 p-3 bg-white h-100">
                        <div className="d-flex justify-content-between align-items-center mb-1">
                            <span className="text-muted small fw-semibold">Operadores</span>
                            <div className="rounded-circle p-2 text-success d-flex align-items-center justify-content-center" style={{ width: '36px', height: '36px', backgroundColor: '#d1fae5' }}>
                                <i className="fa-solid fa-user-gear"></i>
                            </div>
                        </div>
                        <h3 className="fw-bold text-success mb-0">{countOperadores}</h3>
                    </div>
                </div>
            </div>

            {/* BÚSQUEDA Y BOTÓN NUEVO USUARIO */}
            <div className="card border-0 shadow-sm rounded-4 p-3 mb-4 bg-white">
                <div className="row g-3 align-items-center justify-content-between">
                    <div className="col-12 col-md-6">
                        <div className="input-group input-group-sm">
                            <span className="input-group-text bg-light border-0 text-muted ps-3">
                                <i className="fa-solid fa-magnifying-glass"></i>
                            </span>
                            <input 
                                type="text" 
                                className="form-control form-control-sm bg-light border-0 ps-2 py-2 rounded-end-3" 
                                placeholder="Buscar usuario por nombre o correo..." 
                                value={buscarText} 
                                onChange={(e) => setBuscarText(e.target.value)} 
                            />
                        </div>
                    </div>

                    {esAdmin && (
                        <div className="col-12 col-md-4 text-md-end">
                            <button 
                                onClick={abrirModalNuevo}
                                className="btn text-white fw-semibold px-3 py-2 rounded-3 shadow-sm d-inline-flex align-items-center gap-2"
                                style={{ backgroundColor: '#4f46e5', border: 'none' }}
                            >
                                <i className="fa-solid fa-user-plus fs-6"></i>
                                <span>Nuevo usuario</span>
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* TABLA DE USUARIOS */}
            <div className="card border-0 shadow-sm rounded-4 p-4 bg-white">
                <div className="d-flex justify-content-between align-items-center mb-3">
                    <h6 className="fw-bold text-dark m-0">Listado General de Usuarios</h6>
                    <span className="badge bg-light text-secondary rounded-pill px-3 py-1.5 fw-semibold border">
                        Rol actual: <span className="text-primary text-capitalize">{usuarioLogueado?.role || 'operador'}</span>
                    </span>
                </div>

                <div className="table-responsive">
                    <table className="table table-hover align-middle mb-0">
                        <thead className="table-light text-muted small fw-bold">
                            <tr>
                                <th style={{ width: '60px' }}>ID</th>
                                <th>Usuario</th>
                                <th>Correo Electrónico</th>
                                <th>Rol de Acceso</th>
                                <th>Estado</th>
                                {esAdmin && <th className="text-end pe-3" style={{ width: '160px' }}>Acciones</th>}
                            </tr>
                        </thead>
                        <tbody className="small">
                            {usuariosFiltrados.length === 0 ? (
                                <tr>
                                    <td colSpan={esAdmin ? "6" : "5"} className="text-center text-muted py-4">
                                        No se encontraron usuarios registrados.
                                    </td>
                                </tr>
                            ) : (
                                usuariosFiltrados.map((user) => {
                                    const esInactivo = !user.activo;
                                    const isAdminUser = user.role === 'admin' || user.role === 'superadmin';

                                    return (
                                        <tr key={user.id} className={esInactivo ? 'bg-light opacity-75' : ''}>
                                            <td className="text-muted fw-semibold">{user.id}</td>
                                            <td>
                                                <div className="d-flex align-items-center gap-2.5">
                                                    <div 
                                                        className="rounded-circle d-flex align-items-center justify-content-center flex-shrink-0 bg-light border"
                                                        style={{ width: '38px', height: '38px', fontSize: '1.25rem' }}
                                                    >
                                                        {user.avatar || '👤'}
                                                    </div>
                                                    <span className="fw-bold text-dark fs-6">{user.name}</span>
                                                </div>
                                            </td>
                                            <td className="text-muted fw-semibold">{user.email}</td>
                                            <td>
                                                <span className={`badge rounded-pill px-2.5 py-1 fw-semibold ${
                                                    isAdminUser ? 'bg-info-subtle text-info-emphasis' : 'bg-primary-subtle text-primary'
                                                }`}>
                                                    <i className={`fa-solid ${isAdminUser ? 'fa-user-shield' : 'fa-user'} me-1`}></i>
                                                    {user.role}
                                                </span>
                                            </td>
                                            <td>
                                                <span className={`badge rounded-pill px-2.5 py-1 fw-semibold ${
                                                    user.activo ? 'bg-success-subtle text-success' : 'bg-danger-subtle text-danger'
                                                }`}>
                                                    {user.activo ? 'Activo' : 'Desactivado'}
                                                </span>
                                            </td>
                                            {esAdmin && (
                                                <td className="text-end pe-3">
                                                    <div className="btn-group btn-group-sm">
                                                        <button 
                                                            onClick={() => activarEdicion(user)}
                                                            className="btn btn-light border text-secondary me-1 rounded-2"
                                                            title="Editar datos de usuario"
                                                        >
                                                            <i className="fa-regular fa-pen-to-square"></i>
                                                        </button>
                                                        <button 
                                                            onClick={() => activarCambioPassword(user)}
                                                            className="btn btn-light border text-warning me-1 rounded-2"
                                                            title="Cambiar contraseña 🔑"
                                                        >
                                                            <i className="fa-solid fa-key"></i>
                                                        </button>
                                                        <button 
                                                            onClick={() => cambiarEstadoUsuario(user)}
                                                            className={`btn btn-sm border rounded-2 ${
                                                                user.activo ? 'btn-light text-danger' : 'btn-light text-success'
                                                            }`}
                                                            title={user.activo ? 'Desactivar usuario' : 'Activar usuario'}
                                                        >
                                                            <i className={`fa-solid ${user.activo ? 'fa-toggle-on' : 'fa-toggle-off'}`}></i>
                                                        </button>
                                                    </div>
                                                </td>
                                            )}
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* MODAL CREAR / EDITAR USUARIO */}
            {mostrarModalUser && (
                <div className="modal d-block backdrop-blur" style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1050 }}>
                    <div className="modal-dialog modal-dialog-centered" style={{ maxWidth: '480px' }}>
                        <div className="modal-content rounded-4 border-0 shadow p-2">
                            
                            <div className="modal-header border-bottom-0 pb-0">
                                <h5 className="modal-title fw-bold text-dark fs-5">
                                    {editando ? 'Modificar Usuario' : 'Añadir Nuevo Usuario'}
                                </h5>
                                <button 
                                    type="button" 
                                    className="btn-close" 
                                    onClick={cancelarAccion}
                                ></button>
                            </div>

                            <form onSubmit={handleSubmitFormulario} className="modal-body pt-3">
                                
                                <div className="mb-3">
                                    <label className="form-label small fw-semibold text-secondary mb-1">Nombre completo *</label>
                                    <input 
                                        type="text" 
                                        className="form-control rounded-3 py-2 px-3 border-light-subtle bg-light"
                                        placeholder="Ej: Carlos Mendoza"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        required
                                        style={{ boxShadow: 'none' }}
                                    />
                                </div>

                                <div className="mb-3">
                                    <label className="form-label small fw-semibold text-secondary mb-1">Correo electrónico *</label>
                                    <input 
                                        type="email" 
                                        className="form-control rounded-3 py-2 px-3 border-light-subtle bg-light"
                                        placeholder="usuario@ejemplo.com"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        required
                                        disabled={editando}
                                        style={{ boxShadow: 'none' }}
                                    />
                                </div>

                                {!editando && (
                                    <div className="mb-3">
                                        <label className="form-label small fw-semibold text-secondary mb-1">Contraseña inicial *</label>
                                        <input 
                                            type="password" 
                                            className="form-control rounded-3 py-2 px-3 border-light-subtle bg-light"
                                            placeholder="Mínimo 6 caracteres"
                                            value={passwordForm}
                                            onChange={(e) => setPasswordForm(e.target.value)}
                                            required
                                            style={{ boxShadow: 'none' }}
                                        />
                                    </div>
                                )}

                                <div className="row g-2 mb-4">
                                    <div className="col-8">
                                        <label className="form-label small fw-semibold text-secondary mb-1">Rol de acceso</label>
                                        <select 
                                            className="form-select rounded-3 py-2 border-light-subtle bg-light"
                                            value={role}
                                            onChange={(e) => setRole(e.target.value)}
                                        >
                                            <option value="operador">Operador</option>
                                            <option value="admin">Administrador</option>
                                        </select>
                                    </div>

                                    <div className="col-4">
                                        <label className="form-label small fw-semibold text-secondary mb-1">Avatar</label>
                                        <select 
                                            className="form-select rounded-3 py-2 border-light-subtle bg-light text-center fs-5"
                                            value={avatar}
                                            onChange={(e) => setAvatar(e.target.value)}
                                        >
                                            {avataresDisponibles.map((emo, index) => (
                                                <option key={index} value={emo}>{emo}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                <div className="border-top pt-3 d-flex gap-2 justify-content-end">
                                    <button 
                                        type="button" 
                                        className="btn btn-light rounded-3 px-4 fw-semibold text-secondary"
                                        onClick={cancelarAccion}
                                    >
                                        Cancelar
                                    </button>
                                    <button 
                                        type="submit" 
                                        className="btn text-white rounded-3 px-4 fw-semibold"
                                        style={{ backgroundColor: '#4f46e5', border: 'none' }}
                                    >
                                        {editando ? 'Actualizar' : 'Guardar Usuario'}
                                    </button>
                                </div>

                            </form>
                        </div>
                    </div>
                </div>
            )}

            {/* MODAL CAMBIAR CONTRASEÑA 🔑 */}
            {mostrarModalPass && (
                <div className="modal d-block backdrop-blur" style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1050 }}>
                    <div className="modal-dialog modal-dialog-centered" style={{ maxWidth: '420px' }}>
                        <div className="modal-content rounded-4 border-0 shadow p-2">
                            
                            <div className="modal-header border-bottom-0 pb-0">
                                <h5 className="modal-title fw-bold text-dark fs-5">
                                    🔑 Cambiar Contraseña
                                </h5>
                                <button 
                                    type="button" 
                                    className="btn-close" 
                                    onClick={cancelarAccion}
                                ></button>
                            </div>

                            <form onSubmit={handleSubmitPasswordSolo} className="modal-body pt-3">
                                
                                <p className="small text-muted mb-3">
                                    Estableciendo nueva clave para el usuario <strong className="text-dark">{userNamePass}</strong>:
                                </p>

                                <div className="mb-4">
                                    <label className="form-label small fw-semibold text-secondary mb-1">Nueva Contraseña *</label>
                                    <input 
                                        type="password" 
                                        className="form-control rounded-3 py-2 px-3 border-light-subtle bg-light"
                                        placeholder="Mínimo 6 caracteres"
                                        value={newPassword}
                                        onChange={(e) => setNewPassword(e.target.value)}
                                        required
                                        style={{ boxShadow: 'none' }}
                                    />
                                </div>

                                <div className="border-top pt-3 d-flex gap-2 justify-content-end">
                                    <button 
                                        type="button" 
                                        className="btn btn-light rounded-3 px-4 fw-semibold text-secondary"
                                        onClick={cancelarAccion}
                                    >
                                        Cancelar
                                    </button>
                                    <button 
                                        type="submit" 
                                        className="btn text-white rounded-3 px-4 fw-semibold"
                                        style={{ backgroundColor: '#4f46e5', border: 'none' }}
                                    >
                                        Actualizar Contraseña
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

export default Usuarios;