use sqlx::postgres::PgPool;

/// Holds the optional shared Postgres pool. `None` when the user hasn't
/// enabled the database yet (or a connection attempt failed) — every
/// command that needs the DB goes through `get_pool()` and gets a clear
/// error back instead of a panic when it isn't there.
pub struct DbState(pub std::sync::Mutex<Option<PgPool>>);

impl DbState {
    pub fn get_pool(&self) -> Result<PgPool, String> {
        self.0
            .lock()
            .unwrap()
            .clone()
            .ok_or_else(|| "Database is not connected. Enable it in Settings first.".to_string())
    }
}
