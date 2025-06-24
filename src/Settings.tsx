import { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";

type SettingsProps = {
  onClose: () => void;
};

export default function Settings({ onClose }: SettingsProps) {
  const [config, setConfig] = useState("");
  const [initialConfig, setInitialConfig] = useState("");

  useEffect(() => {
    invoke<string>("get_apps_config")
      .then((configStr) => {
        const formattedConfig = JSON.stringify(JSON.parse(configStr), null, 2);
        setConfig(formattedConfig);
        setInitialConfig(formattedConfig);
      })
      .catch(console.error);
  }, []);

  const handleSave = () => {
    try {
      // Validate JSON
      const parsed = JSON.parse(config);
      invoke("save_apps_config", { config: JSON.stringify(parsed) })
        .then(() => {
          alert("Settings saved!");
          onClose();
        })
        .catch((err) => {
          alert("Failed to save settings: " + err);
        });
    } catch (e) {
      alert("Invalid JSON format!");
    }
  };

  const handleCancel = () => {
    onClose();
  };

  const handleReset = () => {
    setConfig(initialConfig);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm">
      <div className="w-3/4 h-3/4 bg-white/50 border border-white/30 rounded-2xl shadow-lg p-6 flex flex-col">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">Settings</h2>
        <textarea
          className="w-full h-full p-4 rounded-lg bg-gray-700 text-gray-200 font-mono text-sm border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={config}
          onChange={(e) => setConfig(e.target.value)}
        />
        <div className="flex justify-end gap-4 mt-4">
          <button
            onClick={handleReset}
            className="px-4 py-2 rounded-lg bg-gray-500 text-white hover:bg-gray-600 transition"
          >
            Reset
          </button>
          <button
            onClick={handleCancel}
            className="px-4 py-2 rounded-lg bg-red-500 text-white hover:bg-red-600 transition"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 rounded-lg bg-green-500 text-white hover:bg-green-600 transition"
          >
            Save & Close
          </button>
        </div>
      </div>
    </div>
  );
}
