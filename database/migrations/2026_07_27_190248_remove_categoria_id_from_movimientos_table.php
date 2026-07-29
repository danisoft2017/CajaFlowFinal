<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('movimientos', function (Blueprint $table) {
            // Eliminar la relación y la columna categoria_id
            $table->dropForeign(['categoria_id']);
            $table->dropColumn('categoria_id');
        });
    }

    public function down(): void
    {
        Schema::table('movimientos', function (Blueprint $table) {
            $table->foreignId('categoria_id')->nullable()->constrained('categorias');
        });
    }
};