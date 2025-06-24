import React, { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import * as lucideIcons from "lucide-react";
import {
  Search,
  Upload,
  Plus,
  Trash2,
  Save,
  X,
  Monitor,
  Folder,
  Code,
  Settings as SettingsIcon,
  Image,
  FileText,
  Music,
  Video,
  Archive,
  Terminal,
  Globe,
  Mail,
  Camera,
  Phone,
  Clock,
  Calendar,
  Heart,
  Star,
  Home,
  User,
  Users,
  MapPin,
  Flag,
  Edit3,
  Eye,
  Download,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  Package,
} from "lucide-react";
import { ColorPicker } from "./components/ui/color-picker";

type AppConfig = {
  id: number;
  name: string;
  icon: keyof typeof lucideIcons | string;
  color: string;
  iconColor: string;
  command: string;
  isCustomIcon?: boolean;
  customIconData?: string;
};

type SettingsProps = {
  onClose: () => void;
  onSave?: () => void;
};

const iconMap = lucideIcons;

// Get all lucide icon names
const allIconNames = Object.keys(iconMap).filter(
  (name) => name !== "createLucideIcon" && name !== "default"
) as string[];

// Common app categories and their typical commands
const commonApps = [
  { name: "Text Editor", command: "code", category: "Development" },
  { name: "Terminal", command: "gnome-terminal", category: "Development" },
  { name: "File Manager", command: "nautilus", category: "System" },
  { name: "Web Browser", command: "firefox", category: "Internet" },
  { name: "Chrome", command: "google-chrome", category: "Internet" },
  { name: "VSCode", command: "code", category: "Development" },
  { name: "Sublime Text", command: "subl", category: "Development" },
  { name: "Vim", command: "vim", category: "Development" },
  { name: "Emacs", command: "emacs", category: "Development" },
  { name: "Calculator", command: "gnome-calculator", category: "Utilities" },
  { name: "Screenshot", command: "gnome-screenshot", category: "Utilities" },
  { name: "Settings", command: "gnome-control-center", category: "System" },
  { name: "Music Player", command: "rhythmbox", category: "Media" },
  { name: "Video Player", command: "vlc", category: "Media" },
  { name: "Image Viewer", command: "eog", category: "Media" },
  { name: "GIMP", command: "gimp", category: "Graphics" },
  { name: "Inkscape", command: "inkscape", category: "Graphics" },
  {
    name: "LibreOffice Writer",
    command: "libreoffice --writer",
    category: "Office",
  },
  {
    name: "LibreOffice Calc",
    command: "libreoffice --calc",
    category: "Office",
  },
  { name: "Discord", command: "discord", category: "Communication" },
  { name: "Slack", command: "slack", category: "Communication" },
  { name: "Zoom", command: "zoom", category: "Communication" },
];

const colorOptions = [
  "bg-red-500",
  "bg-orange-500",
  "bg-yellow-500",
  "bg-green-500",
  "bg-blue-500",
  "bg-indigo-500",
  "bg-purple-500",
  "bg-pink-500",
  "bg-gray-500",
  "bg-slate-500",
  "bg-zinc-500",
  "bg-neutral-500",
  "bg-stone-500",
  "bg-red-600",
  "bg-orange-600",
  "bg-yellow-600",
  "bg-green-600",
  "bg-blue-600",
  "bg-indigo-600",
  "bg-purple-600",
  "bg-pink-600",
  "bg-gray-600",
];

const iconColorOptions = [
  "text-white",
  "text-gray-100",
  "text-gray-200",
  "text-gray-300",
  "text-gray-600",
  "text-gray-700",
  "text-gray-800",
  "text-gray-900",
  "text-red-100",
  "text-blue-100",
  "text-green-100",
  "text-yellow-100",
  "text-purple-100",
  "text-pink-100",
  "text-indigo-100",
  "text-orange-100",
];

export default function Settings({ onClose, onSave }: SettingsProps) {
  const [apps, setApps] = useState<AppConfig[]>([]);
  const [editingApp, setEditingApp] = useState<AppConfig | null>(null);
  const [showIconPicker, setShowIconPicker] = useState(false);
  const [showAppChooser, setShowAppChooser] = useState(false);
  const [iconSearch, setIconSearch] = useState("");
  const [appSearch, setAppSearch] = useState("");
  const [customIconFile, setCustomIconFile] = useState<File | null>(null);
  const [iconPage, setIconPage] = useState(0);
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [showSystemAppChooser, setShowSystemAppChooser] = useState(false);
  const [systemApps, setSystemApps] = useState<
    { name: string; exec: string }[]
  >([]);
  const [systemAppSearch, setSystemAppSearch] = useState("");

  const iconsPerPage = 48;

  useEffect(() => {
    invoke<string>("get_apps_config")
      .then((configStr) => {
        setApps(JSON.parse(configStr));
      })
      .catch(console.error);
  }, []);

  const filteredIcons = allIconNames.filter((name) =>
    name.toLowerCase().includes(iconSearch.toLowerCase())
  );

  const paginatedIcons = filteredIcons.slice(
    iconPage * iconsPerPage,
    (iconPage + 1) * iconsPerPage
  ) as (keyof typeof iconMap)[];

  const totalPages = Math.ceil(filteredIcons.length / iconsPerPage);

  const categories = [
    "All",
    ...Array.from(new Set(commonApps.map((app) => app.category))),
  ];

  const filteredApps = commonApps.filter((app) => {
    const matchesSearch =
      app.name.toLowerCase().includes(appSearch.toLowerCase()) ||
      app.command.toLowerCase().includes(appSearch.toLowerCase());
    const matchesCategory =
      selectedCategory === "All" || app.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleAddApp = () => {
    const newApp: AppConfig = {
      id: Math.max(...apps.map((a) => a.id), 0) + 1,
      name: "New App",
      icon: "Package",
      color: "bg-blue-500",
      iconColor: "text-white",
      command: "",
    };
    setEditingApp(newApp);
  };

  const handleEditApp = (app: AppConfig) => {
    let color = app.color;
    if (typeof color === "string" && color.startsWith("bg-")) {
      color = "hsl(220, 100%, 50%)"; // default blue
    }
    setEditingApp({ ...app, color });
  };

  const handleDeleteApp = (id: number) => {
    if (confirm("Are you sure you want to delete this shortcut?")) {
      setApps(apps.filter((app) => app.id !== id));
    }
  };

  const handleSaveApp = () => {
    if (!editingApp) return;

    if (!editingApp.name.trim() || !editingApp.command.trim()) {
      alert("Please fill in both name and command fields.");
      return;
    }

    const updatedApps = apps.some((app) => app.id === editingApp.id)
      ? apps.map((app) => (app.id === editingApp.id ? editingApp : app))
      : [...apps, editingApp];

    setApps(updatedApps);
    setEditingApp(null);
  };

  const handleIconSelect = (iconName: keyof typeof lucideIcons) => {
    if (editingApp) {
      const updated = {
        ...editingApp,
        icon: iconName,
        isCustomIcon: false,
        customIconData: undefined,
      };
      setEditingApp(updated);
      updateAppInList(updated);
      setShowIconPicker(false);
    }
  };

  const handleCustomIconUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file || !editingApp) return;

    if (!file.type.startsWith("image/")) {
      alert("Please select an image file.");
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      const updated = {
        ...editingApp,
        icon: file.name,
        isCustomIcon: true,
        customIconData: result,
      };
      setEditingApp(updated);
      updateAppInList(updated);
      setShowIconPicker(false);
    };
    reader.readAsDataURL(file);
  };

  const handleAppSelect = (app: (typeof commonApps)[0]) => {
    if (editingApp) {
      setEditingApp({
        ...editingApp,
        name: app.name,
        command: app.command,
      });
      setShowAppChooser(false);
    }
  };

  const handleSaveAll = () => {
    const config = JSON.stringify(apps);
    invoke("save_apps_config", { config })
      .then(() => {
        if (typeof onSave === "function") onSave();
        alert("Settings saved!");
        onClose();
      })
      .catch((err) => {
        alert("Failed to save settings: " + err);
      });
  };

  const renderIcon = (app: AppConfig, size = "w-8 h-8") => {
    if (app.isCustomIcon && app.customIconData) {
      return (
        <img
          src={app.customIconData}
          alt={app.name}
          className={`${size} object-cover rounded`}
        />
      );
    }

    const IconComponent = iconMap[
      app.icon as keyof typeof lucideIcons
    ] as React.ElementType;
    if (IconComponent) {
      return <IconComponent className={`${size} ${app.iconColor}`} />;
    }

    return <Package className={`${size} ${app.iconColor}`} />;
  };

  const handleOpenSystemAppChooser = () => {
    setShowSystemAppChooser(true);
    if (systemApps.length === 0) {
      invoke<string>("list_system_apps").then((appsStr) => {
        try {
          setSystemApps(JSON.parse(appsStr));
        } catch {
          setSystemApps([]);
        }
      });
    }
  };

  const handleSystemAppSelect = (app: { name: string; exec: string }) => {
    if (editingApp) {
      setEditingApp({
        ...editingApp,
        name: app.name,
        command: app.exec,
      });
      setShowSystemAppChooser(false);
    }
  };

  // Helper to update a shortcut in the apps array, save to disk, and refresh launcher
  const updateAppInList = (updated: AppConfig) => {
    setApps((prev) => {
      const newApps = prev.map((a) => (a.id === updated.id ? updated : a));
      invoke("save_apps_config", { config: JSON.stringify(newApps) });
      if (typeof onSave === "function") onSave();
      return newApps;
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-2xl">
      <div className="w-11/12 h-5/6 bg-white/30 border border-white/30 rounded-2xl shadow-2xl backdrop-blur-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/20">
          <h2 className="text-2xl font-bold text-white">Shortcut Settings</h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-white/10 transition-colors"
          >
            <X className="w-6 h-6 text-white" />
          </button>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex overflow-hidden">
          {/* App List */}
          <div className="w-1/2 p-6 border-r border-white/20 overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-white">Shortcuts</h3>
              <button
                onClick={handleAddApp}
                className="flex items-center gap-2 px-4 py-2 bg-green-500/20 hover:bg-green-500/30 text-green-100 rounded-lg transition-colors"
              >
                <Plus className="w-4 h-4" />
                Add Shortcut
              </button>
            </div>

            <div className="space-y-3">
              {apps.map((app) => (
                <div
                  key={app.id}
                  className="flex items-center gap-4 p-4 bg-white/5 hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
                  onClick={() => handleEditApp(app)}
                >
                  <div className={`${app.color} rounded-lg p-2`}>
                    {renderIcon(app)}
                  </div>
                  <div className="flex-1">
                    <div className="font-medium text-white">{app.name}</div>
                    <div className="text-sm text-gray-300">{app.command}</div>
                  </div>
                  <div className="flex gap-2">
                    {app.command !== "settings" && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteApp(app.id);
                        }}
                        className="p-2 hover:bg-red-500/20 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-6 h-6 text-red-300" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Edit Panel */}
          <div className="w-1/2 p-6 overflow-y-auto">
            {editingApp ? (
              <div className="space-y-6">
                <h3 className="text-xl font-semibold text-white">
                  Edit Shortcut
                </h3>

                {/* Preview */}
                <div className="flex items-center gap-4 p-4 bg-white/5 rounded-lg">
                  <div className={`${editingApp.color} rounded-lg p-3`}>
                    {renderIcon(editingApp, "w-12 h-12")}
                  </div>
                  <div>
                    <div className="font-medium text-white">
                      {editingApp.name}
                    </div>
                    <div className="text-sm text-gray-300">
                      {editingApp.command}
                    </div>
                  </div>
                </div>

                {/* Form */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-200 mb-2">
                      Name
                    </label>
                    <input
                      type="text"
                      value={editingApp.name}
                      onChange={(e) => {
                        const updated = { ...editingApp, name: e.target.value };
                        setEditingApp(updated);
                        updateAppInList(updated);
                      }}
                      className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter app name"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-200 mb-2">
                      Command
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={editingApp.command}
                        onChange={(e) => {
                          const updated = {
                            ...editingApp,
                            command: e.target.value,
                          };
                          setEditingApp(updated);
                          updateAppInList(updated);
                        }}
                        className="flex-1 px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Enter command to run"
                      />
                      <button
                        onClick={() => setShowAppChooser(true)}
                        className="px-4 py-2 bg-blue-500/20 hover:bg-blue-500/30 text-blue-100 rounded-lg transition-colors"
                      >
                        Choose App
                      </button>
                      <button
                        onClick={handleOpenSystemAppChooser}
                        className="px-4 py-2 bg-purple-500/20 hover:bg-purple-500/30 text-purple-100 rounded-lg transition-colors"
                      >
                        Choose from Installed
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-200 mb-2">
                      Icon
                    </label>
                    <button
                      onClick={() => setShowIconPicker(true)}
                      className="flex items-center gap-3 px-4 py-3 bg-white/10 hover:bg-white/15 border border-white/20 rounded-lg transition-colors w-full"
                    >
                      <div className={`${editingApp.color} rounded-lg p-2`}>
                        {renderIcon(editingApp)}
                      </div>
                      <span className="text-white">
                        {editingApp.isCustomIcon
                          ? "Custom Icon"
                          : editingApp.icon}
                      </span>
                    </button>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-200 mb-2">
                      Background Color
                    </label>
                    <ColorPicker
                      color={editingApp.color}
                      onChange={(color) => {
                        const updated = { ...editingApp, color };
                        setEditingApp(updated);
                        updateAppInList(updated);
                      }}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-200 mb-2">
                      Icon Color
                    </label>
                    <div className="grid grid-cols-4 gap-2">
                      {iconColorOptions.map((iconColor) => (
                        <button
                          key={iconColor}
                          onClick={() => {
                            const updated = { ...editingApp, iconColor };
                            setEditingApp(updated);
                            updateAppInList(updated);
                          }}
                          className={`px-3 py-2 rounded-lg border text-sm ${
                            editingApp.iconColor === iconColor
                              ? "bg-white/20 border-white/40 text-white"
                              : "bg-white/5 border-white/20 text-gray-300 hover:bg-white/10"
                          }`}
                        >
                          {iconColor.replace("text-", "")}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-3 pt-4">
                  <button
                    onClick={() => setEditingApp(null)}
                    className="flex-1 px-4 py-2 bg-gray-500/20 hover:bg-gray-500/30 text-gray-200 rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveApp}
                    className="flex-1 px-4 py-2 bg-green-500/20 hover:bg-green-500/30 text-green-100 rounded-lg transition-colors"
                  >
                    Save Changes
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center h-full text-gray-400">
                <div className="text-center">
                  <Package className="w-16 h-16 mx-auto mb-4 opacity-50" />
                  <p>Select a shortcut to edit</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-4 p-6 border-t border-white/20">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-gray-500/20 hover:bg-gray-500/30 text-gray-200 rounded-lg transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>

      {/* Icon Picker Modal */}
      {showIconPicker && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="w-4/5 h-4/5 bg-white/10 border border-white/30 rounded-2xl shadow-2xl backdrop-blur-xl flex flex-col">
            <div className="flex items-center justify-between p-6 border-b border-white/20">
              <h3 className="text-xl font-semibold text-white">Choose Icon</h3>
              <button
                onClick={() => setShowIconPicker(false)}
                className="p-2 rounded-lg hover:bg-white/10 transition-colors"
              >
                <X className="w-6 h-6 text-white" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="flex gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search icons..."
                      value={iconSearch}
                      onChange={(e) => {
                        setIconSearch(e.target.value);
                        setIconPage(0);
                      }}
                      className="w-full pl-10 pr-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
                <div className="relative">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleCustomIconUpload}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  <button className="flex items-center gap-2 px-4 py-2 bg-purple-500/20 hover:bg-purple-500/30 text-purple-100 rounded-lg transition-colors">
                    <Upload className="w-4 h-4" />
                    Upload Custom
                  </button>
                </div>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between">
                  <button
                    onClick={() => setIconPage(Math.max(0, iconPage - 1))}
                    disabled={iconPage === 0}
                    className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/15 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    Previous
                  </button>
                  <span className="text-white">
                    Page {iconPage + 1} of {totalPages}
                  </span>
                  <button
                    onClick={() =>
                      setIconPage(Math.min(totalPages - 1, iconPage + 1))
                    }
                    disabled={iconPage === totalPages - 1}
                    className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/15 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
                  >
                    Next
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              <div className="grid grid-cols-8 gap-4">
                {paginatedIcons.map((iconName) => {
                  const IconComponent = iconMap[
                    iconName as keyof typeof iconMap
                  ] as React.ElementType;
                  return (
                    <button
                      key={iconName}
                      onClick={() =>
                        handleIconSelect(iconName as keyof typeof iconMap)
                      }
                      className="flex flex-col items-center gap-2 p-4 bg-white/5 hover:bg-white/15 rounded-lg transition-colors group"
                      title={iconName}
                    >
                      <IconComponent className="w-8 h-8 text-white group-hover:text-blue-300 transition-colors" />
                      <span className="text-xs text-gray-300 group-hover:text-white transition-colors truncate w-full text-center">
                        {iconName}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* App Chooser Modal */}
      {showAppChooser && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="w-3/4 h-3/4 bg-white/10 border border-white/30 rounded-2xl shadow-2xl backdrop-blur-xl flex flex-col">
            <div className="flex items-center justify-between p-6 border-b border-white/20">
              <h3 className="text-xl font-semibold text-white">
                Choose Application
              </h3>
              <button
                onClick={() => setShowAppChooser(false)}
                className="p-2 rounded-lg hover:bg-white/10 transition-colors"
              >
                <X className="w-6 h-6 text-white" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="flex gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search applications..."
                      value={appSearch}
                      onChange={(e) => setAppSearch(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {categories.map((category) => (
                    <option
                      key={category}
                      value={category}
                      className="bg-gray-800"
                    >
                      {category}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              <div className="grid grid-cols-2 gap-4">
                {filteredApps.map((app, index) => (
                  <button
                    key={index}
                    onClick={() => handleAppSelect(app)}
                    className="flex items-center gap-4 p-4 bg-white/5 hover:bg-white/15 rounded-lg transition-colors text-left"
                  >
                    <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center">
                      <Monitor className="w-6 h-6 text-blue-300" />
                    </div>
                    <div className="flex-1">
                      <div className="font-medium text-white">{app.name}</div>
                      <div className="text-sm text-gray-300">{app.command}</div>
                      <div className="text-xs text-gray-400">
                        {app.category}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {showSystemAppChooser && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="w-3/4 h-3/4 bg-white/10 border border-white/30 rounded-2xl shadow-2xl backdrop-blur-xl flex flex-col">
            <div className="flex items-center justify-between p-6 border-b border-white/20">
              <h3 className="text-xl font-semibold text-white">
                Choose Installed Application
              </h3>
              <button
                onClick={() => setShowSystemAppChooser(false)}
                className="p-2 rounded-lg hover:bg-white/10 transition-colors"
              >
                <X className="w-6 h-6 text-white" />
              </button>
            </div>
            <div className="p-6">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search installed apps..."
                  value={systemAppSearch}
                  onChange={(e) => setSystemAppSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-6">
              <div className="grid grid-cols-2 gap-4">
                {systemApps
                  .filter(
                    (app) =>
                      app.name
                        .toLowerCase()
                        .includes(systemAppSearch.toLowerCase()) ||
                      app.exec
                        .toLowerCase()
                        .includes(systemAppSearch.toLowerCase())
                  )
                  .map((app, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleSystemAppSelect(app)}
                      className="flex items-center gap-4 p-4 bg-white/5 hover:bg-white/15 rounded-lg transition-colors text-left"
                    >
                      <div className="w-12 h-12 bg-purple-500/20 rounded-lg flex items-center justify-center">
                        <Monitor className="w-6 h-6 text-purple-300" />
                      </div>
                      <div className="flex-1">
                        <div className="font-medium text-white">{app.name}</div>
                        <div className="text-sm text-gray-300">{app.exec}</div>
                      </div>
                    </button>
                  ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
