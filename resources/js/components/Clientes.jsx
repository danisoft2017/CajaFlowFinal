import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Swal from 'sweetalert2';

function Clientes() {
    const [clientes, setClientes] = useState([]);
    const [cargando, setCargando] = useState(true);
    const [buscandoApi, setBuscandoApi] = useState(false);
    const [buscarText, setBuscarText] = useState('');

    // Estados para Modal Crear / Editar
    const [mostrarModal, setMostrarModal] = useState(false);
    const [editando, setEditando] = useState(false);
    const [clienteId, setClienteId] = useState(null);

    // Campos del formulario
    const [tipoDoc, setTipoDoc] = useState('DNI'); // 'DNI' o 'RUC'
    const [numDocumento, setNumDocumento] = useState('');
    const [razon, setRazon] = useState('');

    useEffect(() => {
        cargarClientes();
    }, []);

    const cargarClientes = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get('/api/clientes', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setClientes(Array.isArray(res.data) ? res.data : []);
        } catch (error) {
            console.error("Error al cargar clientes", error);
        } finally {
            setCargando(false);
        }
    };

    const limpiarFormulario = () => {
        setEditando(false);
        setClienteId(null);
        setTipoDoc('DNI');
        setNumDocumento('');
        setRazon('');
    };

    const abrirModalNuevo = () => {
        limpiarFormulario();
        setMostrarModal(true);
    };

    const abrirModalEditar = (cli) => {
        setEditando(true);
        setClienteId(cli.id);
        setTipoDoc(cli.tipo_doc || 'DNI');
        setNumDocumento(cli.num_documento || '');
        setRazon(cli.razon || '');
        setMostrarModal(true);
    };

    // CONSULTA API SUNAT / RENIEC
    const consultarDocumentoApi = async () => {
        if (!numDocumento.trim()) {
            Swal.fire('Atención', 'Ingrese el número de documento a consultar.', 'warning');
            return;
        }

        if (tipoDoc === 'DNI' && numDocumento.length !== 8) {
            Swal.fire('Atención', 'El DNI debe tener 8 dígitos.', 'warning');
            return;
        }

        if (tipoDoc === 'RUC' && numDocumento.length !== 11) {
            Swal.fire('Atención', 'El RUC debe tener 11 dígitos.', 'warning');
            return;
        }

        setBuscandoApi(true);

        try {
            const token = localStorage.getItem('token');
            const res = await axios.get(`/api/clientes/consultar-documento?numero=${numDocumento}`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (res.data && res.data.razon) {
                setRazon(res.data.razon);
                Swal.fire('¡Encontrado!', 'Datos obtenidos correctamente.', 'success');
            } else {
                Swal.fire('No encontrado', 'No se encontraron datos para el documento ingresado.', 'info');
            }
        } catch (error) {
            console.error(error);
            Swal.fire('Error', error.response?.data?.message || 'Error al consultar el documento.', 'error');
        } finally {
            setBuscandoApi(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!numDocumento.trim() || !razon.trim()) {
            Swal.fire('Atención', 'El número de documento y la razón social / nombre son obligatorios.', 'warning');
            return;
        }

        try {
            const token = localStorage.getItem('token');
            const payload = {
                tipo_doc: tipoDoc,
                num_documento: numDocumento,
                razon
            };

            if (editando) {
                await axios.put(`/api/clientes/${clienteId}`, payload, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                Swal.fire('¡Actualizado!', 'Datos del cliente modificados con éxito.', 'success');
            } else {
                await axios.post('/api/clientes', payload, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                Swal.fire('¡Registrado!', 'Cliente guardado correctamente.', 'success');
            }

            setMostrarModal(false);
            limpiarFormulario();
            cargarClientes();
        } catch (error) {
            Swal.fire('Error', error.response?.data?.message || 'Error al procesar la solicitud.', 'error');
        }
    };

    // ELIMINACIÓN DE CLIENTE (VALIDADO CONTRA MOVIMIENTOS)
    const handleEliminarCliente = (cli) => {
        if (!cli || !cli.id) return;

        Swal.fire({
            title: `¿Eliminar a "${cli.razon}"?`,
            text: "Esta acción solo se completará si el cliente no posee movimientos o registros asociados.",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#ef4444',
            cancelButtonColor: '#94a3b8',
            confirmButtonText: 'Sí, eliminar',
            cancelButtonText: 'Cancelar'
        }).then(async (result) => {
            if (result.isConfirmed) {
                try {
                    const token = localStorage.getItem('token');
                    const response = await axios.delete(`/api/clientes/${cli.id}`, {
                        headers: { Authorization: `Bearer ${token}` }
                    });

                    Swal.fire('¡Eliminado!', response.data?.message || 'Cliente removido con éxito.', 'success');
                    cargarClientes();
                } catch (error) {
                    Swal.fire(
                        'Acción no permitida', 
                        error.response?.data?.message || 'No se puede eliminar este cliente porque posee movimientos asociados en el sistema.', 
                        'error'
                    );
                }
            }
        });
    };

    // Filtro local
    const clientesFiltrados = clientes.filter(c => {
        const term = buscarText.toLowerCase();
        const docMatch = c.num_documento?.toLowerCase().includes(term);
        const razonMatch = c.razon?.toLowerCase().includes(term);
        return docMatch || razonMatch;
    });

    const totalRucCount = clientes.filter(c => c.tipo_doc === 'RUC').length;
    const totalDniCount = clientes.filter(c => c.tipo_doc === 'DNI' || !c.tipo_doc).length;

    if (cargando) {
        return (
            <div className="text-center py-5">
                <div className="spinner-border text-primary" role="status"></div>
                <p className="text-muted small mt-2">Cargando directorio de clientes...</p>
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
                            <span className="text-muted small fw-semibold">Total clientes</span>
                            <div className="rounded-circle p-2 d-flex align-items-center justify-content-center" style={{ width: '36px', height: '36px', backgroundColor: '#e0e7ff', color: '#4f46e5' }}>
                                <i className="fa-solid fa-users"></i>
                            </div>
                        </div>
                        <h3 className="fw-bold text-dark mb-0">{clientes.length}</h3>
                    </div>
                </div>

                <div className="col-12 col-md-4">
                    <div className="card border-0 shadow-sm rounded-4 p-3 bg-white h-100">
                        <div className="d-flex justify-content-between align-items-center mb-1">
                            <span className="text-muted small fw-semibold">Empresas (RUC)</span>
                            <div className="rounded-circle p-2 text-primary d-flex align-items-center justify-content-center" style={{ width: '36px', height: '36px', backgroundColor: '#cff4fc', color: '#0891b2' }}>
                                <i className="fa-solid fa-building"></i>
                            </div>
                        </div>
                        <h3 className="fw-bold text-info mb-0">{totalRucCount}</h3>
                    </div>
                </div>

                <div className="col-12 col-md-4">
                    <div className="card border-0 shadow-sm rounded-4 p-3 bg-white h-100">
                        <div className="d-flex justify-content-between align-items-center mb-1">
                            <span className="text-muted small fw-semibold">Personas (DNI)</span>
                            <div className="rounded-circle p-2 text-success d-flex align-items-center justify-content-center" style={{ width: '36px', height: '36px', backgroundColor: '#d1fae5' }}>
                                <i className="fa-solid fa-user-check"></i>
                            </div>
                        </div>
                        <h3 className="fw-bold text-success mb-0">{totalDniCount}</h3>
                    </div>
                </div>
            </div>

            {/* BÚSQUEDA Y BOTÓN NUEVO CLIENTE */}
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
                                placeholder="Buscar cliente por RUC/DNI o razón social..." 
                                value={buscarText} 
                                onChange={(e) => setBuscarText(e.target.value)} 
                            />
                        </div>
                    </div>

                    <div className="col-12 col-md-4 text-md-end">
                        <button 
                            onClick={abrirModalNuevo}
                            className="btn text-white fw-semibold px-3 py-2 rounded-3 shadow-sm d-inline-flex align-items-center gap-2"
                            style={{ backgroundColor: '#4f46e5', border: 'none' }}
                        >
                            <i className="fa-solid fa-plus fs-6"></i>
                            <span>Nuevo cliente</span>
                        </button>
                    </div>
                </div>
            </div>

            {/* TABLA DE CLIENTES */}
            <div className="card border-0 shadow-sm rounded-4 p-4 bg-white">
                <h6 className="fw-bold text-dark mb-3">Directorio de Clientes</h6>

                <div className="table-responsive">
                    <table className="table table-hover align-middle mb-0">
                        <thead className="table-light text-muted small fw-bold">
                            <tr>
                                <th>Tipo / Documento</th>
                                <th>Razón Social / Nombre</th>
                                <th>Saldo a Favor</th>
                                <th className="text-end pe-3" style={{ width: '120px' }}>Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="small">
                            {clientesFiltrados.length === 0 ? (
                                <tr>
                                    <td colSpan="4" className="text-center text-muted py-4">
                                        No se encontraron clientes registrados.
                                    </td>
                                </tr>
                            ) : (
                                clientesFiltrados.map((cli) => {
                                    const esRuc = cli.tipo_doc === 'RUC';
                                    const saldo = parseFloat(cli.saldo_favor || 0);

                                    return (
                                        <tr key={cli.id}>
                                            <td>
                                                <div className="d-flex align-items-center gap-2">
                                                    <span className={`badge rounded-pill px-2.5 py-1 fw-semibold ${
                                                        esRuc ? 'bg-info-subtle text-info-emphasis' : 'bg-success-subtle text-success'
                                                    }`}>
                                                        {cli.tipo_doc || 'DNI'}
                                                    </span>
                                                    <span className="fw-bold text-dark">{cli.num_documento}</span>
                                                </div>
                                            </td>
                                            <td>
                                                <div className="d-flex align-items-center gap-2.5">
                                                    <div 
                                                        className="rounded-circle d-flex align-items-center justify-content-center flex-shrink-0"
                                                        style={{ 
                                                            width: '36px', 
                                                            height: '36px', 
                                                            backgroundColor: esRuc ? '#cff4fc' : '#e0e7ff',
                                                            color: esRuc ? '#0891b2' : '#4f46e5'
                                                        }}
                                                    >
                                                        <i className={`fa-solid ${esRuc ? 'fa-building' : 'fa-user'}`}></i>
                                                    </div>
                                                    <div>
                                                        <span className="fw-bold text-dark fs-6 d-block">{cli.razon}</span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td>
                                                <span className={`fw-bold ${saldo > 0 ? 'text-success' : 'text-muted'}`}>
                                                    S/ {saldo.toFixed(2)}
                                                </span>
                                            </td>
                                            <td className="text-end pe-3">
                                                <div className="btn-group btn-group-sm">
                                                    <button 
                                                        onClick={() => abrirModalEditar(cli)}
                                                        className="btn btn-light border text-secondary me-1 rounded-2"
                                                        title="Editar cliente"
                                                    >
                                                        <i className="fa-regular fa-pen-to-square"></i>
                                                    </button>
                                                    <button 
                                                        onClick={() => handleEliminarCliente(cli)} 
                                                        className="btn btn-light border text-danger rounded-2 px-2 py-1"
                                                        title="Eliminar Cliente"
                                                    >
                                                        <i className="fa-regular fa-trash-can"></i>
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* MODAL CREAR / EDITAR CLIENTE */}
            {mostrarModal && (
                <div className="modal d-block backdrop-blur" style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1050 }}>
                    <div className="modal-dialog modal-dialog-centered" style={{ maxWidth: '480px' }}>
                        <div className="modal-content rounded-4 border-0 shadow p-2">
                            
                            <div className="modal-header border-bottom-0 pb-0">
                                <h5 className="modal-title fw-bold text-dark fs-5">
                                    {editando ? 'Modificar cliente' : 'Nuevo cliente'}
                                </h5>
                                <button 
                                    type="button" 
                                    className="btn-close" 
                                    onClick={() => { setMostrarModal(false); limpiarFormulario(); }}
                                ></button>
                            </div>

                            <form onSubmit={handleSubmit} className="modal-body pt-3">
                                
                                <div className="row g-2 mb-3">
                                    <div className="col-4">
                                        <label className="form-label small fw-semibold text-secondary mb-1">Tipo Doc.</label>
                                        <select 
                                            className="form-select rounded-3 py-2 border-light-subtle bg-light"
                                            value={tipoDoc}
                                            onChange={(e) => setTipoDoc(e.target.value)}
                                        >
                                            <option value="DNI">DNI</option>
                                            <option value="RUC">RUC</option>
                                        </select>
                                    </div>

                                    <div className="col-8">
                                        <label className="form-label small fw-semibold text-secondary mb-1">N° Documento *</label>
                                        <div className="input-group">
                                            <input 
                                                type="text" 
                                                className="form-control rounded-start-3 py-2 px-3 border-light-subtle bg-light"
                                                placeholder={tipoDoc === 'DNI' ? '8 dígitos' : '11 dígitos'}
                                                value={numDocumento}
                                                onChange={(e) => setNumDocumento(e.target.value)}
                                                required
                                                style={{ boxShadow: 'none' }}
                                            />
                                            <button 
                                                type="button"
                                                onClick={consultarDocumentoApi}
                                                disabled={buscandoApi}
                                                className="btn btn-primary rounded-end-3 px-3 d-flex align-items-center gap-1"
                                                style={{ backgroundColor: '#4f46e5', border: 'none' }}
                                                title="Consultar datos por API (SUNAT/RENIEC)"
                                            >
                                                {buscandoApi ? (
                                                    <span className="spinner-border spinner-border-sm" role="status"></span>
                                                ) : (
                                                    <i className="fa-solid fa-magnifying-glass fs-7"></i>
                                                )}
                                                <span className="small fw-semibold">{buscandoApi ? '' : 'Buscar'}</span>
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                <div className="mb-4">
                                    <label className="form-label small fw-semibold text-secondary mb-1">
                                        Razón Social / Nombre Completo *
                                    </label>
                                    <input 
                                        type="text" 
                                        className="form-control rounded-3 py-2 px-3 border-light-subtle bg-light"
                                        placeholder="Ej: Inversiones Sac / Juan Pérez"
                                        value={razon}
                                        onChange={(e) => setRazon(e.target.value)}
                                        required
                                        style={{ boxShadow: 'none' }}
                                    />
                                </div>

                                <div className="border-top pt-3 d-flex gap-2 justify-content-end">
                                    <button 
                                        type="button" 
                                        className="btn btn-light rounded-3 px-4 fw-semibold text-secondary"
                                        onClick={() => { setMostrarModal(false); limpiarFormulario(); }}
                                    >
                                        Cancelar
                                    </button>
                                    <button 
                                        type="submit" 
                                        className="btn text-white rounded-3 px-4 fw-semibold"
                                        style={{ backgroundColor: '#4f46e5', border: 'none' }}
                                    >
                                        {editando ? 'Guardar cambios' : 'Registrar cliente'}
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

export default Clientes;