<?php

namespace App\Http\Controllers;

use App\Models\Categoria;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;


class CategoriaController extends Controller
{
    /**
     * Listar categorías (Accesible para TODOS los usuarios autenticados).
     */
    public function index(Request $request)
    {
        $query = Categoria::with('caja')->withCount('detallesMovimientos');

        if ($request->filled('caja_id')) {
            $query->where('caja_id', $request->caja_id);
        }

        // ORDENAR PRIMERO POR CAJA Y LUEGO POR NOMBRE DE CATEGORÍA
        return response()->json(
            $query->orderBy('caja_id', 'asc')
                ->orderBy('nombre', 'asc')
                ->get()
        );
    }

    /**
     * Crear categoría (Solo Superadmin y Admin).
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
                'nombre'  => 'required|string|max:100',
                'caja_id' => 'required|exists:cajas,id',
                'tipo'    => 'required|in:INGRESO,EGRESO'
            ]);

    
            $categoria = Categoria::create([
                'nombre'  => trim($request->nombre),
                'caja_id' => $request->caja_id,
                'tipo'    => $request->tipo
            ]);

            return response()->json($categoria->load('caja'), 201);


    }

    /**
     * Editar categoría (Solo Superadmin y Admin).
     */
    public function update(Request $request, $id)
    {
        $user = Auth::user();
        if (!in_array($user->role, ['superadmin', 'admin'])) {
            return response()->json([
                'message' => 'No tiene permisos para realizar esta acción. Requerido rol de Administrador o Superusuario.'
            ], 403);
        }

        $categoria = Categoria::findOrFail($id);

        $request->validate([
            'nombre'  => 'required|string|max:100',
            'caja_id' => 'required|exists:cajas,id',
            'tipo'    => 'required|in:INGRESO,EGRESO'
        ]);

        $categoria->update([
            'nombre'  => $request->nombre,
            'caja_id' => $request->caja_id,
            'tipo'    => $request->tipo
        ]);

        return response()->json($categoria->load('caja'));
    }

    /**
     * Eliminar categoría (Solo Superadmin/Admin y si NO ha sido usada en movimientos).
     */
    public function destroy($id)
    {
        $user = Auth::user();
        if (!in_array($user->role, ['superadmin', 'admin'])) {
            return response()->json([
                'message' => 'No tiene permisos para realizar esta acción. Requerido rol de Administrador o Superusuario.'
            ], 403);
        }

        $categoria = Categoria::findOrFail($id);

        if ($categoria->detallesMovimientos()->count() > 0) {
            return response()->json([
                'message' => 'No se puede eliminar la categoría "' . $categoria->nombre . '" porque ya cuenta con movimientos vinculados.'
            ], 400);
        }

        $categoria->delete();

        return response()->json(['message' => 'Categoría eliminada correctamente.'], 200);
    }
}