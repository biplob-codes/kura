-- Remove unused watchlist support
DROP INDEX IF EXISTS idx_videos_in_watchlist;
ALTER TABLE videos DROP COLUMN IF EXISTS in_watchlist;