<?php

use Illuminate\Support\Facades\Route;

// Cualquier ruta que NO empiece con "api" será redirigida a tu vista puente de React
Route::get('{any}', function () {
    return view('inicio');
})->where('any', '^(?!api).*$');
