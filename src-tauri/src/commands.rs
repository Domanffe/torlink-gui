#[tauri::command]
pub fn open_folder(path: String) -> Result<(), String> {
    crate::fs::open_folder(&path).map_err(|e| e.to_string())
}
