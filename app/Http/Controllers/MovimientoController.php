<?php

namespace App\Http\Controllers;

use App\Models\Movimiento;
use App\Models\DetalleMovimiento;
use App\Models\DetalleProducto;
use App\Models\Caja;
use App\Models\Cliente;
use App\Models\Categoria;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Auth;

class MovimientoController extends Controller
{
    /**
     * Obtiene la lista de movimientos con sus relaciones.
     */
    public function index(Request $request)
    {
        $query = Movimiento::with([
            'cliente', 
            'caja', 
            'detalles.categoria', 
            'detallesProductos.producto', 
            'detallesProductos.almacen', 
            'user'
        ]);

        if ($request->filled('fecha_desde') && $request->filled('fecha_hasta')) {
            $query->whereBetween('fecha', [$request->fecha_desde, $request->fecha_hasta]);
            $movimientos = $query->orderBy('fecha', 'desc')->orderBy('hora', 'desc')->get();
        } else if ($request->filled('fecha')) {
            $query->where('fecha', $request->fecha);
            $movimientos = $query->orderBy('hora', 'desc')->get();
        } else {
            $movimientos = $query->orderBy('fecha', 'desc')->orderBy('hora', 'desc')->get();
        }

        return response()->json($movimientos);
    }


    public function store(Request $request)
    {
        $request->validate([
            'caja_id'     => 'required|exists:cajas,id',
            'monto'       => 'required|numeric',
            'descripcion' => 'required|string|max:255',
            'detalles'    => 'required|array|min:1'
        ]);

        return DB::transaction(function () use ($request) {
            
            // -------------------------------------------------------------------------
            // 1. CÁLCULO PREVIO DE EFECTIVO REAL EN CAJA
            // -------------------------------------------------------------------------
            $montoEfectivoCaja = $request->monto;

            if ($request->boolean('usar_saldo_favor') && $request->filled('cliente_id')) {
                $cliente = Cliente::find($request->cliente_id);

                if ($cliente && $cliente->saldo_favor > 0) {
                    // Monto cubierto con saldo a favor
                    $cubiertoConSaldo = min($cliente->saldo_favor, abs($request->monto));
                    
                    // Solo ingresa a la caja física la diferencia (si el saldo no cubrió la totalidad)
                    $montoEfectivoCaja = $request->monto - $cubiertoConSaldo;

                    // Restar inmediatamente del saldo disponible del cliente
                    $cliente->decrement('saldo_favor', $cubiertoConSaldo);
                }
            }

            // -------------------------------------------------------------------------
            // 2. CREACIÓN DEL MOVIMIENTO (CON MONTO DE CAJA REAL)
            // -------------------------------------------------------------------------
            $movimiento = Movimiento::create([
                'fecha'          => $request->fecha,
                'hora'           => $request->hora,
                'descripcion'    => $request->descripcion,
                'caja_id'        => $request->caja_id,
                'cliente_id'     => $request->cliente_id,
                'user_id'        => Auth::id(),
                'monto'          => $montoEfectivoCaja, // 👈 Evita inflar la caja física
                'observacion'    => $request->observacion . ($request->boolean('usar_saldo_favor') ? ' (Pagado con Saldo a Favor)' : ''),
                'tiene_garantia' => $request->tiene_garantia ?? false,
                'monto_garantia' => $request->monto_garantia
            ]);

            // -------------------------------------------------------------------------
            // 3. DETALLES DE CATEGORÍAS Y PRODUCTOS
            // -------------------------------------------------------------------------
            foreach ($request->detalles as $det) {
                $movimiento->detalles()->create([
                    'categoria_id' => $det['categoria_id'],
                    'importe'      => $det['importe']
                ]);
            }

            if ($request->filled('detalles_productos')) {
                foreach ($request->detalles_productos as $dp) {
                    $movimiento->detallesProductos()->create([
                        'almacen_id'  => $dp['almacen_id'],
                        'producto_id' => $dp['producto_id'],
                        'precio'      => $dp['precio'],
                        'cantidad'    => $dp['cantidad'],
                        'importe'     => $dp['importe']
                    ]);
                }
            }

            // -------------------------------------------------------------------------
            // 4. LÓGICA DE AUMENTO DE SALDO A FAVOR (SÓLO SI ES INGRESO DE ADELANTO)
            // -------------------------------------------------------------------------
            if ($request->filled('cliente_id') && $request->monto > 0 && !$request->boolean('usar_saldo_favor')) {
                $esSaldoAFavor = false;

                foreach ($request->detalles as $det) {
                    $catObj = Categoria::find($det['categoria_id']);
                    if ($catObj) {
                        $nombreCat = strtolower(trim($catObj->nombre));
                        if (str_contains($nombreCat, 'adelanto') || str_contains($nombreCat, 'saldo a favor') || str_contains($nombreCat, 'anticipo')) {
                            $esSaldoAFavor = true;
                            break;
                        }
                    }
                }

                if ($esSaldoAFavor) {
                    $cliente = Cliente::find($request->cliente_id);
                    if ($cliente) {
                        $cliente->increment('saldo_favor', abs($request->monto));
                    }
                }
            }

            return response()->json($movimiento->load(['cliente', 'detalles.categoria']), 201);
        });
    }

