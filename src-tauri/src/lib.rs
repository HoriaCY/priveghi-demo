// The shell holds no rule and draws nothing: one web view on the bundled build (dist/), the
// engine still WebAssembly inside the page. No plugin, no command, no network.
#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default().run(tauri::generate_context!()).expect("the shell could not open its web view");
}
