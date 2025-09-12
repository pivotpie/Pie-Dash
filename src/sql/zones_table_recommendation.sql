-- Recommended zones table structure
-- Option 1: Use zone_id as primary key (if zone_id is meant to be unique business identifier)
CREATE TABLE public.zones (
  zone_id text NOT NULL,
  zone_name text NOT NULL, -- Made NOT NULL for data integrity
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT zones_pkey PRIMARY KEY (zone_id)
);

-- Option 2: Use UUID as primary key (if you need internal UUID for relationships)
CREATE TABLE public.zones_alternative (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  zone_id text NOT NULL UNIQUE, -- Ensure zone_id is unique
  zone_name text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT zones_alt_pkey PRIMARY KEY (id)
);

-- Indexes for performance
CREATE INDEX idx_zones_zone_name ON public.zones (zone_name);

-- RLS (Row Level Security) policy example
ALTER TABLE public.zones ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable read access for all users" ON public.zones
FOR SELECT USING (true);