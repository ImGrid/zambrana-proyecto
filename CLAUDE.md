# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Sistema de Tracking GPS para Agregados Zambrana** - GPS tracking and management system for a construction materials distribution company in Cochabamba, Bolivia. The system manages orders, inventory, fleet tracking, and route optimization using graph theory.

**Tech Stack:**
- Backend: Node.js + TypeScript + Fastify
- Frontend: React + TypeScript + Vite
- Mobile: Flutter + Dart + Riverpod
- Databases: PostgreSQL (transactional data) + Neo4j (route graphs)
- Validation: Zod with type inference
- Authentication: JWT + bcrypt

## Code Style Rules

**CRITICAL:** This project has strict code style rules. FOLLOW THEM ALWAYS:

### 1. NO EMOJIS (PROHIBIDO)
- NUNCA usar emojis en ninguna parte del codigo
- No emojis en: codigo, comentarios, console.log, mensajes de error, strings
- Esto aplica a TODO el proyecto (backend y frontend)

### 2. COMENTARIOS SIMPLES (OBLIGATORIO)
- SIEMPRE usar formato simple: `// comentario`
- NUNCA usar formato multi-linea tipo:
  ```
  /*
   * Este formato esta PROHIBIDO
   * No lo uses nunca
   */
  ```
- NUNCA usar formato `/** */` excepto para JSDoc de funciones exportadas
- Los comentarios deben ser cortos y directos
- Ejemplo correcto:
  ```typescript
  // Valida el stock antes de confirmar
  const stockDisponible = await validarStock(materialId);
  ```

### 3. JSDoc Solo para Exports
- Usar JSDoc SOLO en funciones exportadas publicas
- No usar JSDoc en funciones internas o privadas
- Mantenerlo minimo, sin decoraciones

### 4. Research First
- Cuando encuentres errores, usa MCP context7 para revisar documentacion antes de proponer soluciones

## Development Commands

```bash
# Backend development
cd backend
npm run dev              # Start dev server with hot reload (tsx watch)
npm run build            # Compile TypeScript to dist/
npm start                # Run compiled production server
npm run typecheck        # Type check without emitting files
npm run lint             # Run ESLint
npm run lint:fix         # Fix ESLint issues automatically
npm run format           # Format code with Prettier
npm run format:check     # Check code formatting

# Database setup
cd scripts
psql -U postgres -d zambrana_db -f 01_estructura_base.sql
psql -U postgres -d zambrana_db -f 02_estructura_pedidos_entregas.sql
psql -U postgres -d zambrana_db -f 03_optimizaciones.sql

# PostgreSQL connection (IMPORTANTE)
# La contraseña de PostgreSQL es: 12345 (NO 'admin')
# Cuando uses psql o scripts que se conecten a la base de datos, usa:
POSTGRES_PASSWORD=12345

# COMANDO GLOBAL PSQL (usar siempre este formato)
# Este comando tiene permiso global en .claude/settings.local.json
# Puedes ejecutar cualquier consulta SQL sin pedir confirmacion:
PGPASSWORD=12345 "C:\Program Files\PostgreSQL\17\bin\psql.exe" -U postgres -d zambrana_db -c "SELECT ..."

# Ejemplos:
PGPASSWORD=12345 "C:\Program Files\PostgreSQL\17\bin\psql.exe" -U postgres -d zambrana_db -c "SELECT * FROM usuarios;"
PGPASSWORD=12345 "C:\Program Files\PostgreSQL\17\bin\psql.exe" -U postgres -d zambrana_db -c "\dt"

# Neo4j setup (use Neo4j Browser)
# Open http://localhost:7474 and run neo4j-setup.cypher
```

## Mobile App Development (IMPORTANTE)

La app movil Flutter se desarrolla en una carpeta SEPARADA del repositorio:
- **Carpeta de desarrollo:** `C:\Users\LENOVO\Documents\zambrana_android`
- **Carpeta en el repo:** `mobile/`

**Flujo de trabajo:**
1. Trabajar siempre en `zambrana_android` (la original) - ya esta configurada en Android Studio
2. Cuando quieras subir cambios al repositorio, copiar los archivos modificados a `mobile/`
3. Hacer commit y push desde `agregados_zambrana_proyecto`

**Comandos para sincronizar (ejecutar desde agregados_zambrana_proyecto):**
```bash
# Copiar cambios de la app original al repo (antes de commit)
xcopy "C:\Users\LENOVO\Documents\zambrana_android\lib" "mobile\lib\" /E /Y
xcopy "C:\Users\LENOVO\Documents\zambrana_android\pubspec.yaml" "mobile\" /Y

# O copiar todo (si hay cambios en android/, ios/, etc.)
xcopy "C:\Users\LENOVO\Documents\zambrana_android" "mobile\" /E /I /H /Y /EXCLUDE:exclude.txt
```

**NO modificar directamente la carpeta `mobile/`** - siempre trabajar en `zambrana_android` y copiar.

## Architecture

### Module Structure (Feature-Based)

Each domain module in `backend/src/modules/` follows this pattern:

```
modules/
├── {module}/
│   ├── {module}.routes.ts      # Fastify routes
│   ├── {module}.service.ts     # Business logic
│   ├── {module}.repository.ts  # Database access
│   └── {module}.schemas.ts     # Zod validation schemas
```

