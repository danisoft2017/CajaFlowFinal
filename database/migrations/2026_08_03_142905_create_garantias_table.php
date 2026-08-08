<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('garantias', function (Blueprint $table) {
            $table->id();
            $table->foreignId('movimiento_ingreso_id')->constrained('movimientos')->onDelete('cascade');
            $table->foreignId('movimiento_devolucion_id')->nullable()->constrained('movimientos')->onDelete('set null');
            $table->foreignId('cliente_id')->nullable()->constrained('clientes')->onDelete('set null');
            $table->foreignId('caja_ingreso_id')->nullable()->constrained('cajas')->onDelete('set null');
            $table->foreignId('caja_devolucion_id')->nullable()->constrained('cajas')->onDelete('set null');
            $table->decimal('monto_garantia', 12, 2);
            $table->enum('estado', ['PENDIENTE', 'DEVUELTO', 'RETENIDO'])->default('PENDIENTE');
            $table->date('fecha_deposito');
            $table->date('fecha_devolucion')->nullable();
            $table->text('observacion')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('garantias');
    }
};