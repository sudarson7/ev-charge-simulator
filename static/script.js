// ============================================================
// SR's EV NETWORK - FRONTEND JAVASCRIPT
// Flask + SQLite Connected Version
// ============================================================


// ============================================================
// ADMIN GLOBAL DATA
// ============================================================



let totalStations = 0;
let stations = [];
let adminTotalRevenue = 0;
let adminTotalEnergy = 0;
let adminActiveStations = 0;


// ============================================================
// VIEW MANAGEMENT
// ============================================================

const views = {
    landing: document.getElementById('landing-page'),
    admin: document.getElementById('admin-portal'),
    user: document.getElementById('user-portal')
};

const subViews = {
    booking: document.getElementById('booking-screen'),
    charging: document.getElementById('charging-screen')
};


// ============================================================
// ADMIN ELEMENTS
// ============================================================

const adminRevEl = document.getElementById('admin-revenue');
const adminEnergyEl = document.getElementById('admin-energy');
const adminActiveEl = document.getElementById('admin-active-stations');
const stationUsageBar = document.getElementById('station-usage-bar');


// ============================================================
// USER PORTAL ELEMENTS
// ============================================================

const btnUserMode = document.getElementById('btn-user-mode');
const btnAdminMode = document.getElementById('btn-admin-mode');

const btnScanPay = document.getElementById('btn-scan-pay');

const qrFrame = document.querySelector('.qr-frame');
const qrContainerEl = document.getElementById('qrContainer');

const instructionText = document.getElementById('instructionText');

const userStationList = document.getElementById('userStationList');

const stationTitle = document.getElementById('stationTitle');


// ============================================================
// SIMULATOR ELEMENTS
// ============================================================

const batteryLevel = document.getElementById('batteryLevel');
const batteryText = document.getElementById('batteryText');

const energyFlow = document.getElementById('energyFlow');

const powerDeliveredEl = document.getElementById('powerDelivered');
const totalCostEl = document.getElementById('totalCost');

const timeRemainingEl = document.getElementById('timeRemaining');

const arriveBtn = document.getElementById('arriveBtn');
const startBtn = document.getElementById('startBtn');
const stopBtn = document.getElementById('stopBtn');
const payNowBtn = document.getElementById('payNowBtn');

const speedBtns = document.querySelectorAll('.speed-btn');

const carContainer = document.getElementById('carContainer');

const connectionCable =
    document.getElementById('connectionCable');

const stationScreen =
    document.querySelector('.station-screen');


// ============================================================
// SIMULATOR STATE
// ============================================================

let hasArrived = false;

let isCharging = false;

let chargePercentage = 15;

let powerDelivered = 0;

let totalCost = 0;

let speedMultiplier = 1;

let intervalId = null;

let selectedStationId = null;
let currentDbSessionId = null;
let syncIntervalId = null;
let isPrePaid = false;
let currentPrepayAmount = 300;

// ============================================================
// CHARGING CONSTANTS
// ============================================================

const BATTERY_CAPACITY = 60;

let currentStationPrice = 15;

const BASE_CHARGE_RATE = 0.05;


// ============================================================
// USER LOCATION
// ============================================================

let userLatitude = null;
let userLongitude = null;
// ================================
// STATION ADMIN LOGIN
// ================================

const adminLoginScreen =
    document.getElementById("admin-login-screen");

const stationAdminDashboard =
    document.getElementById("station-admin-dashboard");

const adminUsername =
    document.getElementById("admin-username");

const adminPassword =
    document.getElementById("admin-password");

const adminLoginBtn =
    document.getElementById("admin-login-btn");

const loginMessage =
    document.getElementById("login-message");

const adminLogoutBtn =
    document.getElementById("admin-logout-btn");


// Admin dashboard elements

const adminStationName =
    document.getElementById("admin-station-name");

const adminStationAddress =
    document.getElementById("admin-station-address");

const adminStationRevenue =
    document.getElementById("station-admin-revenue");

const adminStationEnergy =
    document.getElementById("station-admin-energy");

