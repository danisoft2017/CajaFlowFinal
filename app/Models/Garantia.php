<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use App\Models\Movimiento;
use App\Models\Cliente;
use App\Models\Caja;

class Garantia extends Model
{
    use HasFactory;

    protected $table = 'garantias';

    protected $fillable = [
        'movimiento_ingreso_id',
        'movimiento_devolucion_id',
        'cliente_id',
        'caja_ingreso_id',
        'caja_devolucion_id',
        'monto_garantia',
        'estado',
        'fecha_deposito',
        'fecha_devolucion',
        'observacion'
    ];

    public function movimientoIngreso()
    {
        return $this->belongsTo(Movimiento::class, 'movimiento_ingreso_id');
    }

    public function movimientoDevolucion()
    {
        return $this->belongsTo(Movimiento::class, 'movimiento_devolucion_id');
    }

    public function cliente()
    {
        return $this->belongsTo(Cliente::class, 'cliente_id');
    }

    public function cajaIngreso()
    {
        return $this->belongsTo(Caja::class, 'caja_ingreso_id');
    }

    public function cajaDevolucion()
    {
        return $this->belongsTo(Caja::class, 'caja_devolucion_id');
    }
}