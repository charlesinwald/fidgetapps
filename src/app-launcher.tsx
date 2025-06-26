import { useState, useEffect } from "react";
import * as lucideIcons from "lucide-react";
import { invoke } from "@tauri-apps/api/core";
import Settings from "./Settings";

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

const iconMap = lucideIcons;

export default function AppLauncher() {
  const [apps, setApps] = useState<AppConfig[]>([]);
  const [openingApp, setOpeningApp] = useState<number | null>(null);
  const [isAnimating, setIsAnimating] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  const loadConfig = () => {
    invoke<string>("get_apps_config")
      .then((configStr) => {
        setApps(JSON.parse(configStr));
      })
      .catch(console.error);
  };

  useEffect(() => {
    loadConfig();
  }, []);

  const handleAppClick = (appId: number) => {
    if (isAnimating) return;

    const app = apps.find((a) => a.id === appId);
    if (!app) return;

    if (app.command === "settings") {
      setShowSettings(true);
      return;
    }

    setOpeningApp(appId);
    setIsAnimating(true);

    invoke("launch_application", { command: app.command }).catch(console.error);

    // Reset after animation completes
    setTimeout(() => {
      setOpeningApp(null);
      setIsAnimating(false);
    }, 1500);
  };

  const handleSettingsClose = () => {
    setShowSettings(false);
    loadConfig();
  };

  return (
    <div className="min-h-screen min-w-screen bg-gradient-to-br from-blue-400 via-purple-400 to-pink-400 flex items-center justify-center p-4 relative overflow-hidden">
      {showSettings && (
        <Settings onClose={handleSettingsClose} onSave={loadConfig} />
      )}
      {/* Glassmorphism Container */}
      <div className="relative w-[90vh] h-[90vh]">
        {/* Main launcher container */}
        <div
          className={`w-full h-full flex items-center justify-center rounded-3xl border border-white/30 bg-white/20 bg-clip-padding p-6 shadow-2xl backdrop-blur-xl transition-all duration-500 ${
            openingApp ? "scale-95 opacity-80" : "scale-100 opacity-100"
          }`}
        >
          {/* App grid */}
          <div className="grid grid-cols-2 gap-8 w-full h-full p-8">
            {apps.map((app) => {
              const isOpening = openingApp === app.id;

              const renderIcon = () => {
                if (app.isCustomIcon && app.customIconData) {
                  return (
                    <img
                      src={app.customIconData}
                      alt={app.name}
                      className={`w-40 h-40 object-cover rounded-xl transition-all duration-300 ${
                        isOpening ? "scale-110" : ""
                      }`}
                    />
                  );
                }

                const IconComponent = iconMap[
                  app.icon as keyof typeof lucideIcons
                ] as React.ElementType;
                if (IconComponent) {
                  return (
                    <IconComponent
                      className={`w-40 h-40 ${
                        app.iconColor
                      } transition-all duration-300 ${
                        isOpening ? "scale-110" : ""
                      }`}
                      strokeWidth={1.5}
                    />
                  );
                }

                // Fallback icon
                return (
                  <div
                    className={`w-40 h-40 ${
                      app.iconColor
                    } flex items-center justify-center text-6xl font-bold rounded-xl transition-all duration-300 ${
                      isOpening ? "scale-110" : ""
                    }`}
                  >
                    ?
                  </div>
                );
              };

              return (
                <button
                  key={app.id}
                  onClick={() => handleAppClick(app.id)}
                  disabled={isAnimating}
                  className={`group relative w-full h-full flex items-center justify-center rounded-2xl border border-white/40 bg-white/30 bg-clip-padding shadow-lg backdrop-blur-sm transition-all duration-300 ${
                    isOpening
                      ? "scale-110 bg-white/50 shadow-2xl z-20"
                      : "hover:bg-white/40 hover:scale-105 active:scale-95"
                  } ${isAnimating && !isOpening ? "opacity-50 scale-95" : ""}`}
                >
                  {/* Icon background */}
                  <div
                    className={`rounded-2xl p-6 shadow-md transition-all duration-300 ${
                      isOpening ? "scale-110 shadow-xl" : ""
                    }`}
                    style={
                      app.color &&
                      (app.color.startsWith("hsl") || app.color.startsWith("#"))
                        ? { backgroundColor: app.color }
                        : undefined
                    }
                    {...(app.color &&
                    !(app.color.startsWith("hsl") || app.color.startsWith("#"))
                      ? {
                          className: `${
                            app.color
                          } rounded-2xl p-6 shadow-md transition-all duration-300 ${
                            isOpening ? "scale-110 shadow-xl" : ""
                          }`,
                        }
                      : {})}
                  >
                    {renderIcon()}
                  </div>

                  {/* Ripple effect */}
                  {isOpening && (
                    <>
                      <div className="absolute inset-0 rounded-2xl bg-white/30 animate-ping" />
                      <div className="absolute inset-0 rounded-2xl bg-white/20 animate-pulse" />
                    </>
                  )}

                  {/* Hover effect */}
                  <div className="absolute inset-0 rounded-2xl bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
                </button>
              );
            })}
          </div>
        </div>

        {/* Additional glow effect */}
        <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-white/10 to-transparent blur-xl -z-10" />
      </div>

      {/* Full screen app opening overlay */}
      {openingApp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Background overlay */}
          <div className="absolute inset-0 bg-black/20 backdrop-blur-sm animate-in fade-in duration-300" />

          {/* Opening app preview */}
          <div className="relative">
            {(() => {
              const app = apps.find((a) => a.id === openingApp);
              if (!app) return null;

              const renderPreviewIcon = () => {
                if (app.isCustomIcon && app.customIconData) {
                  return (
                    <img
                      src={app.customIconData}
                      alt={app.name}
                      className="w-16 h-16 object-cover rounded-lg"
                    />
                  );
                }

                const IconComponent = iconMap[
                  app.icon as keyof typeof lucideIcons
                ] as React.ElementType;
                if (IconComponent) {
                  return (
                    <IconComponent
                      className={`w-16 h-16 ${app.iconColor}`}
                      strokeWidth={1.5}
                    />
                  );
                }

                return (
                  <div
                    className={`w-16 h-16 ${app.iconColor} flex items-center justify-center text-2xl font-bold rounded-lg`}
                  >
                    ?
                  </div>
                );
              };

              return (
                <div className="animate-in zoom-in duration-500 ease-out">
                  <div
                    className={`rounded-3xl p-8 shadow-2xl animate-pulse`}
                    style={
                      app.color &&
                      (app.color.startsWith("hsl") || app.color.startsWith("#"))
                        ? { backgroundColor: app.color }
                        : undefined
                    }
                    {...(app.color &&
                    !(app.color.startsWith("hsl") || app.color.startsWith("#"))
                      ? {
                          className: `${app.color} rounded-3xl p-8 shadow-2xl animate-pulse`,
                        }
                      : {})}
                  >
                    {renderPreviewIcon()}
                  </div>

                  {/* App name */}
                  <div className="text-center mt-4">
                    <p className="text-white text-lg font-medium drop-shadow-lg">
                      {app.name}
                    </p>
                    <p className="text-white/70 text-sm mt-1">Opening...</p>
                  </div>

                  {/* Loading dots */}
                  <div className="flex justify-center mt-4 space-x-1">
                    <div
                      className="w-2 h-2 bg-white/60 rounded-full animate-bounce"
                      style={{ animationDelay: "0ms" }}
                    />
                    <div
                      className="w-2 h-2 bg-white/60 rounded-full animate-bounce"
                      style={{ animationDelay: "150ms" }}
                    />
                    <div
                      className="w-2 h-2 bg-white/60 rounded-full animate-bounce"
                      style={{ animationDelay: "300ms" }}
                    />
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      )}
    </div>
  );
}
