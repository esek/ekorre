@echo off
set DATABASE_PATH=sqlite_database.db
set PUBLIC_PATH=%CD%\public.local

sqlite3 --version >nul 2>&1 && (
  echo "Skapar sqlite3 databas under namnet %DATABASE_PATH%"
  sqlite3 -init src/sql/init.sql $DATABASE_PATH .exit
  copy .env.example.dev .env
  echo "DB_FILE=%DATABASE_PATH%" >> .env

  echo "Skapar lokal public mapp under namnet %PUBLIC_PATH%"
  mkdir %PUBLIC_PATH%
  xcopy /E public %PUBLIC_PATH%
  echo "FILE_ROOT=%PUBLIC_PATH%" >> .env

  echo "Installerar alla npm paket"
  npm install

  echo "Startar utvecklingserver..."
  echo "För att stänga av servern, tryck CTRL+C"
  echo ""
  echo "PS: för att starta denna själv senare så skriv kommandot:"
  echo "npm run dev"
  TIMEOUT 5

  npm run dev

) || (
    echo "sqlite3 hittades inte, ladda ner 'sqlite-tools' till windows från https://sqlite.org/download.html"
    echo "och kopiera in sqlite3.exe till denna mapp"
)