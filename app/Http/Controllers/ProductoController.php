<?php

namespace App\Http\Controllers;

use App\Models\Producto;
use Illuminate\Http\Request;

class ProductoController extends Controller
{
    // Listar productos junto con la información de su almacén
    public function index()
    {
        return response()->json(Producto::with('almacen')->get());
    }

    // Guardar nuevo producto
    public function store(Request $request)
    {
        $request->validate([
            'descripcion' => 'required|string|max:255',
            'precio' => 'required|numeric|min:0',
            'almacen_id' => 'nullable|exists:almacens,id'
        ]);

        $producto = Producto::create([
            'descripcion' => $request->descripcion,
            'precio' => $request->precio,
            'almacen_id' => $request->almacen_id
        ]);

        return response()->json($producto->load('almacen'), 201);
    }

    // Actualizar producto
    public function update(Request $request, int $id)
    {
        $request->validate([
            'descripcion' => 'required|string|max:255',
            'precio' => 'required|numeric|min:0',
            'almacen_id' => 'nullable|exists:almacens,id'
        ]);

        $producto = Producto::find($id);

        if (!$producto) {
            return response()->json(['message' => 'Producto no encontrado'], 404);
        }

        $producto->update([
            'descripcion' => $request->descripcion,
            'precio' => $request->precio,
            'almacen_id' => $request->almacen_id
        ]);

        return response()->json($producto->load('almacen'));

    }

    public function destroy($id)
    {
        $producto = Producto::findOrFail($id);
        $producto->delete();

        return response()->json(['message' => 'Producto eliminado']);
    }
}