    /**
     * Actualiza un movimiento existente.
     */
    public function update(Request $request, $id)
    {
        $request->validate([
            'caja_id'     => 'required|exists:cajas,id',
            'monto'       => 'required|numeric',
            'descripcion' => 'required|string|max:255',
            'detalles'    => 'required|array|min:1'
        ]);

        return DB::transaction(function () use ($request, $id) {
            // 1. Obtener movimiento actual antes de modificar
            $movimiento = Movimiento::with('detalles.categoria')->findOrFail($id);

            $clienteAnteriorId = $movimiento->cliente_id;
            $montoAnterior = abs($movimiento->monto);

            // Identificar si el movimiento anterior era un Saldo a Favor / Adelanto
            $eraSaldoAFavor = false;
            foreach ($movimiento->detalles as $det) {
                if ($det->categoria) {
                    $nombreCat = strtolower(trim($det->categoria->nombre));
                    if (str_contains($nombreCat, 'adelanto') || str_contains($nombreCat, 'saldo a favor') || str_contains($nombreCat, 'anticipo')) {
                        $eraSaldoAFavor = true;
                        break;
                    }
                }
            }

            // 2. Identificar si el NUEVO movimiento también es Saldo a Favor
            $esNuevoSaldoAFavor = false;
            foreach ($request->detalles as $det) {
                $catObj = \App\Models\Categoria::find($det['categoria_id']);
                if ($catObj) {
                    $nombreCat = strtolower(trim($catObj->nombre));
                    if (str_contains($nombreCat, 'adelanto') || str_contains($nombreCat, 'saldo a favor') || str_contains($nombreCat, 'anticipo')) {
                        $esNuevoSaldoAFavor = true;
                        break;
                    }
                }
            }

            $nuevoClienteId = $request->cliente_id;
            $nuevoMonto = abs($request->monto);

            // -------------------------------------------------------------------------
            // 3. REAJUSTE DE SALDOS A FAVOR
            // -------------------------------------------------------------------------

            // Caso A: Misma categoría y mismo cliente (Ajuste por diferencia de monto)
            if ($eraSaldoAFavor && $esNuevoSaldoAFavor && $clienteAnteriorId == $nuevoClienteId && $clienteAnteriorId) {
                $diferencia = $nuevoMonto - $montoAnterior;
                $cliente = Cliente::find($clienteAnteriorId);

                if ($cliente) {
                    // Si la diferencia es negativa (reducen el adelanto), verificar disponible
                    if ($diferencia < 0 && $cliente->saldo_favor < abs($diferencia)) {
                        return response()->json([
                            'message' => 'No se puede reducir el monto del adelanto porque el cliente ya consumió parte del saldo disponible.'
                        ], 400);
                    }
                    $cliente->saldo_favor = $cliente->saldo_favor + $diferencia;
                    $cliente->save();
                }
            } 
            // Caso B: Cambio de cliente o la categoría dejó de ser Adelanto
            else {
                // Revertir cliente anterior si era adelanto
                if ($eraSaldoAFavor && $clienteAnteriorId) {
                    $cliAnt = Cliente::find($clienteAnteriorId);
                    if ($cliAnt) {
                        if ($cliAnt->saldo_favor < $montoAnterior) {
                            return response()->json([
                                'message' => 'No se puede editar este movimiento porque el cliente anterior ya utilizó parte del saldo depositado.'
                            ], 400);
                        }
                        $cliAnt->decrement('saldo_favor', $montoAnterior);
                    }
                }

                // Aplicar nuevo cliente si es adelanto
                if ($esNuevoSaldoAFavor && $nuevoClienteId) {
                    $cliNue = Cliente::find($nuevoClienteId);
                    if ($cliNue) {
                        $cliNue->increment('saldo_favor', $nuevoMonto);
                    }
                }
            }

            // 4. Actualizar datos base del movimiento
            $movimiento->update([
                'fecha'          => $request->fecha,
                'hora'           => $request->hora,
                'descripcion'    => $request->descripcion,
                'caja_id'        => $request->caja_id,
                'cliente_id'     => $nuevoClienteId,
                'monto'          => $request->monto,
                'observacion'    => $request->observacion,
                'tiene_garantia' => $request->tiene_garantia ?? false,
                'monto_garantia' => $request->monto_garantia
            ]);

            // 5. Reemplazar detalles de categorías
            $movimiento->detalles()->delete();
            foreach ($request->detalles as $det) {
                $movimiento->detalles()->create([
                    'categoria_id' => $det['categoria_id'],
                    'importe'      => $det['importe']
                ]);
            }

            // 6. Reemplazar detalles de productos
            $movimiento->detallesProductos()->delete();
            if ($request->filled('detalles_productos')) {
                foreach ($request->detalles_productos as $dp) {
                    $movimiento->detallesProductos()->create([
                        'almacen_id'  => $dp['almacen_id'],
                        'producto_id' => $dp['producto_id'],
                        'precio'      => $dp['precio'],
                        'cantidad'    => $dp['cantidad'],
                        'importe'     => $dp['importe']
                    ]);
                }
            }

            return response()->json($movimiento->load(['cliente', 'detalles.categoria']), 200);
        });
    }

/**
     * Elimina un movimiento y sus detalles en cascada.
     */
/**
 * Elimina un movimiento y reajusta el saldo del cliente según el tipo de operación.
 */
/**
 * Elimina un movimiento y reajusta el saldo del cliente según el tipo de operación.
 */
        public function destroy($id)
        {
            return DB::transaction(function () use ($id) {
                // 1. Obtener el movimiento con sus relaciones de categorías
                $movimiento = Movimiento::with('detalles.categoria')->findOrFail($id);

                // 2. Verificar si el movimiento estaba asociado a un cliente
                if ($movimiento->cliente_id) {
                    $cliente = Cliente::find($movimiento->cliente_id);

                    if ($cliente) {
                        $esSaldoAFavor = false;

                        // Verificar si alguna categoría del movimiento corresponde a saldo a favor / adelanto / consumo
                        foreach ($movimiento->detalles as $det) {
                            if ($det->categoria) {
                                $nombreCat = strtolower(trim($det->categoria->nombre));
                                if (str_contains($nombreCat, 'adelanto') || 
                                    str_contains($nombreCat, 'saldo a favor') || 
                                    str_contains($nombreCat, 'anticipo') ||
                                    str_contains($nombreCat, 'consumo de saldo')) {
                                    $esSaldoAFavor = true;
                                    break;
                                }
                            }
                        }

                        $montoRevertir = abs($movimiento->monto);

                        // CASO A: SI ERA UN INGRESO DE ADELANTO (Monto > 0)
                        // Al eliminar el depósito, se le RESTA el saldo al cliente
                        if ($esSaldoAFavor && $movimiento->monto > 0) {
                            if ($cliente->saldo_favor < $montoRevertir) {
                                return response()->json([
                                    'message' => 'No se puede eliminar este depósito porque el cliente ya consumió parte del saldo disponible (Saldo actual: S/ ' . number_format($cliente->saldo_favor, 2) . ').'
                                ], 400);
                            }
                            $cliente->decrement('saldo_favor', $montoRevertir);
                        }

                        // CASO B: SI ERA UNA VENTA / CONSUMO DE SALDO (Se pagó con saldo a favor o monto de caja en 0)
                        // Al eliminar la venta, EL SALDO REGRESA / SE REINTEGRA AL CLIENTE (+S/)
                        if ($movimiento->monto == 0 || ($esSaldoAFavor && $movimiento->monto <= 0)) {
                            // Si se guardó el monto original consumido, se le reintegra al cliente
                            $montoARegresar = $montoRevertir > 0 ? $montoRevertir : $movimiento->detalles->sum('importe');
                            $cliente->increment('saldo_favor', abs($montoARegresar));
                        }
                    }
                }

                // 3. Eliminar el movimiento y sus relaciones
                $movimiento->detalles()->delete();
                $movimiento->detallesProductos()->delete();
                if ($movimiento->garantia) {
                    $movimiento->garantia()->delete();
                }
                $movimiento->delete();

                return response()->json(['message' => 'Movimiento eliminado y saldo de cliente reajustado correctamente.'], 200);
            });
        }
    }