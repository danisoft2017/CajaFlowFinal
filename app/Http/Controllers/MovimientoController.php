<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Movimiento;


class MovimientoController extends Controller
{
// Listar todos los movimientos trayendo el nombre de su caja y categoría
    public function index()
    {
        return response()->json(Movimiento::with(['caja', 'categoria','user'])->get());
    }

    // Registrar un nuevo movimiento
    public function store(Request $request)
    {
        $request->validate([
            'fecha' => 'required|date',
            'hora' => 'required',
            'descripcion' => 'required|string|max:255',
            'caja_id' => 'required|exists:cajas,id',
            'categoria_id' => 'required|exists:categorias,id',
            'monto' => 'required|numeric|min:0.01'
        ]);

        $datos = $request->all();
        
        // Si el request trae el id del usuario logueado lo asigna, o mediante Sanctum
        if ($request->user()) {
            $datos['user_id'] = $request->user()->id;
        }

        $movimiento = Movimiento::create($datos);

        return response()->json($movimiento->load(['caja', 'categoria', 'user']), 201);
    }
}
