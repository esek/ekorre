#!/bin/sh

if ! command -v sqlite3 &> /dev/null
then
    echo "sqlite3 kunde inte hittas!"
    echo "För debian/ubuntu skriv: sudo apt install sqlite3"
    echo "För fedora/rhel skriv: sudo dnf install sqlite3"
    exit
fi

function finish {
    echo "PS: för att starta serven själv senare så skriv kommandot:"
    echo ""
    echo "npm run dev"
}
trap finish EXIT

./initenv.sh

echo "Installerar alla npm paket..."
npm install

echo "Startar utvecklingserver..."
echo "För att stänga av servern, tryck CTRL+C"
sleep 5

npm run dev

