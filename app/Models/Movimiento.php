<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;


class Movimiento extends Model
{
    protected $fillable = ['fecha', 'hora', 'descripcion', 'caja_id', 'categoria_id', 'monto'];

    // Relación con Caja
    public function caja()
    {
        return $this->belongsTo(Caja::class);
    }

    // Relación con Categoría
    public function categoria()
    {
        return $this->belongsTo(Categoria::class);
    }
}
