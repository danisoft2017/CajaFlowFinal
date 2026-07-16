<?php

namespace App\Models;

use Illuminate\Foundation\Auth\User as Authenticatable;
use Laravel\Sanctum\HasApiTokens; // <-- Esta es la importación clave

class User extends Authenticatable
{
    use HasApiTokens; // <-- Esto le enseña al modelo a usar 'createToken()'

    protected $fillable = [
        'name',
        'email',
        'password',
        'role',
    ];

    protected $hidden = [
        'password',
    ];
}