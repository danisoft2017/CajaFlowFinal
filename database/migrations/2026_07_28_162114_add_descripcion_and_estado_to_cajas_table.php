<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('cajas', function (Blueprint $table) {
            $table->string('descripcion')->nullable()->after('nombre');
            $table->boolean('estado')->default(true)->after('descripcion'); // true = Activa (1), false = Inactiva (0)
        });
    }

    public function down(): void
    {
        Schema::table('cajas', function (Blueprint $table) {
            $table->dropColumn(['descripcion', 'estado']);
        });
    }
};