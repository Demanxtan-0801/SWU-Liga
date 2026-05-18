# 🌌 SWTCG Liga Imperial — Guía de Instalación

## Stack
- **Frontend:** Next.js 15 + TypeScript
- **Base de datos + Auth + Storage:** Supabase (gratuito)
- **Deploy:** Vercel (gratuito)

---

## Paso 1 — Crear proyecto en Supabase

1. Ve a [supabase.com](https://supabase.com) → **New Project**
2. Ponle un nombre (ej. `swtcg-liga`) y elige una región cercana (São Paulo es la más cercana)
3. Espera que se cree (~2 min)

### 1a. Crear las tablas
1. Ve a **SQL Editor** en el dashboard de Supabase
2. Copia y pega todo el contenido de `supabase-schema.sql` y haz clic en **Run**

### 1b. Crear el bucket de imágenes
1. Ve a **Storage** → **New Bucket**
2. Nombre: `hall-of-fame` | Marca **Public bucket** ✓ → Save

### 1c. Crear el usuario admin
1. Ve a **Authentication** → **Users** → **Add user**
2. Ingresa email y contraseña del admin → Confirm

---

## Paso 2 — Variables de entorno

1. Copia: `cp .env.local.example .env.local`
2. Ve a Supabase → **Project Settings** → **API** y copia:
   - Project URL → `NEXT_PUBLIC_SUPABASE_URL`
   - anon/public key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`

---

## Paso 3 — Probar localmente

```bash
npm install
npm run dev
```

Abre http://localhost:3000

---

## Paso 4 — Deploy en Vercel

1. Sube el proyecto a GitHub (nuevo repo)
2. Ve a [vercel.com](https://vercel.com) → **New Project** → importa el repo
3. En **Environment Variables** agrega las dos variables de Supabase
4. **Deploy** ✓

---

## Sistema de puntos

| Resultado | Puntos |
|-----------|--------|
| ✅ Asistencia | 1pt |
| ⚔️ Top 4 | 2pt |
| 🥉 Top 3 | 3pt |
| 🥈 Finalista | 4pt |
| 🏆 Campeón | 6pt |

## Flujo semanal (Panel Admin → /admin)

1. Crear temporada (pestaña **Temporadas**)
2. Agregar jugadores (pestaña **Jugadores**)
3. Después de cada torneo: pestaña **Torneo** → seleccionar temporada, nombre del torneo, marcar participantes y posición final → los puntos se calculan solos
4. Al cerrar temporada: pestaña **Hall de la Fama** → elegir campeón + subir foto
