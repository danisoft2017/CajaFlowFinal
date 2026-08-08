<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Caja;
use App\Models\Movimiento;
use App\Models\DetalleMovimiento;
use Illuminate\Support\Facades\Log;
use Throwable;

class DashboardController extends Controller
{
    public function metricas(Request $request)
    {
        try {
            // 1. Obtener la fecha seleccionada
            $fecha = $request->query('fecha', date('Y-m-d'));



            // 3. CONTEO DE CAJAS ACTIVAS
            $cajasActivasCount = Caja::count();

            // 4. MOVIMIENTOS EXCLUSIVAMENTE DEL DÍA SELECCIONADO
            $movimientosHoy = Movimiento::whereDate('fecha', $fecha)->get();

            $ingresosHoy = (float) $movimientosHoy->where('monto', '>', 0)->sum('monto');
            $egresosHoy  = (float) abs($movimientosHoy->where('monto', '<', 0)->sum('monto'));

            // 2. SALDO TOTAL ACUMULADO (Monto total histórico de la empresa en la BD)
            $saldoTotalCajas = $ingresosHoy - $egresosHoy;
            
            // 5. NETO REAL DEL DÍA (Ingresos del día - Egresos del día)
            $saldoNetoHoy = $ingresosHoy - $egresosHoy;

            // 6. RESUMEN ACUMULADO POR CADA CAJA
            $cajas = Caja::all();
            $resumenCajas = $cajas->map(function ($caja) {
                $movsCaja = Movimiento::where('caja_id', $caja->id)->get();

                $ingresos = (float) $movsCaja->where('monto', '>', 0)->sum('monto');
                $egresos  = (float) abs($movsCaja->where('monto', '<', 0)->sum('monto'));
                $neto     = $ingresos - $egresos;

                return [
                    'caja_id'  => $caja->id,
                    'caja'     => $caja->nombre,
                    'ingresos' => $ingresos,
                    'egresos'  => $egresos,
                    'neto'     => $neto
                ];
            });

            // 7. DESGLOSE DE CATEGORÍAS POR CAJA
            $resumenCategoriasPorCaja = $cajas->map(function ($caja) {
                $categoriasDetalle = DetalleMovimiento::whereHas('movimiento', function ($q) use ($caja) {
                    $q->where('caja_id', $caja->id);
                })
                ->with('categoria')
                ->get()
                ->groupBy('categoria_id')
                ->map(function ($grupo) {
                    $primerRegistro = $grupo->first();
                    $nombreCat = $primerRegistro->categoria ? $primerRegistro->categoria->nombre : 'Sin Categoría';
                    $tipoCat   = $primerRegistro->categoria ? $primerRegistro->categoria->tipo : 'INGRESO';
                    $totalBruto = $grupo->sum('importe');

                    return [
                        'categoria' => $nombreCat,
                        'tipo'      => $tipoCat,
                        'total'     => (float) $totalBruto
                    ];
                })
                ->values();

                return [
                    'caja'       => $caja->nombre,
                    'categorias' => $categoriasDetalle
                ];
            });

            return response()->json([
                'saldo_total_cajas'   => $saldoTotalCajas,
                'cajas_activas_count' => $cajasActivasCount,
                'ingresos_hoy'        => $ingresosHoy,
                'egresos_hoy'         => $egresosHoy,
                'saldo_neto_hoy'      => $saldoNetoHoy,
                'resumen_cajas'       => $resumenCajas,
                'resumen_categorias'  => $resumenCategoriasPorCaja
            ], 200);

        } catch (Throwable $e) {
            Log::error("Error en DashboardController@metricas: " . $e->getMessage());

            return response()->json([
                'message' => 'Error al calcular métricas.',
                'error'   => $e->getMessage()
            ], 500);
        }
    }
}