const adminStationActive =
    document.getElementById("station-admin-active");

const adminStationStatus =
    document.getElementById("station-admin-status");

const adminChargingType =
    document.getElementById("admin-charging-type");

const adminPrice =
    document.getElementById("admin-price");

const stationSessionList =
    document.getElementById("station-session-list");
    // ================================
// ADMIN LOGIN
// ================================

adminLoginBtn.addEventListener("click", async () => {

    const username = adminUsername.value.trim();
    const password = adminPassword.value;

    if (!username || !password) {

        loginMessage.innerText =
            "Please enter username and password.";

        return;
    }

    loginMessage.innerText = "Logging in...";

    try {

        const response = await fetch(
            "/api/admin/login",
            {
                method: "POST",

                headers: {
                    "Content-Type": "application/json"
                },

                body: JSON.stringify({
                    username: username,
                    password: password
                })
            }
        );

        const data = await response.json();

        if (!response.ok || !data.success) {

            loginMessage.innerText =
                data.message || "Invalid login.";

            return;
        }

        // Hide login

        adminLoginScreen.classList.remove("active");

        // Show station dashboard

        stationAdminDashboard.classList.add("active");

        // Display station

        displayAdminStation(data.admin);

        // Load dashboard data

        loadStationDashboard();

    } catch (error) {

        console.error(error);

        loginMessage.innerText =
            "Cannot connect to Flask server.";

    }

});

// ================================
// ADMIN LOGOUT
// ================================

adminLogoutBtn.addEventListener('click', () => {
    stationAdminDashboard.classList.remove('active');
    adminLoginScreen.classList.add('active');
    adminUsername.value = '';
    adminPassword.value = '';
    loginMessage.innerText = '';
});
// ================================
// DISPLAY ADMIN STATION
// ================================

function displayAdminStation(admin) {

    adminStationName.innerText =
        admin.name;

    adminStationAddress.innerText =
        "📍 " + admin.address;

    adminChargingType.innerText =
        admin.charging_type;

   adminPrice.innerText = admin.price;

    adminStationStatus.innerText =
        admin.status;

}
// ================================
// LOAD STATION DASHBOARD
// ================================

async function loadStationDashboard() {

    try {

        const response = await fetch(
            "/api/admin/dashboard"
        );

        const data = await response.json();

        if (!response.ok || !data.success) {

            console.log(data.message);

            return;
        }

        const station = data.station;
        const stats = data.statistics;
        const sessions = data.sessions;

        // Station information

        adminStationName.innerText =
            station.name;

        adminStationAddress.innerText =
            "📍 " + station.address;

        adminChargingType.innerText =
            station.charging_type;
adminPrice.innerText = station.price;

        adminStationStatus.innerText =
            station.status;


        // Statistics

        adminTotalRevenue = Number(stats.revenue);
        adminTotalEnergy = Number(stats.energy);
        adminActiveStations = stats.active_sessions;

        adminStationRevenue.innerText = adminTotalRevenue.toFixed(2);
        adminStationEnergy.innerText = adminTotalEnergy.toFixed(2);
        adminStationActive.innerText = adminActiveStations;


        // Sessions

        stationSessionList.innerHTML = "";

        if (sessions.length === 0) {

            stationSessionList.innerHTML = `
                <div class="session-item">
                    No charging sessions
                </div>
            `;

        } else {

            sessions.forEach(session => {

                const item =
                    document.createElement("div");

                item.className =
                    "session-item";

                item.innerHTML = `
                    Session #${session.id}
                    —
                    Battery: ${session.battery}%
                    —
                    Energy: ${Number(session.energy).toFixed(2)} kWh
                    —
                    ₹${Number(session.cost).toFixed(2)}
                    —
                    ${session.status}
                `;

                stationSessionList.appendChild(item);

            });

        }

    } catch (error) {

        console.error(
            "Dashboard error:",
            error
        );

    }

}

// ============================================================
// INITIAL SETUP
// ============================================================

