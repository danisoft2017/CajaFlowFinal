<?php
use App\Http\Controllers\AuthController;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\CajaController;
use App\Http\Controllers\CategoriaController;
use App\Http\Controllers\MovimientoController;
use App\Http\Controllers\ClienteController;
use App\Http\Controllers\ProductoController;
use App\Http\Controllers\AlmacenController;


Route::post('/login', [AuthController::class, 'login']);
Route::get('/usuarios', [AuthController::class, 'indexUsuarios']);
Route::put('/usuarios/{id}', [AuthController::class, 'updateUsuario']);
Route::put('/usuarios/{id}/password', [AuthController::class, 'cambiarPassword']);
Route::post('/usuarios', [AuthController::class, 'storeUsuario']);
Route::patch('/usuarios/{id}/toggle', [AuthController::class, 'toggleEstado']);


Route::get('/cajas', [CajaController::class, 'index']);
Route::post('/cajas', [CajaController::class, 'store']);
Route::put('/cajas/{id}', [CajaController::class, 'update']);
Route::get('/dashboard/metricas', [CajaController::class, 'obtenerMetricasDashboard']);
Route::patch('/cajas/{id}/toggle-estado', [CajaController::class, 'toggleEstado']);

Route::get('/categorias', [CategoriaController::class, 'index']);
Route::post('/categorias', [CategoriaController::class, 'store']);
Route::put('/categorias/{id}', [CategoriaController::class, 'update']);
Route::delete('/categorias/{id}', [CategoriaController::class, 'destroy']);

Route::get('/movimientos', [MovimientoController::class, 'index']);
Route::post('/movimientos', [MovimientoController::class, 'store']);
Route::put('/movimientos/{id}', [MovimientoController::class, 'update']);
Route::patch('/movimientos/{id}/mover', [MovimientoController::class, 'moverCaja']);
Route::get('/public/metricas-login', [MovimientoController::class, 'obtenerMetricasLogin']);

Route::get('/resumen-publico', [AuthController::class, 'resumenPublico']);

Route::get('/clientes/consultar-documento', [ClienteController::class, 'consultarDocumento']);

Route::get('/clientes', [ClienteController::class, 'index']);
Route::post('/clientes', [ClienteController::class, 'store']);
Route::put('/clientes/{id}', [ClienteController::class, 'update']);


Route::get('/productos', [ProductoController::class, 'index']);
Route::post('/productos', [ProductoController::class, 'store']);
Route::put('/productos/{id}', [ProductoController::class, 'update']);

Route::get('/almacens', [AlmacenController::class, 'index']);
Route::post('/almacens', [AlmacenController::class, 'store']);
Route::put('/almacens/{id}', [AlmacenController::class, 'update']);

