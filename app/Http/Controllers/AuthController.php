<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

class AuthController extends Controller
{
    public function login(Request $request)
    {
        $request->validate([
            'email' => 'required|email',
            'password' => 'required',
        ]);

        $user = User::where('email', $request->email)->first();

        // Validar si el usuario existe y la contraseña es correcta
        if (! $user || ! Hash::check($request->password, $user->password)) {
            return response()->json([
                'message' => 'Las credenciales introducidas son incorrectas.'
            ], 401);
        }

        if (!$user->activo) {
            return response()->json(['message' => 'Tu usuario se encuentra desactivado. Contacta al administrador.'], 403);
        }


        // Generate a new token for the user
        $token = $user->createToken('auth_token')->plainTextToken;

        return response()->json([
            'access_token' => $token,
            'user' => [
                'name' => $user->name,
                'email' => $user->email,
                'role' => $user->role,
                'avatar' => $user->avatar
            ]
        ]);
    }
    public function indexUsuarios()
    {
        return response()->json(\App\Models\User::where('role', '!=', 'superadmin')->get());
    }

    // public function updateUsuario(Request $request, int $id)
    // {
    //     $request->validate([
    //         'name' => 'required|string|max:255',
    //         'role' => 'required|in:admin,superadmin,operador'
    //     ]);

    //     $user = \App\Models\User::find($id);
    //     if (!$user) {
    //         return response()->json(['message' => 'Usuario no encontrado'], 404);
    //     }

    //     $user->update([
    //         'name' => $request->name,
    //         'role' => $request->role
    //     ]);

    //     return response()->json($user);
    // }
    
    public function cambiarPassword(Request $request, int $id)
    {
        $request->validate([
            'password' => 'required|string|min:6'
        ]);

        $user = \App\Models\User::find($id);
        if (!$user) {
            return response()->json(['message' => 'Usuario no encontrado'], 404);
        }

        $user->update([
            'password' => \Illuminate\Support\Facades\Hash::make($request->password)
        ]);

        return response()->json(['message' => 'Contraseña actualizada con éxito']);
    }
    
    public function storeUsuario(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|unique:users,email',
            'password' => 'required|string|min:6',
            'role' => 'required|in:admin,operador',
            'avatar' => 'string|nullable'
        ]);

        $user = \App\Models\User::create([
            'name' => $request->name,
            'email' => $request->email,
            'password' => \Illuminate\Support\Facades\Hash::make($request->password),
            'role' => $request->role,
            'avatar' => $request->avatar??'👤',
            'activo' => true
        ]);

        return response()->json($user, 201);
    }
    public function updateUsuario(Request $request, int $id)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'role' => 'required|in:admin,operador',
            'avatar' => 'string|nullable'
        ]);

        $user = \App\Models\User::find($id);
        if (!$user || $user->role === 'superadmin') {
            return response()->json(['message' => 'Acción no permitida'], 403);
        }

        $user->update([
            'name' => $request->name,
            'role' => $request->role,
            'avatar' => $request->avatar ?? $user->avatar
        ]);

        return response()->json($user);
    }
    public function toggleEstado(int $id)
    {
        $user = \App\Models\User::find($id);
        if (!$user || $user->role === 'superadmin') {
            return response()->json(['message' => 'Acción no permitida'], 403);
        }

        // Invierte el valor booleano actual
        $user->update([
            'activo' => !$user->activo
        ]);

        return response()->json($user);
    }
// Resumen público para la pantalla de Login (sin necesidad de token)
    public function resumenPublico()
    {
        // 1. Total de Cajas Activas
        $cajasActivas = \App\Models\Caja::count();

        // 2. Fecha actual de Perú
        $hoyPeru = \Carbon\Carbon::now('America/Lima')->toDateString();

        // 3. Cantidad de Movimientos realizados hoy
        $movimientosHoy = \App\Models\Movimiento::where('fecha', $hoyPeru)->count();

        // 4. Saldo Total acumulado en el sistema (Ingresos - Egresos)
        $movimientos = \App\Models\Movimiento::with('categoria')->get();
        $totalIngresos = 0;
        $totalEgresos = 0;

        foreach ($movimientos as $mov) {
            if ($mov->categoria && $mov->categoria->tipo === 'Ingreso') {
                $totalIngresos += $mov->monto;
            } elseif ($mov->categoria && $mov->categoria->tipo === 'Egreso') {
                $totalEgresos += $mov->monto;
            }
        }

        $saldoTotal = $totalIngresos - $totalEgresos;

        return response()->json([
            'cajas_activas' => $cajasActivas,
            'movimientos_hoy' => $movimientosHoy,
            'saldo_total' => number_format($saldoTotal, 2, '.', '')
        ]);
    }
}
