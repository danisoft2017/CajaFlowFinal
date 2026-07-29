<?php

namespace App\Http\Controllers;

use App\Models\Caja;
use App\Models\Movimiento;
use Illuminate\Http\Request;
use Carbon\Carbon;

class CajaController extends Controller
{
    public function index(Request $request)
    {
        $query = Caja::query();

        // Si se solicita filtrar solo las activas
        if ($request->has('solo_activas') && $request->boolean('solo_activas')) {
            $query->where('estado', true);
        }

        $cajas = $query->get();
        $saldoTotalGlobal = (float) Movimiento::sum('monto');
        
        $resultadoCajas = [];

        foreach ($cajas as $idx => $caja) {
            $montoCaja = (float) Movimiento::where('caja_id', $caja->id)->sum('monto');
            $pct = $saldoTotalGlobal > 0 ? round(($montoCaja / $saldoTotalGlobal) * 100, 1) : 0;

            $resultadoCajas[] = [
                'id' => $caja->id,
                'nombre' => $caja->nombre,
                'descripcion' => $caja->descripcion ?? 'Sucursal de operaciones',
                'estado' => (bool) $caja->estado,
                'monto' => $montoCaja,
                'pct' => max(0, min(100, $pct))
            ];
        }

        return response()->json([
            'saldo_total' => $saldoTotalGlobal,
            'cajas_activas' => Caja::where('estado', true)->count(),
            'total_cajas' => Caja::count(),
            'cajas' => $resultadoCajas
        ]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'nombre' => 'required|string|max:255',
            'descripcion' => 'nullable|string|max:255',
            'estado' => 'nullable|boolean'
        ]);

        $caja = Caja::create([
            'nombre' => $request->nombre,
            'descripcion' => $request->descripcion,
            'estado' => $request->has('estado') ? $request->estado : true
        ]);

        return response()->json($caja, 201);
    }

    public function update(Request $request, $id)
    {
        $request->validate([
            'nombre' => 'required|string|max:255',
            'descripcion' => 'nullable|string|max:255',
            'estado' => 'nullable|boolean'
        ]);

        $caja = Caja::findOrFail($id);
        $caja->update([
            'nombre' => $request->nombre,
            'descripcion' => $request->descripcion,
            'estado' => $request->has('estado') ? $request->estado : $caja->estado
        ]);

        return response()->json($caja);
    }

    // Cambiar estado booleano (Toggle 1 -> 0 / 0 -> 1)
    public function toggleEstado($id)
    {
        $caja = Caja::findOrFail($id);
        $caja->estado = !$caja->estado;
        $caja->save();

        return response()->json([
            'id' => $caja->id,
            'estado' => (bool) $caja->estado,
            'message' => $caja->estado ? 'Caja activada' : 'Caja desactivada'
        ]);
    }
    public function obtenerMetricasDashboard()
    {
        $anioActual = Carbon::now('America/Lima')->year;
        $mesActual = Carbon::now('America/Lima')->month;

        // 1. Saldo Total Global
        $saldoTotal = (float) Movimiento::sum('monto');

        // 2. Movimientos del mes actual
        $movimientosMes = Movimiento::whereYear('fecha', $anioActual)
            ->whereMonth('fecha', $mesActual)
            ->get();

        $ingresosMes = 0;
        $egresosMes = 0;

        foreach ($movimientosMes as $m) {
            $val = (float) $m->monto;
            if ($val >= 0) {
                $ingresosMes += $val;
            } else {
                $egresosMes += abs($val);
            }
        }

        $balanceGeneral = $ingresosMes - $egresosMes;

        // 3. OBTENER SOLO CAJAS ACTIVAS (estado = true)
        $cajasActivas = Caja::where('estado', true)->get();
        $listaCajas = [];
        $colores = ['#4f46e5', '#10b981', '#f59e0b', '#06b6d4', '#ec4899', '#8b5cf6'];

        foreach ($cajasActivas as $idx => $caja) {
            $montoCaja = (float) Movimiento::where('caja_id', $caja->id)->sum('monto');
            $pct = $saldoTotal > 0 ? round(($montoCaja / $saldoTotal) * 100, 1) : 0;

            $listaCajas[] = [
                'id' => $caja->id,
                'nombre' => $caja->nombre,
                'monto' => $montoCaja,
                'pct' => max(0, min(100, $pct)),
                'color' => $colores[$idx % count($colores)]
            ];
        }

        // 4. Datos Mensuales para el Gráfico
        $mesesNombres = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
        $chartIngresos = array_fill(0, 12, 0);
        $chartEgresos = array_fill(0, 12, 0);

        $movimientosAnio = Movimiento::whereYear('fecha', $anioActual)->get();

        foreach ($movimientosAnio as $m) {
            $mesIdx = Carbon::parse($m->fecha)->month - 1;
            $val = (float) $m->monto;
            if ($val >= 0) {
                $chartIngresos[$mesIdx] += $val;
            } else {
                $chartEgresos[$mesIdx] += abs($val);
            }
        }

        // 5. Últimos movimientos
        $ultimosMovimientos = Movimiento::with(['caja'])
            ->orderBy('fecha', 'desc')
            ->orderBy('hora', 'desc')
            ->take(6)
            ->get();

        $totalRegistrosCount = Movimiento::count();

        return response()->json([
            'saldo_total' => $saldoTotal,
            'ingresos_mes' => $ingresosMes,
            'egresos_mes' => $egresosMes,
            'balance_general' => $balanceGeneral,
            'cajas' => $listaCajas,
            'total_cajas_activas' => $cajasActivas->count(), // <-- Muestra el conteo de activas
            'ultimos_movimientos' => $ultimosMovimientos,
            'total_registros' => $totalRegistrosCount,
            'chart' => [
                'labels' => array_slice($mesesNombres, 0, $mesActual),
                'ingresos' => array_slice($chartIngresos, 0, $mesActual),
                'egresos' => array_slice($chartEgresos, 0, $mesActual)
            ]
        ]);
    }
}
