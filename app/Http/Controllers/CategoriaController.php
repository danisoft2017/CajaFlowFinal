<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Categoria;

class CategoriaController extends Controller
{
    public function index()
    {
        return response()->json(Categoria::all());
    }

    public function store(Request $request)
    {
        $request->validate([
            'nombre' => 'required|string|max:255',
            'tipo' => 'required|string|max:255',
        ]);

        $categoria = Categoria::create([
            'nombre' => $request->nombre,
            'tipo' => $request->tipo
        ]);

        return response()->json($categoria, 201);
    }
    public function update(Request $request, int $id)
    {
        $request->validate([
            'nombre' => 'required|string|max:255',
            'tipo' => 'required|string|max:255',
        ]);

        $categoria = Categoria::find($id);

        if (!$categoria) {
            return response()->json(['message' => 'Categoría no encontrada'], 404);
        }

        $categoria->update([
            'nombre' => $request->nombre,
            'tipo' => $request->tipo
        ]);

        return response()->json($categoria);
    }

    public function destroy($id)
    {
        $categoria = Categoria::find($id);

        if (!$categoria) {
            return response()->json(['message' => 'La categoría no existe.'], 404);
        }

        // 1. Verificar si existen detalles de movimiento vinculados a esta categoría
        $tieneMovimientos = \App\Models\DetalleMovimiento::where('categoria_id', $id)->exists();

        if ($tieneMovimientos) {
            return response()->json([
                'message' => 'No se puede eliminar la categoría porque ya tiene registros/movimientos asociados.'
            ], 422); // Unprocessable Entity
        }

        // 2. Si no tiene ninguna relación, procedemos a eliminar
        $categoria->delete();

        return response()->json([
            'message' => 'Categoría eliminada con éxito.'
        ], 200);
    }

}
