<?php

namespace App\Http\Controllers;

use App\Models\Almacen;
use Illuminate\Http\Request;

class AlmacenController extends Controller
{
    // Listar todos los almacenes
    public function index()
    {
        return response()->json(Almacen::all());
    }

    // Guardar nuevo almacén
    public function store(Request $request)
    {
        $request->validate([
            'descripcion' => 'required|string|max:255'
        ]);

        $almacen = Almacen::create([
            'descripcion' => $request->descripcion
        ]);

        return response()->json($almacen, 201);
    }

    // Actualizar almacén
    public function update(Request $request, int $id)
    {
        $request->validate([
            'descripcion' => 'required|string|max:255'
        ]);

        $almacen = Almacen::find($id);

        if (!$almacen) {
            return response()->json(['message' => 'Almacén no encontrado'], 404);
        }

        $almacen->update([
            'descripcion' => $request->descripcion
        ]);

        return response()->json($almacen);
    }
}