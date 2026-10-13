CREATE TABLE models (
    id UUID PRIMARY KEY,
    name TEXT NOT NULL UNIQUE
);

CREATE TABLE video_models (
    video_id UUID NOT NULL REFERENCES videos(id) ON DELETE CASCADE,
    model_id UUID NOT NULL REFERENCES models(id) ON DELETE CASCADE,
    PRIMARY KEY (video_id, model_id)
);