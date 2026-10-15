use axum::{
    extract::{Query, Request},
    response::IntoResponse,
    routing::get,
    Router,
};
use std::collections::HashMap;
use tower::ServiceExt;
use tower_http::cors::{Any, CorsLayer};
use tower_http::services::ServeFile;

async fn health() -> &'static str {
    "Server is healthy"
}

/// Serves any local file by absolute path (videos + thumbnails).
async fn serve_file(Query(params): Query<HashMap<String, String>>, req: Request) -> impl IntoResponse {
    let path = match params.get("path") {
        Some(p) => p.clone(),
        None => return axum::http::StatusCode::BAD_REQUEST.into_response(),
    };

    let service = ServeFile::new(path);
    match service.oneshot(req).await {
        Ok(res) => res.into_response(),
        Err(_) => axum::http::StatusCode::INTERNAL_SERVER_ERROR.into_response(),
    }
}

#[tokio::main]
pub async fn main() {
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