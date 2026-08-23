import sqlite3

DATABASE = "ev_charging.db"


def get_db():
    conn = sqlite3.connect(DATABASE)
    conn.row_factory = sqlite3.Row
    return conn


def init_db():
    conn = get_db()
    cursor = conn.cursor()

    # Stations
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS stations (
            id INTEGER PRIMARY KEY,
            name TEXT NOT NULL,
            address TEXT NOT NULL,
            charging_type TEXT NOT NULL,
            price REAL NOT NULL,
            latitude REAL,
            longitude REAL,
            status TEXT DEFAULT 'Available'
        )
    """)

    # Separate admin for every station
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS admins (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL,
            station_id INTEGER NOT NULL,
            FOREIGN KEY (station_id) REFERENCES stations(id)
        )
    """)

    # Charging sessions
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS charging_sessions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            station_id INTEGER NOT NULL,
            battery REAL DEFAULT 0,
            energy REAL DEFAULT 0,
            cost REAL DEFAULT 0,
            status TEXT DEFAULT 'Charging',
            FOREIGN KEY (station_id) REFERENCES stations(id)
        )
    """)

    # Insert stations only if they don't already exist
    stations = [
        (1, "SR EV Station #1", "Anna Nagar, Chennai",
         "Fast Charging", 15, 13.0850, 80.2101, "Available"),

        (2, "SR EV Station #2", "T. Nagar, Chennai",
         "Ultra Fast", 18, 13.0418, 80.2341, "Available"),

        (3, "SR EV Station #3", "Adyar, Chennai",
         "Fast Charging", 15, 13.0067, 80.2574, "In Use"),

        (4, "SR EV Station #4", "Velachery, Chennai",
         "Standard", 12, 12.9815, 80.2180, "Available"),

        (5, "SR EV Station #5", "Guindy, Chennai",
         "Ultra Fast", 20, 13.0068, 80.2206, "Available")
    ]

    cursor.executemany("""
        INSERT OR IGNORE INTO stations
        (id, name, address, charging_type, price,
         latitude, longitude, status)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    """, stations)

    # DIFFERENT ADMIN FOR DIFFERENT STATION
    admins = [
        ("admin1", "admin123", 1),
        ("admin2", "admin123", 2),
        ("admin3", "admin123", 3),
        ("admin4", "admin123", 4),
        ("admin5", "admin123", 5)
    ]

    cursor.executemany("""
        INSERT OR IGNORE INTO admins
        (username, password, station_id)
        VALUES (?, ?, ?)
    """, admins)

    conn.commit()
    conn.close()


if __name__ == "__main__":
    init_db()
    print("Database initialized successfully.")
    print("Station admins created.")