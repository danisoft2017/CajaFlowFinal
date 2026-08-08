<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class DetalleMovimiento extends Model
{
    protected $table = 'detalle_movimientos';

    protected $fillable = [
        'movimiento_id',
        'categoria_id',
        'importe'
    ];

    public function movimiento()
    {
        return $this->belongsTo(Movimiento::class);
    }

    public function categoria()
    {
        return $this->belongsTo(Categoria::class);
    }
    public function garantia()
    {
        return $this->hasOne(Garantia::class, 'movimiento_ingreso_id');
    }
}