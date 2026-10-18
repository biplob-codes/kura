use crate::config::{read_config, write_config};
use argon2::{
    password_hash::{PasswordHash, PasswordHasher, PasswordVerifier, SaltString},
    Argon2,
};
use rand::rngs::OsRng;
use tauri::AppHandle;

fn hash_password(password: &str) -> Result<String, String> {
    let salt = SaltString::generate(&mut OsRng);
    let argon2 = Argon2::default();
    argon2
        .hash_password(password.as_bytes(), &salt)
        .map(|h| h.to_string())
        .map_err(|e| format!("Couldn't hash password: {e}"))
}

fn verify_hash(password: &str, hash: &str) -> Result<bool, String> {
    let parsed = PasswordHash::new(hash)
        .map_err(|e| format!("Invalid stored password hash: {e}"))?;
    Ok(Argon2::default()
        .verify_password(password.as_bytes(), &parsed)
        .is_ok())
}

/// Whether a password is currently set (protection enabled).
#[tauri::command]
pub fn is_password_enabled(app: AppHandle) -> bool {
    let config = read_config(&app);
    !config.password_hash.is_empty()
}

/// Set or change the app password. Requires `current` when one already exists.
#[tauri::command]
pub fn set_app_password(
    app: AppHandle,
    current: Option<String>,
    new_password: String,
) -> Result<(), String> {
    let new_password = new_password.trim();
    if new_password.len() < 4 {
        return Err("Password must be at least 4 characters.".into());
    }

    let mut config = read_config(&app);

    if !config.password_hash.is_empty() {
        let current = current.unwrap_or_default();
        if !verify_hash(&current, &config.password_hash)? {
            return Err("Current password is incorrect.".into());
        }
    }

    config.password_hash = hash_password(new_password)?;
    write_config(&app, &config);
    Ok(())
}

/// Turn password protection off. Requires the current password.
#[tauri::command]
pub fn clear_app_password(app: AppHandle, current: String) -> Result<(), String> {
    let mut config = read_config(&app);

    if config.password_hash.is_empty() {
        return Ok(());
    }

    if !verify_hash(&current, &config.password_hash)? {
        return Err("Current password is incorrect.".into());
    }

    config.password_hash = String::new();
    write_config(&app, &config);
    Ok(())
}

/// Check a password for unlock. Does not change config.
#[tauri::command]
pub fn verify_app_password(app: AppHandle, password: String) -> Result<bool, String> {
    let config = read_config(&app);
    if config.password_hash.is_empty() {
        return Ok(true);
    }
    verify_hash(&password, &config.password_hash)
}