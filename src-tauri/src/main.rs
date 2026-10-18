// The desktop entry; the phone enters through `run` in lib.rs.
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

fn main() {
    priveghi_shell::run();
}