**Implemented Modules:**
- `auth` - Authentication (login/logout)
- `usuarios` - User management
- `materiales` - Materials inventory
- `camiones` - Truck fleet management
- `conductores` - Driver management
- `clientes` - Customer management
- `pedidos` - Order management (debugged and fixed)
- `entregas` - Delivery tracking with GPS and hybrid DETENIDO detection

### Layered Architecture

**Routes → Service → Repository → Database**

- **Routes**: Define HTTP endpoints, validation with Zod schemas
- **Service**: Business logic, orchestrates repositories
- **Repository**: Direct database access, SQL queries, transactions
- **Database**: Two separate connections (PostgreSQL + Neo4j)

### Database Architecture

**PostgreSQL** - Primary transactional database:
- 29 tables total
- Partitioned `posiciones_gps` table by month (12 partitions)
- Stored procedures: `confirmar_pedido()`, `cancelar_pedido()`, `crear_entrega()`
- 4 materialized views for reports
- PostGIS extension for geospatial calculations

**Neo4j** - Graph database for route optimization:
- 13 nodes (plant, clients, intersections, zones)
- 12 relationships for shortest-path calculations
- Used for optimal route planning

### Key Database Patterns

**Transaction Safety in Pedidos Module:**
```typescript
// Always use client.query('BEGIN') and COMMIT/ROLLBACK
const client = await pool.connect();
try {
  await client.query('BEGIN');

  // Use SELECT FOR UPDATE to prevent concurrent modifications
  const lock = await client.query(
    'SELECT * FROM pedidos WHERE id = $1 FOR UPDATE',
    [id]
  );

  // Atomic stock decrement with validation
  const updateStock = await client.query(
    `UPDATE materiales
     SET stock_actual = stock_actual - $1
     WHERE id = $2 AND stock_actual >= $1
     RETURNING stock_actual`,
    [cantidad, materialId]
  );

  if (!updateStock.rowCount) {
    await client.query('ROLLBACK');
    throw new Error('Stock insuficiente');
  }

  await client.query('COMMIT');
} catch (error) {
  await client.query('ROLLBACK');
  throw error;
} finally {
  client.release();
}
```

**Important:** The `pedidos` module has been debugged and fixed for:
- Stock decrement on order creation (automatic with atomic UPDATE)
- Race condition prevention with atomic UPDATE WHERE condition
- Concurrency locks with SELECT FOR UPDATE in critical operations

## Environment Variables

Create `backend/.env` with:
```env
NODE_ENV=development
PORT=3000

# PostgreSQL
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_DB=zambrana_db
POSTGRES_USER=postgres
POSTGRES_PASSWORD=your_password

# Neo4j
NEO4J_URI=bolt://localhost:7687
NEO4J_USER=neo4j
NEO4J_PASSWORD=your_neo4j_password

# JWT
JWT_SECRET=your_jwt_secret_min_32_chars
JWT_EXPIRES_IN=7d
```

## Testing

**Test credentials** (see `credenciales.txt`):
- Admin: `admin@zambrana.com` / `Admin123!`
- Gerente: `gerente@zambrana.com` / `Gerente123!`

**Testing patterns:**
```bash
# Use curl for endpoint testing
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@zambrana.com","password":"Admin123!"}'

# Or use Node.js fetch for complex tests
node -e "fetch('http://localhost:3000/api/pedidos', {...})"
```

## Common Issues

### Race Conditions
The pedidos module previously had race conditions. Always use:
- `UPDATE ... WHERE condition AND stock_actual >= amount` for atomic operations
- `SELECT ... FOR UPDATE` in transactions for critical sections
- Proper transaction handling with BEGIN/COMMIT/ROLLBACK

### Stock Management
Stock is now automatically decremented when orders are created. Never manually update `materiales.stock_actual` - let the transaction in `pedidos.repository.ts` handle it.

### Database Connections
- PostgreSQL pool is in `src/database/postgres/pool.ts`
- Neo4j driver is in `src/database/neo4j/driver.ts`
- Always release connections after use
- Use pooled connections for PostgreSQL, singleton for Neo4j

## API Documentation

When server is running:
- Swagger UI: `http://localhost:3000/docs`
- Health check: `http://localhost:3000/api/health`
- Detailed health: `http://localhost:3000/api/health/detailed`

## Important Files

- `conversacion/ARQUITECTURA_BACKEND.md` - Complete architecture documentation
- `conversacion/ARQUITECTURA_BASE_DATOS.md` - Database architecture details
- `conversacion/FASES_DESARROLLO_BACKEND.md` - Development phases plan
- `conversacion/PLANIFICACION_GENERAL.md` - General project planning
- `scripts/README.md` - Database setup instructions

## Project Status

**Current Phase:** Phase 4 - Mobile app and delivery tracking
**Next Phase:** Expert system for resource assignment

**Completed:**
- Authentication system
- User management (usuarios, clientes, conductores)
- Materials inventory management
- Fleet management (camiones)
- Order system (pedidos) - debugged and production-ready
- Delivery tracking (entregas) - with GPS tracking and hybrid DETENIDO detection
- Mobile app for drivers (Flutter) - login, pedidos, mapa, tracking GPS

**Pending:**
- Expert system for resource assignment
- Neo4j route validation
- Push notifications for drivers
- Offline mode for mobile app
