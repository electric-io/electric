#![cfg_attr(
	all(not(debug_assertions), target_os = "windows"),
	windows_subsystem = "windows"
)]

use std::process::Command;

fn main() {
	tauri::Builder::default()
		.invoke_handler(tauri::generate_handler![load_font])
		.run(tauri::generate_context!())
		.expect("error while running tauri application");
}

#[tauri::command]
fn load_font(font_path: String, project_path: String) {
	match Command::new("ttx")
		.args(["-v", "-d", &project_path, &font_path])
		.spawn()
	{
		Ok(_) => {}
		Err(err) => println!("{}", err),
	}
}
