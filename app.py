from flask import Flask, render_template, jsonify, request, session, send_from_directory
from database import init_db, get_db
import os

# ============================================================
# APP SETUP
# ============================================================

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

app = Flask(__name__)
app.secret_key = "sr_ev_secret_key_2026"

init_db()


# ============================================================
# HOME
# ============================================================

@app.route("/")
def home():
    return render_template("index.html")


# ============================================================
# STATIC / OTHER FILES
# ============================================================

@app.route("/<path:filename>")
def serve_files(filename):
    return send_from_directory(BASE_DIR, filename)


# ============================================================
# GET ALL STATIONS
# USER PORTAL
# ============================================================

@app.route("/api/stations")
def get_stations():

    conn = get_db()

    stations = conn.execute("""
        SELECT
            id,
            name,
            address,
            latitude,
            longitude,
            charging_type,
            price,
            status
        FROM stations
        ORDER BY id
    """).fetchall()

    conn.close()

    return jsonify([
        dict(station)
        for station in stations
    ])


# ============================================================
# ADMIN LOGIN
# ============================================================

@app.route("/api/admin/login", methods=["POST"])
def admin_login():

    data = request.get_json() or {}

    username = data.get("username", "").strip()
    password = data.get("password", "")

    if not username or not password:
        return jsonify({
            "success": False,
            "message": "Username and password are required"
        }), 400

    conn = get_db()

    admin = conn.execute("""
        SELECT
            admins.id AS admin_id,
            admins.username,
            admins.station_id,

            stations.id AS station_id,
            stations.name,
            stations.address,
            stations.latitude,
            stations.longitude,
            stations.charging_type,
            stations.price,
            stations.status

        FROM admins

        INNER JOIN stations
        ON admins.station_id = stations.id

        WHERE admins.username = ?
        AND admins.password = ?
    """, (
        username,
        password
    )).fetchone()

    conn.close()

    if not admin:
        return jsonify({
            "success": False,
            "message": "Invalid username or password"
        }), 401

    # ========================================================
    # SAVE LOGGED-IN ADMIN
    # ========================================================

    session.clear()

    session["admin_id"] = admin["admin_id"]
    session["station_id"] = admin["station_id"]
    session["username"] = admin["username"]

    return jsonify({
        "success": True,
        "message": "Login successful",
        "admin": dict(admin)
    })


# ============================================================
# ADMIN DASHBOARD
# ONLY LOGGED-IN ADMIN'S STATION
# ============================================================

@app.route("/api/admin/dashboard")
def admin_dashboard():

    if "admin_id" not in session:
        return jsonify({
            "success": False,
            "message": "Admin not logged in"
        }), 401

    station_id = session["station_id"]

    conn = get_db()

    # ========================================================
    # GET ONLY THIS ADMIN'S STATION
    # ========================================================

    station = conn.execute("""
        SELECT
            id,
            name,
            address,
            latitude,
            longitude,
            charging_type,
            price,
            status
        FROM stations
        WHERE id = ?
    """, (
        station_id,
    )).fetchone()

    if not station:

        conn.close()

        return jsonify({
            "success": False,
            "message": "Station not found"
        }), 404

    # ========================================================
    # STATION STATISTICS
    # ========================================================

    stats = conn.execute("""
        SELECT

            COALESCE(
                SUM(energy),
                0
            ) AS energy,

            COALESCE(
                SUM(cost),
                0
            ) AS revenue,

            COUNT(
                CASE
                    WHEN status = 'Charging'
                    THEN 1
                END
            ) AS active_sessions

        FROM charging_sessions

        WHERE station_id = ?
    """, (
        station_id,
    )).fetchone()

    # ========================================================
    # CHARGING SESSIONS
    # ========================================================

    sessions = conn.execute("""
        SELECT
            id,
            battery,
            energy,
            cost,
            status
        FROM charging_sessions
        WHERE station_id = ?
        ORDER BY id DESC
    """, (
        station_id,
    )).fetchall()

    conn.close()

    return jsonify({

        "success": True,

        "station": dict(station),

        "statistics": dict(stats),

        "sessions": [
            dict(s)
            for s in sessions
        ]

    })


# ============================================================
# ADMIN LOGOUT
# ============================================================