btnUserMode.addEventListener('click', () => {

    switchView('user');

    loadStations();

});

btnAdminMode.addEventListener('click', () => {

    switchView('admin');

    adminLoginScreen.classList.add('active');

    stationAdminDashboard.classList.remove('active');

    adminUsername.value = '';
    adminPassword.value = '';
    loginMessage.innerText = '';

});


// ============================================================
// HOME / BACK BUTTON
// ============================================================

window.goHome = function () {

    switchView('landing');

    if (subViews.charging.classList.contains('active')) {

        stopCharging(true);

        resetSimulator();

        subViews.charging.classList.remove('active');

        subViews.booking.classList.add('active');
    }
    
    const userNameInput = document.getElementById('userNameInput');
    if(userNameInput) userNameInput.value = '';

};


window.togglePayMode = function() {
    const isPre = document.querySelector('input[name="payMode"]:checked').value === 'prepay';
    document.getElementById('prepayAmountDiv').style.display = isPre ? 'block' : 'none';
    
    if (selectedStationId) {
        if (isPre) {
            qrContainerEl.style.display = 'flex';
            btnScanPay.innerText = "Scan & Pre-Pay";
            instructionText.innerText = `Station selected. Align QR code within the frame to pay & book`;
        } else {
            qrContainerEl.style.display = 'none';
            btnScanPay.innerText = "Book Station";
            instructionText.innerText = "Click below to book this station without pre-paying.";
        }
    }
};


// ============================================================
// VIEW SWITCHING
// ============================================================
function switchView(viewName) {
    Object.values(views).forEach(view => {
        view.classList.remove('active');
    });

    if (views[viewName]) {
        views[viewName].classList.add('active');
    }
}


// ============================================================
// LOAD STATIONS FROM FLASK
// ============================================================

async function loadStations() {

    userStationList.innerHTML = `
        <p style="text-align:center;">
            Loading nearby stations...
        </p>
    `;

    try {

        const response = await fetch('/api/stations');

        if (!response.ok) {

            throw new Error(
                'Unable to load stations from Flask'
            );

        }

        stations = await response.json();

        totalStations = stations.length;

        console.log(
            'Stations loaded from Flask:',
            stations
        );

        // Try to get user's location
        getUserLocation();

    }

    catch (error) {

        console.error(
            'Station loading error:',
            error
        );

        userStationList.innerHTML = `
            <p style="color:#ff4c4c;text-align:center;">
                Unable to load stations.
                Please try again.
            </p>
        `;
    }

}


// ============================================================
// GET USER LOCATION
// ============================================================

function getUserLocation() {

    if (!navigator.geolocation) {

        console.log(
            'Geolocation is not supported.'
        );

        renderStationList();

        return;
    }


    instructionText.innerText =
        "Getting your location...";


    navigator.geolocation.getCurrentPosition(

        function (position) {

            userLatitude =
                position.coords.latitude;

            userLongitude =
                position.coords.longitude;


            console.log(
                'User Latitude:',
                userLatitude
            );

            console.log(
                'User Longitude:',
                userLongitude
            );


            sortStationsByDistance();

            renderStationList();


            instructionText.innerText =
                "Select an available station to proceed";

        },


        function (error) {

            console.log(
                'Location permission denied:',
                error.message
            );


            // If user denies location,
            // still show all stations.

            renderStationList();


            instructionText.innerText =
                "Location unavailable. Showing all stations.";

        },

        {
            enableHighAccuracy: true,

            timeout: 10000,

            maximumAge: 0
        }

    );

}


// ============================================================
// CALCULATE DISTANCE BETWEEN TWO LOCATIONS
// Haversine Formula
// ============================================================

function calculateDistance(
    lat1,
    lon1,
    lat2,
    lon2
) {

    const earthRadius = 6371;

    const dLat =
        (lat2 - lat1) *
        Math.PI / 180;

    const dLon =
        (lon2 - lon1) *
        Math.PI / 180;


    const a =
        Math.sin(dLat / 2) *
        Math.sin(dLat / 2)

        +

        Math.cos(lat1 * Math.PI / 180) *
        Math.cos(lat2 * Math.PI / 180) *

        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);


    const c =
        2 *
        Math.atan2(
            Math.sqrt(a),
            Math.sqrt(1 - a)
        );


    return earthRadius * c;

}


