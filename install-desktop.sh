#!/run/current-system/sw/bin/bash
set -e

echo "Installing Opencode Editor to Linux Desktop..."

APP_DIR=$(pwd)
ICON_URL="https://raw.githubusercontent.com/lucide-icons/lucide/main/icons/terminal-square.svg"
ICON_DIR="$HOME/.local/share/icons/hicolor/scalable/apps"
DESKTOP_DIR="$HOME/.local/share/applications"

# Create directories if they don't exist
mkdir -p "$ICON_DIR"
mkdir -p "$DESKTOP_DIR"

# Download a generic icon
echo "Downloading icon..."
wget -qO "$ICON_DIR/opencode.svg" "$ICON_URL"

# Create the .desktop file
echo "Creating desktop entry..."
cat > "$DESKTOP_DIR/opencode.desktop" << EOF
[Desktop Entry]
Version=1.0
Type=Application
Name=Opencode Editor
Comment=Distraction-free Online Code Editor
Exec=sh -c 'cd "$APP_DIR" && npm run desktop'
Icon=opencode
Terminal=false
Categories=Development;IDE;
StartupNotify=true
EOF

# Make it executable
chmod +x "$DESKTOP_DIR/opencode.desktop"

# Update desktop database
if command -v update-desktop-database &> /dev/null; then
    update-desktop-database "$DESKTOP_DIR"
fi

echo "✅ Installation complete!"
echo "You can now find 'Opencode Editor' in your Linux application menu."
