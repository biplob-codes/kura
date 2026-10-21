ALTER TABLE videos
    ADD COLUMN last_played_at TIMESTAMPTZ;

-- Speeds up "give me play history" queries.
CREATE INDEX idx_videos_last_played_at
    ON videos (last_played_at DESC NULLS LAST)
    WHERE last_played_at IS NOT NULL AND is_deleted = false;