// ============================================================
// SORT STATIONS NEAREST → FARTHEST
// ============================================================

function sortStationsByDistance() {

    if (
        userLatitude === null ||
        userLongitude === null
    ) {

        return;

    }


    stations.forEach(station => {

        station.distance =
            calculateDistance(
                userLatitude,
                userLongitude,
                station.latitude,
                station.longitude
            );

    });


    stations.sort(
        (a, b) =>
            a.distance - b.distance
    );


    console.log(
        'Stations sorted by distance:',
        stations
    );

}


// ============================================================
// DISPLAY STATIONS
// ============================================================

function renderStationList() {

    userStationList.innerHTML = '';


    if (stations.length === 0) {

        userStationList.innerHTML = `
            <p style="text-align:center;">
                No stations available.
            </p>
        `;

        return;

    }


    stations.forEach(station => {

        const div =
            document.createElement('div');


        const isBusy =
            station.status === 'In Use';


        div.className =
            `station-option
            ${isBusy ? 'in-use' : ''}
            ${selectedStationId === station.id
                ? 'selected'
                : ''
            }`;


        // Distance display

        let distanceHTML = '';


        if (
            station.distance !== undefined
        ) {

            distanceHTML = `
                <small>
                    📏 ${station.distance.toFixed(2)} km away
                </small>
            `;

        }


        // Status

        const statusHTML = isBusy

            ? `
                <span class="station-status status-busy">
                    In Use
                </span>
              `

            : `
                <span class="station-status status-avail">
                    Available
                </span>
              `;


        // Station card

        div.innerHTML = `

            <div>

                <strong>
                    ${station.name}
                </strong>

                <br>

                <small>
                    📍 ${station.address}
                </small>

                <br>

                ${distanceHTML}

                <br>

                <small>
                    ⚡ ${station.charging_type}
                </small>

                <br>

                <small>
                    💰 ₹${station.price}/kWh
                </small>

            </div>


            ${statusHTML}

        `;


        // Only available stations can be selected

        if (!isBusy) {

            div.onclick = () => {

                selectStation(
                    station.id
                );

            };

        }


        userStationList.appendChild(div);

    });

}


// ============================================================
// SELECT STATION
// ============================================================

function selectStation(id) {

    selectedStationId = id;


    const selectedStation =
        stations.find(
            station =>
                station.id === id
        );

    if (selectedStation) {
        currentStationPrice = selectedStation.price || 15;
    }


    renderStationList();


    btnScanPay.style.display =
        'inline-block';
        
    window.togglePayMode();

}


// ============================================================
// QR SCAN + PAYMENT
// ============================================================

