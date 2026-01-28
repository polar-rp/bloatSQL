fn main() {
    std::fs::create_dir_all("icons").ok();
    tauri_build::build()
}
