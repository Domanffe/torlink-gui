use std::path::{Component, Path, PathBuf};

/// Reject paths containing `..` before filesystem access.
pub fn reject_parent_components(path: &str) -> Result<(), String> {
    if Path::new(path)
        .components()
        .any(|c| matches!(c, Component::ParentDir))
    {
        return Err("path traversal is not allowed".into());
    }
    Ok(())
}

/// Canonicalize an existing directory path.
pub fn canonical_directory(path: &str) -> Result<PathBuf, String> {
    reject_parent_components(path)?;
    let p = Path::new(path);
    if !p.exists() {
        return Err("path does not exist".into());
    }
    let canon = p.canonicalize().map_err(|e| e.to_string())?;
    if !canon.is_dir() {
        return Err("path is not a directory".into());
    }
    Ok(canon)
}

fn canonical_root(root: &str) -> Result<PathBuf, String> {
    reject_parent_components(root)?;
    let p = Path::new(root);
    if p.exists() {
        let canon = p.canonicalize().map_err(|e| e.to_string())?;
        if !canon.is_dir() {
            return Err("download directory is not a folder".into());
        }
        return Ok(canon);
    }
    // Allow not-yet-created download roots by normalizing the path.
    Ok(normalize_path(p))
}

fn normalize_path(path: &Path) -> PathBuf {
    let mut out = PathBuf::new();
    for comp in path.components() {
        match comp {
            Component::ParentDir => {
                out.pop();
            }
            Component::CurDir => {}
            other => out.push(other),
        }
    }
    out
}

/// Ensure `dir` resolves under `download_root` (equal or nested).
pub fn validate_download_path(dir: &str, download_root: &str) -> Result<PathBuf, String> {
    reject_parent_components(dir)?;
    reject_parent_components(download_root)?;

    let root = canonical_root(download_root)?;
    let target = Path::new(dir);
    let resolved = if target.exists() {
        canonical_directory(dir)?
    } else {
        let parent = target
            .parent()
            .filter(|p| !p.as_os_str().is_empty())
            .unwrap_or(Path::new("."));
        let base = if parent.exists() {
            parent.canonicalize().map_err(|e| e.to_string())?
        } else {
            canonical_root(&parent.to_string_lossy())?
        };
        let joined = base.join(
            target
                .file_name()
                .ok_or_else(|| "invalid download path".to_string())?,
        );
        normalize_path(&joined)
    };

    if resolved == root || resolved.starts_with(&root) {
        Ok(resolved)
    } else {
        Err("download path must be under the configured download directory".into())
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::fs;

    #[test]
    fn rejects_parent_dir_components() {
        assert!(reject_parent_components("../etc/passwd").is_err());
    }

    #[test]
    fn canonical_directory_requires_existing_dir() {
        let root = std::env::temp_dir().join(format!(
            "torlink-path-guard-{}",
            std::process::id()
        ));
        let _ = fs::remove_dir_all(&root);
        fs::create_dir_all(&root).unwrap();
        let canon = canonical_directory(&root.to_string_lossy()).unwrap();
        assert!(canon.is_dir());
        let _ = fs::remove_dir_all(&root);
    }

    #[test]
    fn validate_download_path_allows_nested_dir() {
        let root = std::env::temp_dir().join(format!(
            "torlink-dl-root-{}",
            std::process::id()
        ));
        let nested = root.join("nested");
        let _ = fs::remove_dir_all(&root);
        fs::create_dir_all(&nested).unwrap();
        let root_s = root.to_string_lossy().to_string();
        let nested_s = nested.to_string_lossy().to_string();
        assert!(validate_download_path(&nested_s, &root_s).is_ok());
        let _ = fs::remove_dir_all(&root);
    }

    #[test]
    fn validate_download_path_rejects_outside_root() {
        let root = std::env::temp_dir().join(format!(
            "torlink-dl-root-out-{}",
            std::process::id()
        ));
        let outside = std::env::temp_dir().join(format!(
            "torlink-dl-outside-{}",
            std::process::id()
        ));
        let _ = fs::remove_dir_all(&root);
        let _ = fs::remove_dir_all(&outside);
        fs::create_dir_all(&root).unwrap();
        fs::create_dir_all(&outside).unwrap();
        let root_s = root.to_string_lossy().to_string();
        let outside_s = outside.to_string_lossy().to_string();
        assert!(validate_download_path(&outside_s, &root_s).is_err());
        let _ = fs::remove_dir_all(&root);
        let _ = fs::remove_dir_all(&outside);
    }
}
