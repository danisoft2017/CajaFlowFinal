<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;


class Movimiento extends Model
{
    protected $fillable = ['fecha', 'hora', 'descripcion', 'caja_id', 'categoria_id', 'user_id', 'monto'];

    public function caja()
    {
        return $this->belongsTo(Caja::class);
    }

    public function categoria()
    {
        return $this->belongsTo(Categoria::class);
    }

    // Relación con el Usuario que hizo el movimiento
    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
