ALTER TABLE videos
    ADD COLUMN watched_at   TIMESTAMPTZ,
    ADD COLUMN is_deleted   BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN deleted_at   TIMESTAMPTZ,
    ADD COLUMN in_watchlist BOOLEAN NOT NULL DEFAULT false;

-- Most reads will filter out soft-deleted videos, so index the common
-- case (is_deleted = false) rather than the full column.
CREATE INDEX idx_videos_not_deleted ON videos (id) WHERE is_deleted = false;

-- Speeds up "give me the watchlist" queries without bloating the index
-- with every row where in_watchlist is false.
CREATE INDEX idx_videos_in_watchlist ON videos (id) WHERE in_watchlist = true;