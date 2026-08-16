CREATE TABLE videos (
    id UUID PRIMARY KEY,
    folder_id UUID NOT NULL REFERENCES folders(id),
    title TEXT NOT NULL,
    file_path TEXT NOT NULL UNIQUE,
    thumbnail_path TEXT,
    duration_seconds REAL,
    width INTEGER,
    height INTEGER,
    watched BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);