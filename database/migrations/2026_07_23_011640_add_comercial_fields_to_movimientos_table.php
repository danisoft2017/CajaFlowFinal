<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('movimientos', function (Blueprint $table) {
            // Relaciones opcionales (nullable por si hay un movimiento sin producto/cliente asignado)
            $table->foreignId('producto_id')->nullable()->constrained('productos')->onDelete('set null');
            $table->foreignId('cliente_id')->nullable()->constrained('clientes')->onDelete('set null');
            $table->foreignId('almacen_id')->nullable()->constrained('almacens')->onDelete('set null');
            
            // Campos comerciales
            $table->decimal('precio', 10, 2)->nullable()->after('monto');
            $table->integer('cantidad')->default(1)->after('precio');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('movimientos', function (Blueprint $table) {
            $table->dropForeign(['producto_id']);
            $table->dropForeign(['cliente_id']);
            $table->dropForeign(['almacen_id']);
            $table->dropColumn(['producto_id', 'cliente_id', 'almacen_id', 'precio', 'cantidad']);
        });
    }
};