btnScanPay.addEventListener(
    'click',
    () => {

        const userNameInput = document.getElementById('userNameInput').value.trim();
        if (!userNameInput) {
            alert('Please enter your full name before booking a station.');
            return;
        }

        if (!selectedStationId) {
            alert('Please select a station first.');
            return;
        }

        // Set user name in charging screen
        document.getElementById('chargingUserName').innerText = `| User: ${userNameInput}`;


        const payMode = document.querySelector('input[name="payMode"]:checked').value;
        isPrePaid = (payMode === 'prepay');

        if (isPrePaid) {
            const amountInput = document.getElementById('prepayAmount').value;
            currentPrepayAmount = parseFloat(amountInput);
            if (isNaN(currentPrepayAmount) || currentPrepayAmount <= 0) {
                alert("Please enter a valid prepay amount.");
                return;
            }
        }

        btnScanPay.disabled = true;
        
        if (isPrePaid) {
            qrFrame.classList.add('scanning');
            instructionText.innerText = `Scanning... Processing ₹${currentPrepayAmount}`;
        } else {
            instructionText.innerText = `Connecting to Station #${selectedStationId}...`;
        }

        setTimeout(() => {
            if (isPrePaid) qrFrame.classList.remove('scanning');
            
            if (isPrePaid) {
                instructionText.innerText = `Payment of ₹${currentPrepayAmount} Successful! Unlocking...`;
            } else {
                instructionText.innerText = 'Booking Confirmed! Unlocking Station...';
            }

            setTimeout(() => {
                const selectedStation = stations.find(station => station.id === selectedStationId);
                
                if (selectedStation) {
                    stationTitle.innerText = `⚡ ${selectedStation.name}`;
                    document.getElementById('chargingStationAddress').innerText = selectedStation.address;
                    document.getElementById('chargingStationDistance').innerText = selectedStation.distance ? `${selectedStation.distance.toFixed(2)} km` : '';
                    const rateDisplay = document.getElementById('chargingRateDisplay');
                    if (rateDisplay) rateDisplay.innerText = `₹${selectedStation.price} / kWh`;
                }

                subViews.booking.classList.remove('active');
                subViews.charging.classList.add('active');

                btnScanPay.disabled = false;
                qrContainerEl.style.display = 'none';
                btnScanPay.style.display = 'none';
                instructionText.innerText = 'Select an available station to proceed';

            }, 1500);

        }, isPrePaid ? 2000 : 1000);

    }
);


// ============================================================
// ADMIN DASHBOARD
// ============================================================

function updateAdminDashboard() {

    if (adminRevEl) {
        adminRevEl.innerText = adminTotalRevenue.toFixed(2);
    } else if (document.getElementById("station-admin-revenue")) {
        document.getElementById("station-admin-revenue").innerText = adminTotalRevenue.toFixed(2);
    }

    if (adminEnergyEl) {
        adminEnergyEl.innerText = adminTotalEnergy.toFixed(2);
    } else if (document.getElementById("station-admin-energy")) {
        document.getElementById("station-admin-energy").innerText = adminTotalEnergy.toFixed(2);
    }

    if (adminActiveEl) {
        adminActiveEl.innerText = adminActiveStations;
    } else if (document.getElementById("station-admin-active")) {
        document.getElementById("station-admin-active").innerText = adminActiveStations;
    }

    if (stationUsageBar && totalStations > 0) {
        stationUsageBar.style.width = `${(adminActiveStations / totalStations) * 100}%`;
    }

}


// ============================================================
// BACKGROUND ADMIN SIMULATION
// ============================================================

setInterval(() => {

    if (adminActiveStations > 0) {
        adminTotalEnergy += 0.02;
        adminTotalRevenue += 0.02 * currentStationPrice;
    }

    if (
        views.admin.classList.contains(
            'active'
        )
    ) {
        updateAdminDashboard();
    }

}, 2000);


// ============================================================
// SIMULATOR EVENT LISTENERS
// ============================================================

arriveBtn.addEventListener(
    'click',
    arriveAtStation
);


startBtn.addEventListener(
    'click',
    startCharging
);


stopBtn.addEventListener(
    'click',
    stopCharging
);


// ============================================================
// CHARGING SPEED BUTTONS
// ============================================================

speedBtns.forEach(btn => {

    btn.addEventListener(
        'click',
        () => {

            speedBtns.forEach(
                b =>
                    b.classList.remove(
                        'active'
                    )
            );


            btn.classList.add(
                'active'
            );


            speedMultiplier =
                parseFloat(
                    btn.dataset.multiplier
                );


            const duration =
                1 / speedMultiplier;


            document.documentElement.style
                .setProperty(
                    '--particle-speed',
                    `${duration}s`
                );


            if (isCharging) {

                stopCharging(false);

                startCharging();

            }

        }
    );

});


// ============================================================
// CAR ARRIVAL
// ============================================================

