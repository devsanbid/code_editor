#!/usr/bin/env bash
echo "Running Opencode Editor via Nixpkgs Electron..."
npm run build
nix-shell -p electron --run "electron ."
