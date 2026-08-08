<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use App\Models\Caja;
use App\Models\Cliente;
use App\Models\User;
use App\Models\DetalleMovimiento; // <-- Importante: Tu modelo de desglose por categoría
use App\Models\DetalleProducto;   // <-- Tu modelo para los productos agregados

class Movimiento extends Model
{
    use HasFactory;

    protected $table = 'movimientos';

    protected $fillable = [
        'fecha',
        'hora',
        'descripcion',
        'caja_id',
        'cliente_id',
        'user_id',
        'monto',
        'observacion'
    ];

    /**
     * Relación con la Caja en la que se registra el movimiento.
     */
    public function caja()
    {
        return $this->belongsTo(Caja::class, 'caja_id');
    }

    /**
     * Relación con el Cliente asignado (opcional).
     */
    public function cliente()
    {
        return $this->belongsTo(Cliente::class, 'cliente_id');
    }

    /**
     * Relación con el Usuario responsable.
     */
    public function user()
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    /**
     * Relación con los detalles de desglose por categorías (DetalleMovimiento).
     */
    public function detalles()
    {
        return $this->hasMany(DetalleMovimiento::class, 'movimiento_id');
    }

    /**
     * Relación con los productos agregados (DetalleProducto).
     */
    public function detallesProductos()
    {
        return $this->hasMany(DetalleProducto::class, 'movimiento_id');
    }
}