function arriveAtStation() {

    arriveBtn.disabled = true;


    arriveBtn.classList.remove(
        'glow-effect'
    );


    carContainer.classList.add(
        'arrived'
    );


    setTimeout(() => {

        hasArrived = true;


        connectionCable.classList.add(
            'connected'
        );


        startBtn.disabled = false;


        if (
            chargePercentage < 100
        ) {

            startBtn.classList.add(
                'glow-effect'
            );

        }

    }, 3000);

}


// ============================================================
// START CHARGING
// ============================================================

function startCharging() {
    if (chargePercentage >= 100 || !hasArrived) {
        return;
    }

    // Call API to start charging
    fetch("/api/charging/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ station_id: selectedStationId })
    })
    .then(res => res.json())
    .then(data => {
        if(data.success) {
            currentDbSessionId = data.session_id;
            // Start sync interval
            syncIntervalId = setInterval(syncChargingWithDb, 2000);
        } else {
            console.error(data.message);
        }
    })
    .catch(err => console.error(err));

    isCharging = true;
    startBtn.disabled = true;
    startBtn.classList.remove('glow-effect');
    stopBtn.disabled = false;
    payNowBtn.style.display = 'none'; // Hide pay button if restarting

    batteryLevel.classList.add('charging');
    energyFlow.classList.add('active');
    stationScreen.classList.add('active');

    adminActiveStations++;
    updateAdminDashboard();

    intervalId = setInterval(simulateCharging, 100);
}

// Function to sync with DB
function syncChargingWithDb() {
    if(!currentDbSessionId) return;
    fetch("/api/charging/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            session_id: currentDbSessionId,
            battery: chargePercentage,
            energy: powerDelivered,
            cost: totalCost
        })
    }).catch(e => console.error(e));
}


// ============================================================
// STOP CHARGING
// ============================================================

function stopCharging(updateControls = true) {
    if (!isCharging) {
        return;
    }

    isCharging = false;
    clearInterval(intervalId);
    if(syncIntervalId) clearInterval(syncIntervalId);

    // Call API to stop charging
    if (currentDbSessionId) {
        fetch("/api/charging/stop", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ session_id: currentDbSessionId })
        }).catch(err => console.error(err));
    }

    batteryLevel.classList.remove('charging');
    energyFlow.classList.remove('active');
    stationScreen.classList.remove('active');

    if (adminActiveStations > 0) {
        adminActiveStations--;
    }
    updateAdminDashboard();

    if (updateControls) {
        startBtn.disabled = chargePercentage >= 100;
        if (chargePercentage < 100) {
            startBtn.classList.add('glow-effect');
        }
        stopBtn.disabled = true;
        timeRemainingEl.innerText = '--:--';
        
        // Show Final Settlement
        document.getElementById('mainControlsSection').style.display = 'none';
        const finalSection = document.getElementById('finalPaymentSection');
        finalSection.style.display = 'block';

        const prepayAmount = isPrePaid ? currentPrepayAmount : 0;
        const balance = totalCost - prepayAmount;

        const finalText = document.getElementById('finalPaymentText');
        const finalQrContainer = document.getElementById('finalQrContainer');
        const finalPayBtn = document.getElementById('finalPayBtn');
        const finishBtn = document.getElementById('finishBtn');

        if (balance > 0) {
            finalText.innerHTML = `
                Total Cost: ₹${totalCost.toFixed(2)}<br>
                Amount Prepaid: ₹${prepayAmount.toFixed(2)}<br>
                <strong style="color: var(--danger)">Balance Due: ₹${balance.toFixed(2)}</strong>
            `;
            finalQrContainer.style.display = 'flex';
            finalPayBtn.style.display = 'block';
            finishBtn.style.display = 'none';
        } else {
            const refund = -balance;
            finalText.innerHTML = `
                Total Cost: ₹${totalCost.toFixed(2)}<br>
                Amount Prepaid: ₹${prepayAmount.toFixed(2)}<br>
                <strong style="color: var(--success)">Fully Paid! ${refund > 0 ? '(Refund of ₹' + refund.toFixed(2) + ' initiated)' : ''}</strong>
            `;
            finalQrContainer.style.display = 'none';
            finalPayBtn.style.display = 'none';
            finishBtn.style.display = 'block';
        }
    }
}

