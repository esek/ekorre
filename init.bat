set DATABASE_PATH=sqlite_database.db

sqlite3 --version >nul 2>&1 && (
  echo "Skapar sqlite3 databas under namnet %DATABASE_PATH%"
  sqlite3 -init src/sql/init.sql $DATABASE_PATH .exit
  copy .env.example.dev .env
  echo "DB_FILE=%DATABASE_PATH%" >> .env

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
    echo "sqlite3 hittades inte, du behöver installera detta"
)