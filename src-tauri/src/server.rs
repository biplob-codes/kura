use axum::{
    body::Body,
    extract::Query,
    http::{
        header::{ACCEPT_RANGES, CONTENT_LENGTH, CONTENT_RANGE, CONTENT_TYPE, RANGE},
        HeaderMap, StatusCode,
    },
    response::{IntoResponse, Response},
    routing::get,
    Router,
};
use std::{collections::HashMap, io::SeekFrom, path::PathBuf};
use tokio::fs::File;
use tokio::io::{AsyncReadExt, AsyncSeekExt};
use tokio_util::io::ReaderStream;
use tower_http::cors::{Any, CorsLayer};

async fn health() -> &'static str {
    "Server is healthy"
}

/// Parse a single byte range.
/// Supports: "bytes=0-499", "bytes=500-", "bytes=-500"
fn parse_range(range_header: &str, file_size: u64) -> Option<(u64, u64)> {
    let range = range_header.strip_prefix("bytes=")?;
    let range = range.split(',').next()?.trim();

    if let Some((start_str, end_str)) = range.split_once('-') {
        if start_str.is_empty() {
            let suffix_len: u64 = end_str.parse().ok()?;
            if suffix_len == 0 {
                return None;
            }
            let start = file_size.saturating_sub(suffix_len);
            return Some((start, file_size.saturating_sub(1)));
        }

        let start: u64 = start_str.parse().ok()?;
        if start >= file_size {
            return None;
        }

        let end = if end_str.is_empty() {
            file_size.saturating_sub(1)
        } else {
            end_str
                .parse::<u64>()
                .ok()?
                .min(file_size.saturating_sub(1))
        };

        if start > end {
            return None;
        }
        return Some((start, end));
    }
    None
}

fn guess_content_type(path: &str) -> &'static str {
    let ext = PathBuf::from(path)
        .extension()
        .and_then(|e| e.to_str())
        .map(|e| e.to_ascii_lowercase())
        .unwrap_or_default();

    match ext.as_str() {
        "mp4" | "m4v" => "video/mp4",
        "webm" => "video/webm",
        "mkv" => "video/x-matroska",
        "mov" => "video/quicktime",
        "avi" => "video/x-msvideo",
        "jpg" | "jpeg" => "image/jpeg",
        "png" => "image/png",
        "webp" => "image/webp",
        "gif" => "image/gif",
        _ => "application/octet-stream",
    }
}

/// Serves local files with full HTTP Range support and true streaming
/// (never loads the whole range into memory).
async fn serve_file(Query(params): Query<HashMap<String, String>>, headers: HeaderMap) -> Response {
    let path = match params.get("path") {
        Some(p) if !p.is_empty() => p.clone(),
        _ => {
            return (StatusCode::BAD_REQUEST, "Missing path query parameter").into_response();
        }
    };

    let path_buf = PathBuf::from(&path);
    if !path_buf.is_absolute() {
        return (StatusCode::BAD_REQUEST, "Path must be absolute").into_response();
    }

    let mut file = match File::open(&path).await {
        Ok(f) => f,
        Err(_) => return StatusCode::NOT_FOUND.into_response(),
    };

    let metadata = match file.metadata().await {
        Ok(m) => m,
        Err(_) => return StatusCode::INTERNAL_SERVER_ERROR.into_response(),
    };
    let file_size = metadata.len();

    if file_size == 0 {
        return StatusCode::NOT_FOUND.into_response();
    }

    let content_type = guess_content_type(&path);

    // ---------- Range request ----------
    if let Some(range_val) = headers.get(RANGE).and_then(|v| v.to_str().ok()) {
        match parse_range(range_val, file_size) {
            Some((start, end)) => {
                let content_length = end - start + 1;

                if file.seek(SeekFrom::Start(start)).await.is_err() {
                    return StatusCode::INTERNAL_SERVER_ERROR.into_response();
                }

                let limited = file.take(content_length);
                let stream = ReaderStream::new(limited);
                let body = Body::from_stream(stream);

                return Response::builder()
                    .status(StatusCode::PARTIAL_CONTENT)
                    .header(CONTENT_TYPE, content_type)
                    .header(ACCEPT_RANGES, "bytes")
                    .header(CONTENT_LENGTH, content_length)
                    .header(
                        CONTENT_RANGE,
                        format!("bytes {}-{}/{}", start, end, file_size),
                    )
                    .header("Cache-Control", "public, max-age=3600")
                    .body(body)
                    .unwrap_or_else(|_| StatusCode::INTERNAL_SERVER_ERROR.into_response());
            }
            None => {
                return Response::builder()
                    .status(StatusCode::RANGE_NOT_SATISFIABLE)
                    .header(CONTENT_RANGE, format!("bytes */{}", file_size))
                    .body(Body::empty())
                    .unwrap_or_else(|_| StatusCode::INTERNAL_SERVER_ERROR.into_response());
            }
        }
    }

    // ---------- Full file (no Range header) ----------
    let stream = ReaderStream::new(file);
    let body = Body::from_stream(stream);

    Response::builder()
        .status(StatusCode::OK)
        .header(CONTENT_TYPE, content_type)
        .header(ACCEPT_RANGES, "bytes")
        .header(CONTENT_LENGTH, file_size)
        .header("Cache-Control", "public, max-age=3600")
        .body(body)
        .unwrap_or_else(|_| StatusCode::INTERNAL_SERVER_ERROR.into_response())
}

/// Start the local media server. Call this from Tauri's async runtime.
pub async fn start() {
    let app = Router::new()
        .route("/health", get(health))
        .route("/video", get(serve_file))
        .route("/thumbnail", get(serve_file))
        .layer(CorsLayer::new().allow_origin(Any));

    let listener = tokio::net::TcpListener::bind("127.0.0.1:8000")
        .await
        .expect("Failed to bind to 127.0.0.1:8000");

    println!("Listening on http://127.0.0.1:8000");
    axum::serve(listener, app).await.unwrap();
}