-- Schema para Sistema de Tracking GPS - Agregados Zambrana
-- Base de datos: PostgreSQL 16

-- Tabla de usuarios del sistema
CREATE TABLE IF NOT EXISTS usuarios (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  rol VARCHAR(50) NOT NULL CHECK (rol IN ('admin', 'gerente', 'conductor', 'cliente')),
  nombre VARCHAR(255) NOT NULL,
  activo BOOLEAN DEFAULT TRUE NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Indice para busquedas rapidas por email
CREATE INDEX IF NOT EXISTS idx_usuarios_email ON usuarios(email);

-- Indice para busquedas por rol
CREATE INDEX IF NOT EXISTS idx_usuarios_rol ON usuarios(rol);

-- Trigger para actualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_usuarios_updated_at BEFORE UPDATE
  ON usuarios FOR EACH ROW
  EXECUTE PROCEDURE update_updated_at_column();
