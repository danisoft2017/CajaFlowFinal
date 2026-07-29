<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Producto extends Model
{
    protected $fillable = ['descripcion', 'precio', 'almacen_id'];

    // Relación con el Almacén asignado
    public function almacen()
    {
        return $this->belongsTo(Almacen::class, 'almacen_id');
    }
}