@app.route("/api/admin/logout", methods=["POST"])
def admin_logout():

    session.clear()

    return jsonify({
        "success": True,
        "message": "Logged out"
    })


# ============================================================
# START CHARGING
# ============================================================

@app.route("/api/charging/start", methods=["POST"])
def start_charging():

    data = request.get_json() or {}

    station_id = data.get("station_id")

    if not station_id:
        return jsonify({
            "success": False,
            "message": "Station ID required"
        }), 400

    conn = get_db()

    # ========================================================
    # CHECK STATION
    # ========================================================

    station = conn.execute("""
        SELECT *
        FROM stations
        WHERE id = ?
    """, (
        station_id,
    )).fetchone()

    if not station:

        conn.close()

        return jsonify({
            "success": False,
            "message": "Station not found"
        }), 404

    # ========================================================
    # PREVENT DOUBLE CHARGING
    # ========================================================

    if station["status"] == "In Use":

        conn.close()

        return jsonify({
            "success": False,
            "message": "Station is already in use"
        }), 409

    # ========================================================
    # MAKE STATION BUSY
    # ========================================================

    conn.execute("""
        UPDATE stations
        SET status = 'In Use'
        WHERE id = ?
    """, (
        station_id,
    ))

    # ========================================================
    # CREATE CHARGING SESSION
    # ========================================================

    cursor = conn.execute("""
        INSERT INTO charging_sessions
        (
            station_id,
            battery,
            energy,
            cost,
            status
        )
        VALUES (?, ?, ?, ?, ?)
    """, (
        station_id,
        15,
        0,
        0,
        "Charging"
    ))

    session_id = cursor.lastrowid

    conn.commit()
    conn.close()

    return jsonify({

        "success": True,

        "session_id": session_id,

        "message": "Charging started"

    })


# ============================================================
# UPDATE CHARGING
# ============================================================

@app.route("/api/charging/update", methods=["POST"])
def update_charging():

    data = request.get_json() or {}

    session_id = data.get("session_id")
    battery = data.get("battery")
    energy = data.get("energy")
    cost = data.get("cost")

    if not session_id:

        return jsonify({
            "success": False,
            "message": "Session ID required"
        }), 400

    conn = get_db()

    charging_session = conn.execute("""
        SELECT station_id
        FROM charging_sessions
        WHERE id = ?
    """, (
        session_id,
    )).fetchone()

    if not charging_session:

        conn.close()

        return jsonify({
            "success": False,
            "message": "Charging session not found"
        }), 404

    conn.execute("""
        UPDATE charging_sessions

        SET
            battery = ?,
            energy = ?,
            cost = ?

        WHERE id = ?
    """, (
        battery,
        energy,
        cost,
        session_id
    ))

    conn.commit()
    conn.close()

    return jsonify({
        "success": True
    })


# ============================================================
# STOP CHARGING
# ============================================================

@app.route("/api/charging/stop", methods=["POST"])
def stop_charging():

    data = request.get_json() or {}

    session_id = data.get("session_id")

    if not session_id:

        return jsonify({
            "success": False,
            "message": "Session ID required"
        }), 400

    conn = get_db()

    charging_session = conn.execute("""
        SELECT station_id
        FROM charging_sessions
        WHERE id = ?
    """, (
        session_id,
    )).fetchone()

    if not charging_session:

        conn.close()

        return jsonify({
            "success": False,
            "message": "Session not found"
        }), 404

    station_id = charging_session["station_id"]

    # ========================================================
    # COMPLETE SESSION
    # ========================================================

    conn.execute("""
        UPDATE charging_sessions
        SET status = 'Completed'
        WHERE id = ?
    """, (
        session_id,
    ))

    # ========================================================
    # MAKE STATION AVAILABLE
    # ========================================================

    conn.execute("""
        UPDATE stations
        SET status = 'Available'
        WHERE id = ?
    """, (
        station_id,
    ))

    conn.commit()
    conn.close()

    return jsonify({

        "success": True,

        "message": "Charging stopped"

    })


# ============================================================
# RUN SERVER
# ============================================================

if __name__ == "__main__":

    app.run(
        debug=True,
        host="127.0.0.1",
        port=5000
    )