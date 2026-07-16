<?php

namespace App\Http\Controllers;
use App\Models\Caja;
use Illuminate\Http\Request;

class CajaController extends Controller
{
    public function index()
    {
        return response()->json(Caja::all());
    }
    public function store(Request $request)
    {
        $request->validate([
            'nombre' => 'required|string|max:255',
        ]);

        $caja = Caja::create($request->all());

        return response()->json($caja, 201);
    }
    public function update(Request $request,int $id)
    {
        $request->validate([
            'nombre' => 'required|string|max:255'
        ]);

        $caja = Caja::find($id);

        if (!$caja) {
            return response()->json(['message' => 'Caja no encontrada'], 404);
        }

        $caja->update([
            'nombre' => $request->nombre
        ]);

        return response()->json($caja);
    }
}
