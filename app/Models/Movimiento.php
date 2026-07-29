<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Movimiento extends Model
{
    protected $fillable = [
        'fecha', 
        'hora', 
        'descripcion', 
        'observacion',
        'caja_id', 
        'user_id', 
        'producto_id',
        'cliente_id',
        'almacen_id',
        'precio',
        'cantidad',
        'monto'
    ];

    // Relación de un Movimiento con múltiples detalles de categorías
    public function detalles()
    {
        return $this->hasMany(DetalleMovimiento::class, 'movimiento_id');
    }

    public function caja()
    {
        return $this->belongsTo(Caja::class);
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function producto()
    {
        return $this->belongsTo(Producto::class);
    }

    public function cliente()
    {
        return $this->belongsTo(Cliente::class);
    }

    public function almacen()
    {
        return $this->belongsTo(Almacen::class);
    }
}