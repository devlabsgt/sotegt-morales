CREATE TABLE IF NOT EXISTS sis_politicas (
  id SERIAL PRIMARY KEY,
  nombre TEXT NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS sis_politicas_sub (
  id SERIAL PRIMARY KEY,
  politica_id INTEGER NOT NULL REFERENCES sis_politicas(id) ON DELETE CASCADE,
  nombre TEXT NOT NULL,
  UNIQUE(politica_id, nombre)
);

ALTER TABLE afiliados
  ADD COLUMN IF NOT EXISTS politica_id INTEGER REFERENCES sis_politicas(id),
  ADD COLUMN IF NOT EXISTS sub_politica_id INTEGER REFERENCES sis_politicas_sub(id);

INSERT INTO sis_politicas (nombre) VALUES
  ('Trabajo'),
  ('Alimento'),
  ('Educación'),
  ('Beneficio al Campo'),
  ('Mujer'),
  ('Salud'),
  ('Adulto Mayor'),
  ('Vivienda'),
  ('Discapacidad'),
  ('Cero Lodo')
ON CONFLICT (nombre) DO NOTHING;

INSERT INTO sis_politicas_sub (politica_id, nombre)
SELECT p.id, s.nombre FROM sis_politicas p
JOIN (VALUES
  ('Trabajo', 'Bolsa de Empleo'),
  ('Trabajo', 'H Visa de Trabajo - Canadá Hombres'),
  ('Trabajo', 'M Visa de Trabajo - USA Hombres'),
  ('Trabajo', 'Call Center'),
  ('Alimento', 'Madre Soltera'),
  ('Alimento', 'Adulto Mayor'),
  ('Alimento', 'Seguridad Alimentaria'),
  ('Educación', 'Becas Computación'),
  ('Educación', 'Becas Inglés'),
  ('Educación', 'Becas Básico'),
  ('Educación', 'Becas Diversificado'),
  ('Educación', 'Becas Mujeres'),
  ('Beneficio al Campo', 'Abono'),
  ('Beneficio al Campo', 'Asesoría Técnica'),
  ('Beneficio al Campo', 'Inmunización Ganado'),
  ('Beneficio al Campo', 'Profilaxis Aves / Vacunación Aves'),
  ('Mujer', 'Seguro Cáncer'),
  ('Mujer', 'Capacitación Trabajo'),
  ('Salud', 'Seguro Salud Mpal.'),
  ('Salud', 'Telemedicina Dr. Morales'),
  ('Adulto Mayor', 'Programa Adulto Mayor'),
  ('Adulto Mayor', 'Consejero Comunitario'),
  ('Vivienda', 'Vivienda Popular'),
  ('Vivienda', 'Cocina Ahorradora'),
  ('Discapacidad', 'Apoyo Económico'),
  ('Discapacidad', 'Ayudas Técnicas'),
  ('Cero Lodo', 'Encementado Camino Vecinal')
) AS s(politica_nombre, nombre) ON p.nombre = s.politica_nombre
ON CONFLICT (politica_id, nombre) DO NOTHING;
