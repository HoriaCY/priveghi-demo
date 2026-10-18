// The shell holds no rule and draws nothing: one web view on the bundled build (dist/), the
// engine still WebAssembly inside the page. No plugin, no command, no network.
#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    // Tauri's default Mac menu bar is English (Window, Edit, View, Help) and the table gives it no
    // words; without it, closing the window quits. Elsewhere the switch does nothing.
    tauri::Builder::default()
        .enable_macos_default_menu(false)
        .run(tauri::generate_context!())
        .expect("the shell could not open its web view");
}
