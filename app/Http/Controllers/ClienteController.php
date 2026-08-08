<?php

namespace App\Http\Controllers;

use App\Models\Cliente;
use App\Models\Movimiento;
use Illuminate\Http\Request;


class ClienteController extends Controller
{
    // Listar todos los clientes
    public function index()
    {
        return response()->json(Cliente::all());
    }

    // Registrar un nuevo cliente
    public function store(Request $request)
    {
        $request->validate([
            'num_documento' => 'required|string|max:20|unique:clientes,num_documento',
            'razon' => 'required|string|max:255'
        ]);

        $cliente = Cliente::create([
            'num_documento' => $request->num_documento,
            'razon' => $request->razon
        ]);

        return response()->json($cliente, 201);
    }

    // Actualizar un cliente existente
    public function update(Request $request, int $id)
    {
        $request->validate([
            'num_documento' => 'required|string|max:20|unique:clientes,num_documento,'.$id,
            'razon' => 'required|string|max:255'
        ]);

        $cliente = Cliente::find($id);

        if (!$cliente) {
            return response()->json(['message' => 'Cliente no encontrado'], 404);
        }

        $cliente->update([
            'num_documento' => $request->num_documento,
            'razon' => $request->razon
        ]);

        return response()->json($cliente);
    }

    public function destroy($id)
    {
        // 1. Buscar al cliente
        $cliente = Cliente::findOrFail($id);

        // 2. Verificar si tiene movimientos registrados en la base de datos
        $conteoMovimientos = Movimiento::where('cliente_id', $cliente->id)->count();

        if ($conteoMovimientos > 0) {
            return response()->json([
                'message' => 'No se puede eliminar el cliente "' . $cliente->razon . '" porque tiene ' . $conteoMovimientos . ' movimiento(s) registrado(s).'
            ], 400);
        }

        // 3. Eliminar si no tiene movimientos
        $cliente->delete();

        return response()->json([
            'message' => 'Cliente eliminado correctamente.'
        ], 200);
    }
// Consulta directa a RENIEC / SUNAT
    public function consultarDocumento(Request $request)
    {
        $numero = trim($request->input('numero'));

        if (!$numero) {
            return response()->json(['message' => 'Ingrese un número de documento'], 400);
        }

        $longitud = strlen($numero);
        $url = '';

        if ($longitud === 8) {
            $url = 'https://api.apis.net.pe/v1/dni?numero=' . $numero;
        } elseif ($longitud === 11) {
            $url = 'https://api.apis.net.pe/v1/ruc?numero=' . $numero;
        } else {
            return response()->json(['message' => 'El documento debe tener 8 dígitos (DNI) o 11 (RUC)'], 400);
        }

        try {
            // Opciones para omitir verificación SSL local si estás en XAMPP/Laragon
            $arrContextOptions = [
                "ssl" => [
                    "verify_peer" => false,
                    "verify_peer_name" => false,
                ],
            ];

            $response = @file_get_contents($url, false, stream_context_create($arrContextOptions));

            if ($response === FALSE) {
                return response()->json(['message' => 'No se encontraron datos para el documento ingresado.'], 404);
            }

            $data = json_decode($response, true);

            // Extraer el nombre según la estructura JSON que vimos en tu captura
            $nombreRazon = '';

            if (isset($data['nombre']) && !empty($data['nombre'])) {
                $nombreRazon = $data['nombre'];
            } elseif (isset($data['nombres'])) {
                $nombreRazon = trim($data['nombres'] . ' ' . ($data['apellidoPaterno'] ?? '') . ' ' . ($data['apellidoMaterno'] ?? ''));
            } elseif (isset($data['razonSocial'])) {
                $nombreRazon = $data['razonSocial'];
            }

            return response()->json([
                'num_documento' => $numero,
                'razon' => $nombreRazon
            ]);

        } catch (\Exception $e) {
            return response()->json(['message' => 'Error de conexión con el servicio externo.'], 500);
        }
    }

public function consultarSaldo($id)
    {
        $cliente = Cliente::findOrFail($id);
        
        return response()->json([
            'cliente_id' => $cliente->id,
            'razon' => $cliente->razon,
            'num_documento' => $cliente->num_documento,
            'saldo_favor' => (float)$cliente->saldo_favor
        ]);
    }

    /**
     * Ajustar saldo a favor (vía depósito o consumo)
     */
    public function ajustarSaldoFavor(Request $request, $id)
    {
        $request->validate([
            'monto' => 'required|numeric', // Positivo si deposita adelanto, negativo si consume
            'concepto' => 'required|string'
        ]);

        $cliente = Cliente::findOrFail($id);
        
        // Suma o resta al saldo acumulado del cliente
        $cliente->saldo_favor = $cliente->saldo_favor + $request->monto;
        
        if ($cliente->saldo_favor < 0) {
            return response()->json(['message' => 'El consumo excede el saldo a favor disponible del cliente.'], 400);
        }

        $cliente->save();

        return response()->json([
            'message' => 'Saldo actualizado correctamente',
            'saldo_favor' => (float)$cliente->saldo_favor
        ]);
    }    

}