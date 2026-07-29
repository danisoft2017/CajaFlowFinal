<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Categoria extends Model
{
    protected $table = 'categorias';

    protected $fillable = [
        'nombre',
        'tipo'
    ];

    public function detalles()
    {
        return $this->hasMany(DetalleMovimiento::class, 'categoria_id');
    }
}