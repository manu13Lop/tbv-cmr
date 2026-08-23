-- ============================================
-- Seed: Permisos y asignación a roles por defecto
-- Fecha: 2026-08-04
-- ============================================

-- Insertar permisos base del sistema
INSERT INTO permisos (nombre, descripcion) VALUES
  -- Usuarios
  ('usuarios.gestionar', 'Gestionar usuarios: crear, editar, eliminar, cambiar roles'),
  -- Auditoria
  ('auditoria.leer', 'Ver registro de auditoría'),
  -- Equipos
  ('equipos.leer', 'Ver equipos y jugadoras'),
  ('equipos.editar', 'Crear, editar, eliminar equipos'),
  -- Convocatorias / Eventos
  ('convocatorias.leer', 'Ver convocatorias y eventos'),
  ('convocatorias.editar', 'Crear, editar, eliminar convocatorias'),
  -- Jugadoras
  ('jugadoras.leer', 'Ver jugadoras'),
  ('jugadoras.editar', 'Crear, editar, eliminar jugadoras'),
  -- Sanitario
  ('sanitario.leer', 'Ver módulo sanitario (lesiones, reconocimientos, psicología)'),
  ('sanitario.editar', 'Gestionar lesiones, reconocimientos, sesiones de psicología'),
  -- Scouting
  ('scouting.leer', 'Ver módulo scouting (fichas, informes, rivales)'),
  ('scouting.editar', 'Crear, editar, eliminar fichas e informes de scouting'),
  -- Logística
  ('logistica.leer', 'Ver módulo logística (artículos, stock, movimientos)'),
  ('logistica.editar', 'Gestionar artículos y catálogo'),
  ('logistica.movimientos', 'Registrar entradas/salidas de stock'),
  -- Mensajes
  ('mensajes.leer', 'Ver mensajes'),
  ('mensajes.enviar', 'Enviar mensajes a equipos'),
  -- Formación
  ('formacion.leer', 'Ver cursos y formación'),
  ('formacion.editar', 'Crear, editar, eliminar cursos y quizzes'),
  -- Entrenadores
  ('entrenadores.leer', 'Ver entrenadores y ejercicios'),
  ('entrenadores.editar', 'Gestionar entrenadores, ejercicios, sesiones')
ON CONFLICT (nombre) DO NOTHING;

-- Asignar permisos al rol 'directiva' (todos los permisos excepto usuarios.gestionar)
DO $$
DECLARE
  v_directiva_id UUID := '140e02da-1ff4-4d41-b419-552587262bac';
  v_permiso_id UUID;
BEGIN
  FOR v_permiso_id IN
    SELECT id FROM permisos WHERE nombre != 'usuarios.gestionar'
  LOOP
    INSERT INTO rol_permiso (rol_id, permiso_id)
    VALUES (v_directiva_id, v_permiso_id)
    ON CONFLICT (rol_id, permiso_id) DO NOTHING;
  END LOOP;
END $$;

-- Asignar permisos al rol 'director_tecnico' (gestión deportiva completa)
DO $$
DECLARE
  v_dt_id UUID := '5c1b0361-228d-4ef2-9a26-17ef77e88d58';
  v_permiso_id UUID;
BEGIN
  FOR v_permiso_id IN
    SELECT id FROM permisos WHERE nombre IN (
      'equipos.leer', 'equipos.editar',
      'convocatorias.leer', 'convocatorias.editar',
      'jugadoras.leer', 'jugadoras.editar',
      'sanitario.leer', 'sanitario.editar',
      'scouting.leer', 'scouting.editar',
      'entrenadores.leer', 'entrenadores.editar',
      'formacion.leer', 'formacion.editar',
      'mensajes.leer', 'mensajes.enviar'
    )
  LOOP
    INSERT INTO rol_permiso (rol_id, permiso_id)
    VALUES (v_dt_id, v_permiso_id)
    ON CONFLICT (rol_id, permiso_id) DO NOTHING;
  END LOOP;
END $$;

-- Asignar permisos al rol 'entrenador' (equipos, convocatorias, jugadoras, scouting lectura, formación lectura)
DO $$
DECLARE
  v_ent_id UUID := 'c0e7dca0-79ca-410b-8979-622a7e160407';
  v_permiso_id UUID;
BEGIN
  FOR v_permiso_id IN
    SELECT id FROM permisos WHERE nombre IN (
      'equipos.leer',
      'convocatorias.leer', 'convocatorias.editar',
      'jugadoras.leer',
      'scouting.leer',
      'formacion.leer',
      'mensajes.leer', 'mensajes.enviar',
      'entrenadores.leer', 'entrenadores.editar'
    )
  LOOP
    INSERT INTO rol_permiso (rol_id, permiso_id)
    VALUES (v_ent_id, v_permiso_id)
    ON CONFLICT (rol_id, permiso_id) DO NOTHING;
  END LOOP;
END $$;

-- Asignar permisos al rol 'auxiliar' (lectura básica)
DO $$
DECLARE
  v_aux_id UUID := 'd711e285-4948-4d4f-8dc9-d5dc9872a253';
  v_permiso_id UUID;
BEGIN
  FOR v_permiso_id IN
    SELECT id FROM permisos WHERE nombre IN (
      'equipos.leer',
      'convocatorias.leer',
      'jugadoras.leer',
      'formacion.leer',
      'mensajes.leer'
    )
  LOOP
    INSERT INTO rol_permiso (rol_id, permiso_id)
    VALUES (v_aux_id, v_permiso_id)
    ON CONFLICT (rol_id, permiso_id) DO NOTHING;
  END LOOP;
END $$;

-- Asignar permisos al rol 'sanitario' (módulo sanitario completo)
DO $$
DECLARE
  v_san_id UUID := '038300fd-a3cd-4b61-8ac7-fd12743a5982';
  v_permiso_id UUID;
BEGIN
  FOR v_permiso_id IN
    SELECT id FROM permisos WHERE nombre IN (
      'jugadoras.leer',
      'sanitario.leer', 'sanitario.editar',
      'formacion.leer',
      'mensajes.leer'
    )
  LOOP
    INSERT INTO rol_permiso (rol_id, permiso_id)
    VALUES (v_san_id, v_permiso_id)
    ON CONFLICT (rol_id, permiso_id) DO NOTHING;
  END LOOP;
END $$;

-- Master no necesita permisos en rol_permiso (getUsuarioActual le da todos)
-- Los usuarios con es_master=true obtienen todos los permisos automáticamente