<?php

namespace App\Http\Controllers;

use App\Models\Garantia;
use App\Models\Movimiento;
use App\Models\DetalleMovimiento;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Auth;

class GarantiaController extends Controller
{
    /**
     * Listar todas las garantías con filtros por cliente o estado.
     */
    public function index(Request $request)
    {
        $query = Garantia::with([
            'cliente', 
            'movimientoIngreso', 
            'movimientoDevolucion', 
            'cajaIngreso', 
            'cajaDevolucion'
        ]);

        if ($request->filled('estado')) {
            $query->where('estado', $request->estado);
        }

        if ($request->filled('cliente_id')) {
            $query->where('cliente_id', $request->cliente_id);
        }

        $garantias = $query->orderBy('fecha_deposito', 'desc')->get();

        return response()->json($garantias);
    }

    /**
     * Procesar la devolución de una garantía (Genera movimiento de egreso de caja).
     */
    public function devolver(Request $request, $id)
    {
        $request->validate([
            'caja_id' => 'required|exists:cajas,id',
            'categoria_id' => 'required|exists:categorias,id',
            'fecha' => 'required|date',
            'hora' => 'required',
            'observacion' => 'nullable|string'
        ]);

        $garantia = Garantia::findOrFail($id);

        if ($garantia->estado === 'DEVUELTO') {
            return response()->json([
                'message' => 'Esta garantía ya fue devuelta anteriormente el ' . $garantia->fecha_devolucion
            ], 400);
        }

        return DB::transaction(function () use ($request, $garantia) {
            $userId = Auth::id() ?? 1;
            $montoEgreso = -abs($garantia->monto_garantia); // Valor negativo para egreso de caja

            $clienteNombre = $garantia->cliente ? $garantia->cliente->razon : 'Cliente';

            // 1. Registrar movimiento de salida (Egreso)
            $movDevolucion = Movimiento::create([
                'fecha' => $request->fecha,
                'hora' => $request->hora,
                'descripcion' => "Devolución de Garantía - {$clienteNombre} (Ref. Garantía #{$garantia->id})",
                'caja_id' => $request->caja_id,
                'cliente_id' => $garantia->cliente_id,
                'user_id' => $userId,
                'monto' => $montoEgreso,
                'observacion' => $request->observacion ?? "Devolución de depósito del {$garantia->fecha_deposito}"
            ]);

            // 2. Registrar detalle de categoría
            DetalleMovimiento::create([
                'movimiento_id' => $movDevolucion->id,
                'categoria_id' => $request->categoria_id,
                'importe' => $montoEgreso
            ]);

            // 3. Actualizar estado de la garantía
            $garantia->update([
                'estado' => 'DEVUELTO',
                'movimiento_devolucion_id' => $movDevolucion->id,
                'caja_devolucion_id' => $request->caja_id,
                'fecha_devolucion' => $request->fecha,
                'observacion' => $request->observacion
            ]);

            return response()->json([
                'message' => 'Garantía devuelta exitosamente.',
                'garantia' => $garantia->load(['movimientoDevolucion', 'cajaDevolucion'])
            ], 200);
        });
    }
}