-- BIM analysis results storage
CREATE TABLE IF NOT EXISTS bim_analyses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    thread_id UUID,
    analysis_type TEXT NOT NULL CHECK (analysis_type IN ('carbon', 'clash', 'compliance', 'mep', 'structural', 'knowledge')),
    file_path TEXT NOT NULL,
    results JSONB NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_bim_analyses_thread ON bim_analyses(thread_id);

-- IFC file metadata
CREATE TABLE IF NOT EXISTS bim_models (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    account_id UUID,
    name TEXT NOT NULL,
    file_path TEXT NOT NULL,
    file_size_bytes BIGINT,
    element_count INTEGER,
    metadata JSONB,
    uploaded_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_bim_models_account ON bim_models(account_id);

-- RLS policies
ALTER TABLE bim_analyses ENABLE ROW LEVEL SECURITY;
ALTER TABLE bim_models ENABLE ROW LEVEL SECURITY;
