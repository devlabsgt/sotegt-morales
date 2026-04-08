ALTER TABLE sis_configuracion 
ADD COLUMN IF NOT EXISTS objetivo_total INT8,
ADD COLUMN IF NOT EXISTS meta_por_lider INT8;
