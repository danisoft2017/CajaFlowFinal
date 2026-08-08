<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Categoria extends Model
{
    use HasFactory;

    protected $table = 'categorias';

    protected $fillable = [
        'caja_id',
        'nombre',
        'tipo'
    ];

    public function caja()
    {
        return $this->belongsTo(Caja::class, 'caja_id');
    }

    public function detallesMovimientos()
    {
        return $this->hasMany(DetalleMovimiento::class, 'categoria_id');
    }
}