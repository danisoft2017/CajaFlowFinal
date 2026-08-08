<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\CajaController;
use App\Http\Controllers\CategoriaController;
use App\Http\Controllers\MovimientoController;
use App\Http\Controllers\ClienteController;
use App\Http\Controllers\ProductoController;
use App\Http\Controllers\AlmacenController;
use App\Http\Controllers\GarantiaController;
use App\Http\Controllers\DashboardController;

/*
|--------------------------------------------------------------------------
| RUTAS PÚBLICAS (Sin autenticación previa)
|--------------------------------------------------------------------------
*/
Route::post('/login', [AuthController::class, 'login']);
Route::get('/resumen-publico', [AuthController::class, 'resumenPublico']);
Route::get('/public/metricas-login', [MovimientoController::class, 'obtenerMetricasLogin']);
Route::get('/clientes/consultar-documento', [ClienteController::class, 'consultarDocumento']);

/*
|--------------------------------------------------------------------------
| RUTAS PROTEGIDAS (Requieren Token de Sanctum)
|--------------------------------------------------------------------------
*/
Route::middleware('auth:sanctum')->group(function () {

    // 👤 Usuarios del Sistema
    Route::get('/usuarios', [AuthController::class, 'indexUsuarios']);
    Route::post('/usuarios', [AuthController::class, 'storeUsuario']);
    Route::put('/usuarios/{id}', [AuthController::class, 'updateUsuario']);
    Route::put('/usuarios/{id}/password', [AuthController::class, 'cambiarPassword']);
    Route::patch('/usuarios/{id}/toggle', [AuthController::class, 'toggleEstado']);

    // 📊 Métricas del Dashboard (Corregido a minúsculas)
    Route::get('/dashboard/metricas', [DashboardController::class, 'metricas']);

    // 💵 Módulo de Cajas
    Route::get('/cajas', [CajaController::class, 'index']);
    Route::post('/cajas', [CajaController::class, 'store']);
    Route::put('/cajas/{id}', [CajaController::class, 'update']);
    Route::patch('/cajas/{id}/toggle-estado', [CajaController::class, 'toggleEstado']);
    Route::delete('/cajas/{id}', [CajaController::class, 'destroy']);

    // 🏷️ Módulo de Categorías
    Route::get('/categorias', [CategoriaController::class, 'index']);
    Route::post('/categorias', [CategoriaController::class, 'store']);
    Route::put('/categorias/{id}', [CategoriaController::class, 'update']);
    Route::delete('/categorias/{id}', [CategoriaController::class, 'destroy']);

    // 💸 Módulo de Movimientos
    Route::get('/movimientos', [MovimientoController::class, 'index']);
    Route::post('/movimientos', [MovimientoController::class, 'store']);
    Route::put('/movimientos/{id}', [MovimientoController::class, 'update']);
    Route::patch('/movimientos/{id}/mover', [MovimientoController::class, 'moverCaja']);
    Route::delete('/movimientos/{id}', [MovimientoController::class, 'destroy']);

    // 👥 Módulo de Clientes
    Route::get('/clientes', [ClienteController::class, 'index']);
    Route::post('/clientes', [ClienteController::class, 'store']);
    Route::put('/clientes/{id}', [ClienteController::class, 'update']);
    Route::delete('/clientes/{id}', [ClienteController::class, 'destroy']);
    Route::get('/clientes/{id}/saldo', [ClienteController::class, 'consultarSaldo']);
    Route::post('/clientes/{id}/ajustar-saldo', [ClienteController::class, 'ajustarSaldoFavor']);
    

    // 📦 Módulo de Productos
    Route::get('/productos', [ProductoController::class, 'index']);
    Route::post('/productos', [ProductoController::class, 'store']);
    Route::put('/productos/{id}', [ProductoController::class, 'update']);

    // 🏭 Módulo de Almacenes
    Route::get('/almacens', [AlmacenController::class, 'index']);
    Route::post('/almacens', [AlmacenController::class, 'store']);
    Route::put('/almacens/{id}', [AlmacenController::class, 'update']);

    // 🛡️ Módulo de Garantías
    Route::get('/garantias', [GarantiaController::class, 'index']);
    Route::post('/garantias/{id}/devolver', [GarantiaController::class, 'devolver']);

});