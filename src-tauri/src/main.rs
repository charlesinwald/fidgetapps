// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use tauri::Manager;
use tauri::AppHandle;
use std::fs;

#[tauri::command]
fn get_apps_config(app_handle: AppHandle) -> String {
    let config_dir = app_handle.path().app_config_dir().unwrap();
    let config_path = config_dir.join("fidgetapps_config.json");

    if !config_path.exists() {
        let default_config = r#"[
            { "id": 1, "name": "Text Editor", "icon": "Code", "color": "bg-blue-500", "iconColor": "text-gray-600", "command": "xed" },
            { "id": 2, "name": "File Manager", "icon": "Folder", "color": "bg-yellow-500", "iconColor": "text-gray-600", "command": "nautilus" },
            { "id": 99, "name": "Settings", "icon": "Settings", "color": "bg-gray-400/50", "iconColor": "text-gray-600", "command": "settings" }
        ]"#;
        fs::create_dir_all(&config_dir).expect("Unable to create config directory");
        fs::write(&config_path, default_config).expect("Unable to write default config");
        return default_config.to_string();
    }

    fs::read_to_string(config_path).expect("Unable to read config file")
}

#[tauri::command]
fn save_apps_config(app_handle: AppHandle, config: String) {
    let config_dir = app_handle.path().app_config_dir().unwrap();
    fs::create_dir_all(&config_dir).expect("Unable to create config directory");
    let config_path = config_dir.join("fidgetapps_config.json");
    fs::write(config_path, config).expect("Unable to write config file");
}

#[tauri::command]
fn launch_application(command: String) {
  println!("Launching application: {}", command);
  #[cfg(target_os = "windows")]
  {
    use std::process::Command;
    Command::new("cmd")
            .args(["/C", &command])
            .spawn()
            .expect("failed to execute process");
  }

  #[cfg(not(target_os = "windows"))]
  {
    use std::process::Command;
    Command::new("sh")
            .arg("-c")
            .arg(&command)
            .spawn()
            .expect("failed to execute process");
  }
}

fn main() {
    // Set an environment variable programmatically
    std::env::set_var("GDK_BACKEND", "x11");
    std::env::set_var("WEBKIT_DISABLE_COMPOSITING_MODE", "1");

    tauri::Builder::default()
        .setup(|app| {
            // Find the monitor with the smallest resolution
            let smallest_monitor = app
                .available_monitors()?
                .into_iter()
                .min_by_key(|monitor| monitor.size().width * monitor.size().height);
            
            // Get the main window
            let window = app.get_webview_window("main").unwrap();

            if let Some(monitor) = smallest_monitor {
                // Move the window to the smallest monitor
                window.set_position(monitor.position().clone())?;
                // Make the window fullscreen on that monitor
                window.set_fullscreen(true)?;
            }

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            launch_application,
            get_apps_config,
            save_apps_config
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
