import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(''); // Limpiar errores previos

        try {
            // Enviamos los datos directamente a la API de Laravel
            const response = await axios.post('/api/login', { email, password });
            
            // Guardamos el token de seguridad y datos básicos en el navegador
            localStorage.setItem('token', response.data.access_token);
            localStorage.setItem('user', JSON.stringify(response.data.user));

            // Nos vamos directo al entorno del Dashboard
            navigate('/dashboard');
        } catch (err) {
            setError(err.response?.data?.message || 'Error al conectar con el servidor.');
        }
    };

    return (
        <div style={{ maxWidth: '300px', margin: '50px auto', padding: '20px', background: '#fff', borderRadius: '5px' }}>
            <h2>Iniciar Sesión</h2>
            
            {error && <p style={{ color: 'red' }}>{error}</p>}

            <form onSubmit={handleSubmit}>
                <div style={{ marginBottom: '10px' }}>
                    <label>Correo Electrónico:</label>
                    <input 
                        type="email" 
                        value={email} 
                        onChange={(e) => setEmail(e.target.value)} 
                        required 
                        style={{ width: '100%', padding: '5px', marginTop: '5px' }}
                    />
                </div>

                <div style={{ marginBottom: '15px' }}>
                    <label>Contraseña:</label>
                    <input 
                        type="password" 
                        value={password} 
                        onChange={(e) => setPassword(e.target.value)} 
                        required 
                        style={{ width: '100%', padding: '5px', marginTop: '5px' }}
                    />
                </div>

                <button type="submit" style={{ width: '100%', padding: '8px', cursor: 'pointer' }}>
                    Ingresar al sistema
                </button>
            </form>
        </div>
    );
}

export default Login;