CREATE TABLE IF NOT EXISTS padron_tse (
  dpi VARCHAR(13) PRIMARY KEY,
  nombre_completo TEXT NOT NULL,
  genero VARCHAR(15)
);

-- Index para búsqueda rápida
CREATE INDEX IF NOT EXISTS idx_padron_tse_dpi ON padron_tse(dpi);

-- Habilitar RLS
ALTER TABLE padron_tse ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Acceso total para usuarios autenticados" 
ON padron_tse FOR ALL TO authenticated USING (true) WITH CHECK (true);
