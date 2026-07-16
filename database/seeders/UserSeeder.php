<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\User;
use Illuminate\Support\Facades\Hash;

class UserSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // 1. Usuario Superadmin (Control total y creación de usuarios)
        User::create([
            'name' => 'Ana García',
            'email' => 'ana.garcia@empresa.com',
            'password' => Hash::make('admin123'),
            'role' => 'superadmin',
        ]);

        // 2. Usuario Administrador 
        User::create([
            'name' => 'Carlos Mendoza',
            'email' => 'carlos.admin@empresa.com',
            'password' => Hash::make('admin123'),
            'role' => 'admin',
        ]);

        // 3. Usuario Operador (Solo ve sus movimientos asignados)
        User::create([
            'name' => 'Juan Pérez',
            'email' => 'juan.ops@empresa.com',
            'password' => Hash::make('admin123'),
            'role' => 'operador',
        ]);
    }
}
