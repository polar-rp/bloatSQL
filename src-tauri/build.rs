use std::fs;
use std::path::Path;

fn main() {
  fs::create_dir_all("icons").ok();

  tauri_build::build()
}
