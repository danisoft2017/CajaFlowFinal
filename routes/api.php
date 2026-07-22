<?php
use App\Http\Controllers\AuthController;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\CajaController;
use App\Http\Controllers\CategoriaController;
use App\Http\Controllers\MovimientoController;



Route::post('/login', [AuthController::class, 'login']);
Route::get('/usuarios', [AuthController::class, 'indexUsuarios']);
Route::put('/usuarios/{id}', [AuthController::class, 'updateUsuario']);
Route::put('/usuarios/{id}/password', [AuthController::class, 'cambiarPassword']);
Route::post('/usuarios', [AuthController::class, 'storeUsuario']);
Route::patch('/usuarios/{id}/toggle', [AuthController::class, 'toggleEstado']);


Route::get('/cajas', [CajaController::class, 'index']);
Route::post('/cajas', [CajaController::class, 'store']);
Route::put('/cajas/{id}', [CajaController::class, 'update']);

Route::get('/categorias', [CategoriaController::class, 'index']);
Route::post('/categorias', [CategoriaController::class, 'store']);
Route::put('/categorias/{id}', [CategoriaController::class, 'update']);

Route::get('/movimientos', [MovimientoController::class, 'index']);
Route::post('/movimientos', [MovimientoController::class, 'store']);

Route::get('/resumen-publico', [AuthController::class, 'resumenPublico']);