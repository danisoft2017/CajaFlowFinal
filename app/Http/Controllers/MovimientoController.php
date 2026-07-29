<?php

namespace App\Http\Controllers;

use App\Models\Movimiento;
use App\Models\Caja;
use App\Models\DetalleMovimiento;
use Illuminate\Http\Request;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB; // <-- USAR ESTA IMPORTACIÓN COMPLETA

class MovimientoController extends Controller
{
    public function index(Request $request)
    {
        // Se añade la relación 'caja' para que Reportes pueda mostrar el nombre de la caja
        $query = Movimiento::with(['cliente', 'producto', 'caja', 'detalles.categoria', 'user']);

        // 1. Si la Petición viene desde REPORTES (Rango de fechas)
        if ($request->filled('fecha_desde') && $request->filled('fecha_hasta')) {
            $query->whereBetween('fecha', [$request->fecha_desde, $request->fecha_hasta]);
            $movimientos = $query->orderBy('fecha', 'desc')->orderBy('hora', 'desc')->get();
        } 
        // 2. Si la Petición viene desde MOVIMIENTOS DIARIOS (Fecha específica)
        else if ($request->filled('fecha')) {
            $query->where('fecha', $request->fecha);
            $movimientos = $query->orderBy('hora', 'desc')->get();
        } 
        // 3. Fallback (si no se envía ningún parámetro de fecha)
        else {
            $movimientos = $query->orderBy('fecha', 'desc')->orderBy('hora', 'desc')->get();
        }

        return response()->json($movimientos);
    }

    public function store(Request $request)
    {
        $request->validate([
            'fecha' => 'required|date',
            'hora' => 'required',
            'descripcion' => 'required|string|max:255',
            'caja_id' => 'required|exists:cajas,id',
            'monto' => 'required|numeric', // Permitir valores positivos y negativos
            'detalles' => 'required|array|min:1',
            'detalles.*.categoria_id' => 'required|exists:categorias,id',
            'detalles.*.importe' => 'required|numeric', // Permitir valores negativos
            'observacion' => 'nullable|string',
            'producto_id' => 'nullable|exists:productos,id',
            'cliente_id' => 'nullable|exists:clientes,id',
            'almacen_id' => 'nullable|exists:almacens,id',
            'precio' => 'nullable|numeric',
            'cantidad' => 'nullable|integer'
        ]);

        return DB::transaction(function () use ($request) {
            $datos = $request->all();
            if ($request->user()) {
                $datos['user_id'] = $request->user()->id;
            }

            $movimiento = Movimiento::create($datos);

            foreach ($request->detalles as $det) {
                DetalleMovimiento::create([
                    'movimiento_id' => $movimiento->id,
                    'categoria_id' => $det['categoria_id'],
                    'importe' => $det['importe']
                ]);
            }

            return response()->json(
                $movimiento->load(['caja', 'user', 'producto', 'cliente', 'almacen', 'detalles.categoria']), 
                201
            );
        });
    }

    public function update(Request $request, int $id)
    {
        $request->validate([
            'fecha' => 'required|date',
            'hora' => 'required',
            'descripcion' => 'required|string|max:255',
            'caja_id' => 'required|exists:cajas,id',
            'monto' => 'required|numeric',
            'detalles' => 'required|array|min:1',
            'detalles.*.categoria_id' => 'required|exists:categorias,id',
            'detalles.*.importe' => 'required|numeric',
            'observacion' => 'nullable|string',
            'producto_id' => 'nullable|exists:productos,id',
            'cliente_id' => 'nullable|exists:clientes,id',
            'almacen_id' => 'nullable|exists:almacens,id',
            'precio' => 'nullable|numeric',
            'cantidad' => 'nullable|integer'
        ]);

        $movimiento = Movimiento::find($id);

        if (!$movimiento) {
            return response()->json(['message' => 'Movimiento no encontrado.'], 404);
        }

        return DB::transaction(function () use ($request, $movimiento) {
            $movimiento->update($request->all());

            DetalleMovimiento::where('movimiento_id', $movimiento->id)->delete();

            foreach ($request->detalles as $det) {
                DetalleMovimiento::create([
                    'movimiento_id' => $movimiento->id,
                    'categoria_id' => $det['categoria_id'],
                    'importe' => $det['importe']
                ]);
            }

            return response()->json(
                $movimiento->load(['caja', 'user', 'producto', 'cliente', 'almacen', 'detalles.categoria'])
            );
        });
    }

    public function moverCaja(Request $request, int $id)
    {
        $request->validate([
            'caja_id' => 'required|exists:cajas,id'
        ]);

        $movimiento = Movimiento::find($id);

        if (!$movimiento) {
            return response()->json(['message' => 'Movimiento no encontrado.'], 404);
        }

        $movimiento->caja_id = $request->caja_id;
        $movimiento->save();

        return response()->json(
            $movimiento->load(['caja', 'user', 'producto', 'cliente', 'almacen', 'detalles.categoria'])
        );
    }

    // Obtener estadísticas públicas para la pantalla de inicio / Login
    public function obtenerMetricasLogin()
        {
            $fechaHoy = Carbon::now('America/Lima')->toDateString();

            // 1. Cajas registradas
            $cajasActivas = Caja::count();

            // 2. Movimientos registrados solo el día de HOY
            $movimientosHoy = Movimiento::with('detalles.categoria')
                ->where('fecha', $fechaHoy)
                ->get();

            $movimientosHoyCount = $movimientosHoy->count();

            // 3. Saldo Total real acumulado de HOY
            $saldoTotalHoy = 0;
            foreach ($movimientosHoy as $mov) {
                $monto = (float) $mov->monto;
                $tipo = $mov->detalles->first()?->categoria?->tipo ?? 'Ingreso';
                
                if ($tipo === 'Ingreso') {
                    $saldoTotalHoy += $monto;
                } else {
                    $saldoTotalHoy -= $monto;
                }
            }

            return response()->json([
                'cajas_activas' => $cajasActivas,
                'saldo_total' => number_format($saldoTotalHoy, 2, '.', ''),
                'movimientos_hoy' => $movimientosHoyCount
            ]);
        }
    }