<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // 1. Quitar los campos antiguos de la tabla movimientos
        Schema::table('movimientos', function (Blueprint $table) {
            // Eliminar llaves foráneas si existen
            $table->dropForeign(['almacen_id']);
            $table->dropForeign(['producto_id']);
            
            // Eliminar las columnas
            $table->dropColumn(['almacen_id', 'producto_id', 'precio', 'cantidad']);
        });

        // 2. Crear la nueva tabla detalle_productos
        Schema::create('detalle_productos', function (Blueprint $table) {
            $table->id();
            $table->foreignId('movimiento_id')->constrained('movimientos')->onDelete('cascade');
            $table->foreignId('almacen_id')->nullable()->constrained('almacens')->onDelete('set null');
            $table->foreignId('producto_id')->nullable()->constrained('productos')->onDelete('set null');
            $table->decimal('precio', 12, 2)->default(0);
            $table->integer('cantidad')->default(1);
            $table->decimal('importe', 12, 2)->default(0);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('detalle_productos');

        Schema::table('movimientos', function (Blueprint $table) {
            $table->foreignId('almacen_id')->nullable()->constrained('almacens');
            $table->foreignId('producto_id')->nullable()->constrained('productos');
            $table->decimal('precio', 12, 2)->nullable();
            $table->integer('cantidad')->default(1);
        });
    }
};