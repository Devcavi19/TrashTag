CREATE TABLE collector_presence (
  collector_id UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  lat DOUBLE PRECISION,
  lng DOUBLE PRECISION,
  online BOOLEAN NOT NULL DEFAULT false,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE collector_presence ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Collectors can insert/update their own presence"
  ON collector_presence
  FOR ALL
  TO authenticated
  USING (auth.uid() = collector_id)
  WITH CHECK (auth.uid() = collector_id);

CREATE POLICY "Authenticated users can select presence"
  ON collector_presence
  FOR SELECT
  TO authenticated
  USING (true);

-- Add to realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE collector_presence;
