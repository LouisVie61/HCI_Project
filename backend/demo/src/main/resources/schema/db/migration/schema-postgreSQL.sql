-- Realtime Sign Language Translation System

-- ENUM TYPES
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'session_mode') THEN
        CREATE TYPE session_mode AS ENUM ('sign_to_text', 'text_to_sign');
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'input_type') THEN
        CREATE TYPE input_type AS ENUM ('text', 'audio', 'video');
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'chunk_status') THEN
        CREATE TYPE chunk_status AS ENUM ('uploaded', 'processing', 'done', 'failed');
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'render_status') THEN
        CREATE TYPE render_status AS ENUM ('queued', 'processing', 'done', 'failed');
    END IF;
END $$;
  
-- USERS  
CREATE TABLE users (
    user_id        BIGSERIAL PRIMARY KEY,
    username       VARCHAR(50)  NOT NULL UNIQUE,
    email          VARCHAR(100) NOT NULL UNIQUE,
    password_hash  TEXT         NOT NULL,
    created_at     TIMESTAMPTZ  NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- SESSIONS
CREATE TABLE sessions (
    session_id   BIGSERIAL PRIMARY KEY,
    user_id      BIGINT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    mode         session_mode NOT NULL,
    title        VARCHAR(255),
    source_lang  VARCHAR(20) NOT NULL DEFAULT 'vi',
    target_lang  VARCHAR(20) NOT NULL DEFAULT 'vi',
    started_at   TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    ended_at     TIMESTAMPTZ,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CHECK (ended_at IS NULL OR ended_at >= started_at)
);

-- USER VOCABULARY
CREATE TABLE user_vocabulary (
    vocab_id         BIGSERIAL PRIMARY KEY,
    user_id          BIGINT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    term             VARCHAR(100) NOT NULL,
    normalized_term  VARCHAR(100),
    phonetic_hint    TEXT,
    category         VARCHAR(50),
    created_at       TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (user_id, term)
);

-- SESSION INPUTS
CREATE TABLE session_inputs (
    input_id            BIGSERIAL PRIMARY KEY,
    session_id          BIGINT NOT NULL REFERENCES sessions(session_id) ON DELETE CASCADE,
    input_type          input_type NOT NULL,
    text_content        TEXT,
    media_url           TEXT, -- object storage
    media_duration_sec  DOUBLE PRECISION,
    mime_type           VARCHAR(100),
    created_at          TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CHECK (media_duration_sec IS NULL OR media_duration_sec >= 0),
    CHECK (
        (input_type = 'text' AND text_content IS NOT NULL AND media_url IS NULL)
        OR
        (input_type IN ('audio','video') AND media_url IS NOT NULL)
    )
);

-- STREAM CHUNKS
CREATE TABLE stream_chunks (
    chunk_id          BIGSERIAL PRIMARY KEY,
    session_id        BIGINT NOT NULL REFERENCES sessions(session_id) ON DELETE CASCADE,
    input_id          BIGINT REFERENCES session_inputs(input_id) ON DELETE SET NULL,
    chunk_index       INT NOT NULL,
    chunk_url         TEXT, -- object storage
    start_offset_sec  DOUBLE PRECISION,
    end_offset_sec    DOUBLE PRECISION,
    status            chunk_status NOT NULL DEFAULT 'uploaded',

    -- Mongo reference
    feature_doc_id    TEXT,

    created_at        TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    UNIQUE (session_id, chunk_index),

    CHECK (chunk_index >= 0),
    CHECK (start_offset_sec IS NULL OR start_offset_sec >= 0),
    CHECK (end_offset_sec IS NULL OR end_offset_sec >= 0),
    CHECK (
        end_offset_sec IS NULL OR start_offset_sec IS NULL
        OR end_offset_sec >= start_offset_sec
    )
);

-- TRANSCRIPTS
   
CREATE TABLE transcripts (
    transcript_id       BIGSERIAL PRIMARY KEY,
    session_id          BIGINT NOT NULL REFERENCES sessions(session_id) ON DELETE CASCADE,
    chunk_id            BIGINT REFERENCES stream_chunks(chunk_id) ON DELETE SET NULL,

    original_text       TEXT NOT NULL,
    translated_text     TEXT,

    speaker_label       VARCHAR(50),
    confidence_score    NUMERIC(4,3),

    start_offset_sec    DOUBLE PRECISION,
    end_offset_sec      DOUBLE PRECISION,

    created_at          TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CHECK (confidence_score IS NULL OR (confidence_score >= 0 AND confidence_score <= 1))
);

-- GESTURE ASSETS (HYBRID CORE)
CREATE TABLE gesture_assets (
    gesture_id        BIGSERIAL PRIMARY KEY,

    gloss             VARCHAR(100) NOT NULL,
    language_code     VARCHAR(20)  NOT NULL DEFAULT 'vi',

    media_type        VARCHAR(20)  NOT NULL DEFAULT 'video',
    asset_url         TEXT         NOT NULL, -- object storage

    duration_sec      DOUBLE PRECISION,
    fps               INT,

    -- lightweight metadata
    metadata          JSONB,

    -- Mongo reference (heavy payload)
    external_meta_id  TEXT,

    -- tracking storage strategy
    meta_backend      VARCHAR(20) NOT NULL DEFAULT 'hybrid',

    version           INT NOT NULL DEFAULT 1,
    is_active         BOOLEAN NOT NULL DEFAULT TRUE,

    created_at        TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CHECK (duration_sec IS NULL OR duration_sec >= 0),
    CHECK (fps IS NULL OR fps > 0),
    CHECK (meta_backend IN ('postgres','mongo','hybrid')),

    UNIQUE (gloss, language_code, version)
);

-- GESTURE MAPPINGS
CREATE TABLE gesture_mappings (
    mapping_id     BIGSERIAL PRIMARY KEY,

    keyword        VARCHAR(120) NOT NULL,
    language_code  VARCHAR(20) NOT NULL DEFAULT 'vi',

    gesture_id     BIGINT NOT NULL REFERENCES gesture_assets(gesture_id) ON DELETE CASCADE,

    priority       INT NOT NULL DEFAULT 100,
    weight         NUMERIC(5,4) NOT NULL DEFAULT 1.0,

    created_at     TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CHECK (priority >= 0),
    CHECK (weight > 0),

    UNIQUE (keyword, language_code, gesture_id)
);

-- RENDER JOBS
CREATE TABLE sign_render_jobs (
    job_id        BIGSERIAL PRIMARY KEY,

    session_id    BIGINT NOT NULL REFERENCES sessions(session_id) ON DELETE CASCADE,
    input_id      BIGINT REFERENCES session_inputs(input_id) ON DELETE SET NULL,

    source_text   TEXT NOT NULL,

    status        render_status NOT NULL DEFAULT 'queued',

    output_type   VARCHAR(20) NOT NULL DEFAULT 'video',
    output_url    TEXT, -- object storage

    -- Mongo debug / pipeline trace
    pipeline_doc_id TEXT,

    error_message TEXT,

    created_at    TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at    TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- RENDER SEGMENTS
CREATE TABLE sign_render_segments (
    segment_id        BIGSERIAL PRIMARY KEY,
    job_id            BIGINT NOT NULL REFERENCES sign_render_jobs(job_id) ON DELETE CASCADE,

    seq_no            INT NOT NULL,

    keyword           VARCHAR(120),
    gesture_id        BIGINT REFERENCES gesture_assets(gesture_id) ON DELETE SET NULL,

    start_offset_sec  DOUBLE PRECISION,
    end_offset_sec    DOUBLE PRECISION,

    speed_factor      DOUBLE PRECISION NOT NULL DEFAULT 1.0,
    transition_type   VARCHAR(50),

    created_at        TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    UNIQUE (job_id, seq_no),

    CHECK (seq_no >= 0),
    CHECK (speed_factor > 0)
);

-- UPDATED_AT TRIGGER
CREATE OR REPLACE FUNCTION trg_set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tr_sign_render_jobs_updated_at
BEFORE UPDATE ON sign_render_jobs
FOR EACH ROW
EXECUTE FUNCTION trg_set_updated_at();

-- INDEXES
CREATE INDEX idx_sessions_user ON sessions(user_id);
CREATE INDEX idx_inputs_session ON session_inputs(session_id);
CREATE INDEX idx_chunks_session ON stream_chunks(session_id);
CREATE INDEX idx_transcripts_session ON transcripts(session_id);

CREATE INDEX idx_gesture_gloss_lang ON gesture_assets(gloss, language_code);
CREATE INDEX idx_gesture_external_meta ON gesture_assets(external_meta_id);

CREATE INDEX idx_mapping_keyword ON gesture_mappings(keyword, language_code);

CREATE INDEX idx_render_jobs_session ON sign_render_jobs(session_id, status);
CREATE INDEX idx_render_segments_job ON sign_render_segments(job_id);