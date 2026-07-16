<?php
use App\Http\Controllers\AuthController;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\CajaController;
use App\Http\Controllers\CategoriaController;


Route::post('/login', [AuthController::class, 'login']);

Route::get('/cajas', [CajaController::class, 'index']);
Route::post('/cajas', [CajaController::class, 'store']);
Route::put('/cajas/{id}', [CajaController::class, 'update']);

Route::get('/categorias', [CategoriaController::class, 'index']);
Route::post('/categorias', [CategoriaController::class, 'store']);
Route::put('/categorias/{id}', [CategoriaController::class, 'update']);