// Final Payment Event
document.getElementById('finalPayBtn').addEventListener('click', () => {
    const btn = document.getElementById('finalPayBtn');
    btn.disabled = true;
    document.getElementById('finalQrFrame').classList.add('scanning');
    document.getElementById('finalPaymentText').innerText = "Processing Balance Payment...";
    
    setTimeout(() => {
        document.getElementById('finalQrFrame').classList.remove('scanning');
        document.getElementById('finalPaymentText').innerHTML = `<strong style="color: var(--success)">Payment Successful! Thank you.</strong>`;
        btn.style.display = 'none';
        document.getElementById('finishBtn').style.display = 'block';
    }, 2000);
});

document.getElementById('finishBtn').addEventListener('click', () => {
    goHome();
});



// ============================================================
// CHARGING SIMULATION
// ============================================================

function simulateCharging() {

    const increment =
        BASE_CHARGE_RATE *
        speedMultiplier;


    chargePercentage +=
        increment;


    const powerIncrement =
        (increment / 100) *
        BATTERY_CAPACITY;


    powerDelivered +=
        powerIncrement;


    totalCost =
        powerDelivered *
        currentStationPrice;


    // Update global admin statistics

    adminTotalEnergy +=
        powerIncrement;


    adminTotalRevenue +=
        powerIncrement *
        currentStationPrice;


    if (
        chargePercentage >= 100
    ) {
        chargePercentage = 100;


        stopCharging();


        timeRemainingEl.innerText =
            'Complete';

    }

    else {

        calculateTimeRemaining(
            increment
        );

    }


    updateUI();

}


// ============================================================
// TIME REMAINING
// ============================================================

function calculateTimeRemaining(
    incrementPerTick
) {

    const ticksRemaining =
        (100 - chargePercentage) /
        incrementPerTick;


    const minutesRemaining =
        Math.floor(
            ticksRemaining
        );


    const hours =
        Math.floor(
            minutesRemaining / 60
        );


    const mins =
        minutesRemaining % 60;


    timeRemainingEl.innerText =
        `${hours}h ${mins
            .toString()
            .padStart(2, '0')}m`;

}


// ============================================================
// UPDATE CHARGING UI
// ============================================================

function updateUI() {

    batteryLevel.style.width =
        `${chargePercentage}%`;


    batteryText.innerText =
        `${Math.floor(
            chargePercentage
        )}%`;


    powerDeliveredEl.innerText =
        powerDelivered.toFixed(2);


    totalCostEl.innerText =
        totalCost.toFixed(2);


    if (
        chargePercentage < 20
    ) {

        batteryLevel.style.background =
            'linear-gradient(90deg, #ff4c4c, #ff7675)';

    }

    else if (
        chargePercentage < 50
    ) {

        batteryLevel.style.background =
            'linear-gradient(90deg, #fdcb6e, #ffeaa7)';

    }

    else {

        batteryLevel.style.background =
            'linear-gradient(90deg, var(--secondary-neon), var(--primary-neon))';

    }

}


// ============================================================
// RESET SIMULATOR
// ============================================================

function resetSimulator() {

    hasArrived = false;

    chargePercentage = 15;

    powerDelivered = 0;

    totalCost = 0;


    carContainer.classList.remove(
        'arrived'
    );


    connectionCable.classList.remove(
        'connected'
    );


    arriveBtn.disabled = false;


    arriveBtn.classList.add(
        'glow-effect'
    );


    startBtn.disabled = true;


    startBtn.classList.remove(
        'glow-effect'
    );


    stopBtn.disabled = true;
    
    document.getElementById('mainControlsSection').style.display = 'flex';
    document.getElementById('finalPaymentSection').style.display = 'none';
    document.getElementById('finalPayBtn').disabled = false;

    timeRemainingEl.innerText =
        '--:--';

    updateUI();
}


// ============================================================
// INITIAL UI
// ============================================================

updateUI();