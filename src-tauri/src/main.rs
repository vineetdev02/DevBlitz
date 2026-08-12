// Prevents additional console window on Windows in release
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

// The whole app lives in the library crate so desktop and mobile entry points
// register exactly the same command handlers. Keeping a second builder here is
// how commands silently went missing before.
fn main() {
    devblitz_lib::run();
}
