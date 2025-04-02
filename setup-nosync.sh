#!/bin/bash
# Script to set up .nosync directories and symlinks for cloud storage optimization

set -e

# Function to create a .nosync directory and symlink
setup_nosync_dir() {
  local DIR=$1
  local NOSYNC_DIR="${DIR}.nosync"
  
  echo "Setting up .nosync for $DIR..."
  
  # If directory exists
  if [ -d "$DIR" ]; then
    # If it's not already a symlink
    if [ ! -L "$DIR" ]; then
      echo "Moving $DIR to $NOSYNC_DIR..."
      mv "$DIR" "$NOSYNC_DIR"
      ln -s "$NOSYNC_DIR" "$DIR"
      echo "Created symlink: $DIR -> $NOSYNC_DIR"
    else
      echo "$DIR is already a symlink, skipping."
    fi
  else
    # If nosync directory exists but not the symlink
    if [ -d "$NOSYNC_DIR" ]; then
      echo "Creating symlink: $DIR -> $NOSYNC_DIR"
      ln -s "$NOSYNC_DIR" "$DIR"
    else
      echo "Neither $DIR nor $NOSYNC_DIR exist. Creating empty $NOSYNC_DIR with symlink."
      mkdir -p "$NOSYNC_DIR"
      ln -s "$NOSYNC_DIR" "$DIR"
    fi
  fi
}

# Directories to convert to .nosync
echo "Setting up .nosync directories to prevent cloud sync..."
setup_nosync_dir "node_modules"
setup_nosync_dir ".next"
setup_nosync_dir "data"

echo "Done! Your directories are now optimized for cloud storage."
echo "The following directories are excluded from sync:"
echo "- node_modules -> node_modules.nosync"
echo "- .next -> .next.nosync"
echo "- data -> data.nosync" 