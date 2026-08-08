<?php

namespace App\Http\Controllers;

use App\Models\Caja;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class CajaController extends Controller
{
    /**
     * Muestra las cajas y el saldo general.
     * Accesible para todos los usuarios autenticados.
     */
    public function index()
    {
        $cajas = Caja::withCount('movimientos')->get();
        
        $saldoTotal = $cajas->sum(function ($caja) {
            return $caja->movimientos()->sum('monto');
        });

        $cajasMapped = $cajas->map(function ($caja) use ($saldoTotal) {
            $monto = $caja->movimientos()->sum('monto');
            $pct = $saldoTotal > 0 ? round(($monto / $saldoTotal) * 100, 1) : 0;

            return [
                'id' => $caja->id,
                'nombre' => $caja->nombre,
                'descripcion' => $caja->descripcion,
                'estado' => (bool) $caja->estado,
                'monto' => $monto,
                'pct' => $pct,
                'movimientos_count' => $caja->movimientos_count
            ];
        });

        return response()->json([
            'saldo_total' => $saldoTotal,
            'cajas_activas' => $cajas->where('estado', true)->count(),
            'total_cajas' => $cajas->count(),
            'cajas' => $cajasMapped
        ]);
    }

    /**
     * Crear una nueva caja.
     * Solo SUPERADMIN y ADMIN.
     */
    public function store(Request $request)
    {
        $user = Auth::user();
        if (!in_array($user->role, ['superadmin', 'admin'])) {
            return response()->json([
                'message' => 'No tiene permisos para realizar esta acción. Requerido rol de Administrador o Superusuario.'
            ], 403);
        }

        $request->validate([
            'nombre' => 'required|string|max:100',
            'descripcion' => 'nullable|string'
        ]);

        $caja = Caja::create([
            'nombre' => $request->nombre,
            'descripcion' => $request->descripcion,
            'estado' => $request->boolean('estado', true)
        ]);

        return response()->json($caja, 201);
    }

    /**
     * Editar datos de una caja.
     * Solo SUPERADMIN y ADMIN.
     */
    public function update(Request $request, $id)
    {
        $user = Auth::user();
        if (!in_array($user->role, ['superadmin', 'admin'])) {
            return response()->json([
                'message' => 'No tiene permisos para realizar esta acción.'
            ], 403);
        }

        $caja = Caja::findOrFail($id);

        $request->validate([
            'nombre' => 'required|string|max:100',
            'descripcion' => 'nullable|string'
        ]);

        $caja->update([
            'nombre' => $request->nombre,
            'descripcion' => $request->descripcion,
            'estado' => $request->boolean('estado', $caja->estado)
        ]);

        return response()->json($caja);
    }

    /**
     * Activar o desactivar caja.
     * Solo SUPERADMIN y ADMIN.
     */
    public function toggleEstado($id)
    {
        $user = Auth::user();
        if (!in_array($user->role, ['superadmin', 'admin'])) {
            return response()->json([
                'message' => 'No tiene permisos para activar o desactivar cajas.'
            ], 403);
        }

        $caja = Caja::findOrFail($id);
        $caja->estado = !$caja->estado;
        $caja->save();

        return response()->json($caja);
    }

    /**
     * Eliminar caja si no tiene movimientos.
     * Solo SUPERADMIN y ADMIN.
     */
    public function destroy($id)
    {
        $user = Auth::user();
        if (!in_array($user->role, ['superadmin', 'admin'])) {
            return response()->json([
                'message' => 'No posee los permisos necesarios para eliminar cajas.'
            ], 403);
        }

        $caja = Caja::findOrFail($id);

        // Validación: No permitir borrar si la caja cuenta con movimientos asociados
        if ($caja->movimientos()->count() > 0) {
            return response()->json([
                'message' => 'No se puede eliminar la caja "' . $caja->nombre . '" porque cuenta con movimientos asociados.'
            ], 400);
        }

        $caja->delete();

        return response()->json(['message' => 'Caja eliminada correctamente.'], 200);
    }
}