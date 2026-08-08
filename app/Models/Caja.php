<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Caja extends Model
{
    protected $table = 'cajas';

    protected $fillable = [
        'nombre',
        'descripcion',
        'estado'
    ];

    protected $casts = [
        'estado' => 'boolean' // Convierte automático 1/0 a true/false
    ];

    public function movimientos()
    {
        return $this->hasMany(Movimiento::class, 'caja_id');
    }
    public function categorias()
    {
        return $this->hasMany(Categoria::class, 'caja_id');
    }
}