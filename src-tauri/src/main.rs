// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use tauri::Manager;
use tauri::AppHandle;
use std::fs;
use std::io::{BufRead, BufReader};
use std::process::Command;
use std::thread;
use std::time::Duration;
use std::env;
use tauri_plugin_autostart::MacosLauncher;
use tauri_plugin_autostart::ManagerExt;

#[tauri::command]
fn get_apps_config(app_handle: AppHandle) -> String {
    let config_dir = app_handle.path().app_config_dir().unwrap();
    let config_path = config_dir.join("fidgetapps_config.json");

    if !config_path.exists() {
        let default_config = r#"[
            { "id": 1, "name": "Text Editor", "icon": "Code", "color": "bg-blue-500", "iconColor": "text-gray-600", "command": "xed" },
            { "id": 2, "name": "File Manager", "icon": "Folder", "color": "bg-yellow-500", "iconColor": "text-gray-600", "command": "nautilus" }
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
fn launch_application(command: String, app_handle: AppHandle) {
  println!("Launching application: {}", command);
  #[cfg(target_os = "windows")]
  {
    Command::new("cmd")
            .args(["/C", &command])
            .spawn()
            .expect("failed to execute process");
  }

  #[cfg(target_os = "macos")]
  {
    Command::new("sh")
            .arg("-c")
            .arg(&command)
            .spawn()
            .expect("failed to execute process");
  }

  #[cfg(target_os = "linux")]
  {
    // Use the launch_and_move.sh script to launch the app and move its window
    let resource_dir = app_handle.path().resource_dir().unwrap();
    let script = resource_dir.join("bundled-bin/launch_and_move.sh");
    let _ = Command::new("chmod").arg("+x").arg(&script).status();
    // Pass the command to the script
    let _ = Command::new(script)
      .arg("sh")
      .arg("-c")
      .arg(&command)
      .spawn();
  }
}

#[tauri::command]
fn list_system_apps() -> String {
    let mut apps = Vec::new();
    let pattern = "/usr/share/applications/*.desktop";
    for entry in glob::glob(pattern).expect("Failed to read glob pattern") {
        if let Ok(path) = entry {
            if let Ok(file) = std::fs::File::open(&path) {
                let reader = BufReader::new(file);
                let mut name: Option<String> = None;
                let mut exec: Option<String> = None;
                for line in reader.lines().flatten() {
                    if line.starts_with("Name=") && name.is_none() {
                        name = Some(line[5..].to_string());
                    } else if line.starts_with("Exec=") && exec.is_none() {
                        // Remove arguments like %U, %f, etc.
                        let mut exec_val = line[5..].split_whitespace().next().unwrap_or("").to_string();
                        // Remove quotes if present
                        if exec_val.starts_with('"') && exec_val.ends_with('"') {
                            exec_val = exec_val.trim_matches('"').to_string();
                        }
                        exec = Some(exec_val);
                    }
                    if name.is_some() && exec.is_some() {
                        break;
                    }
                }
                if let (Some(name), Some(exec)) = (name, exec) {
                    apps.push(serde_json::json!({"name": name, "exec": exec}));
                }
            }
        }
    }
    serde_json::to_string(&apps).unwrap_or("[]".to_string())
}

#[tauri::command]
fn is_autostart_enabled(app_handle: AppHandle) -> bool {
    app_handle.autolaunch().is_enabled().unwrap_or(false)
}

#[tauri::command]
fn set_autostart_enabled(app_handle: AppHandle, enabled: bool) -> bool {
    if enabled {
        app_handle.autolaunch().enable().is_ok()
    } else {
        app_handle.autolaunch().disable().is_ok()
    }
}

fn main() {
    // Set an environment variable programmatically
    std::env::set_var("GDK_BACKEND", "x11");
    std::env::set_var("WEBKIT_DISABLE_COMPOSITING_MODE", "1");

    tauri::Builder::default()
        .plugin(tauri_plugin_autostart::init(MacosLauncher::LaunchAgent, None))
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
            save_apps_config,
            list_system_apps,
            is_autostart_enabled,
            set_autostart_enabled
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
