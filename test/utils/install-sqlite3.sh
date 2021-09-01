#! /bin/bash

echo "Installing sqlite3..."

if [ -n command -v yum ]; then
  sudo dnf install sqlite3 -y
elif [ -n command -v apt ]; then
  sudo apt install sqlite3 -y
else
  echo "Failed to install sqlite3"
  exit 1
fi

exit 0