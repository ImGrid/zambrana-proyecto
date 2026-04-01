-- Migracion: Hallazgos 4 y 5
-- Fecha: 2026-02-06
-- Hallazgo 5: Reemplazar CHECK constraint con trigger en conductores
-- Hallazgo 4: Agregar tipo de movimiento DEVOLUCION para cancelacion de pedidos confirmados

-- =====================================================
-- HALLAZGO 5: CHECK constraint con CURRENT_DATE
-- =====================================================

-- Paso 1: Eliminar el CHECK constraint problematico
ALTER TABLE conductores DROP CONSTRAINT IF EXISTS chk_fecha_licencia;

-- Paso 2: Crear funcion de trigger para validar licencia
CREATE OR REPLACE FUNCTION validar_licencia_conductor()
RETURNS TRIGGER AS $$
BEGIN
  -- En INSERT: la fecha de vencimiento debe ser futura
  IF TG_OP = 'INSERT' THEN
    IF NEW.fecha_vencimiento_licencia IS NOT NULL
       AND NEW.fecha_vencimiento_licencia <= CURRENT_DATE THEN
      RAISE EXCEPTION 'La fecha de vencimiento de licencia debe ser posterior a la fecha actual al registrar un conductor';
    END IF;
  END IF;

  -- En UPDATE: solo validar si fecha_vencimiento_licencia cambio
  IF TG_OP = 'UPDATE' THEN
    IF NEW.fecha_vencimiento_licencia IS DISTINCT FROM OLD.fecha_vencimiento_licencia THEN
      IF NEW.fecha_vencimiento_licencia IS NOT NULL
         AND NEW.fecha_vencimiento_licencia <= CURRENT_DATE THEN
        RAISE EXCEPTION 'La nueva fecha de vencimiento de licencia debe ser posterior a la fecha actual';
      END IF;
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Paso 3: Crear el trigger
DROP TRIGGER IF EXISTS trg_validar_licencia ON conductores;
CREATE TRIGGER trg_validar_licencia
  BEFORE INSERT OR UPDATE ON conductores
  FOR EACH ROW
  EXECUTE FUNCTION validar_licencia_conductor();

-- =====================================================
-- HALLAZGO 4: Tipo de movimiento DEVOLUCION
-- =====================================================

-- Agregar tipo DEVOLUCION si no existe
INSERT INTO tipo_movimiento (id, nombre)
VALUES (4, 'DEVOLUCION')
ON CONFLICT (id) DO NOTHING;
