// Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyBjBFg7wZqXWG7kJFOWuFaHUNj1_AF3Lyc",
  authDomain: "sscdatabase-e68cd.firebaseapp.com",
  databaseURL: "https://sscdatabase-e68cd-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "sscdatabase-e68cd",
  storageBucket: "sscdatabase-e68cd.firebasestorage.app",
  messagingSenderId: "699283290984",
  appId: "1:699283290984:web:b4020b003e9a41e0a274dd",
  measurementId: "G-SVX0TXGMX3"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const dbURL = firebaseConfig.databaseURL;

// Password hashing function
async function hashPassword(password) {
    const msgUint8 = new TextEncoder().encode(password);
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgUint8);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    return hashHex;
}

// Admin login (from your admins node)
async function handleLogin(e) {
    e.preventDefault();
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;
    const loginError = document.getElementById("loginError");

    loginError.classList.add("d-none");

    try {
        const res = await fetch(`${dbURL}/admins.json`);
        const admins = await res.json();

        let valid = false;
        for (let key in admins) {
            if(admins[key].email === email && admins[key].password == await hashPassword(password)){
                valid = true;
                break;
            }
        }

        if(valid){
            document.getElementById("loginSection").classList.add("d-none");
            document.getElementById("dashboardSection").classList.remove("d-none");
            document.getElementById("userEmail").innerText = email;
            fetchStudents();
        } else {
            loginError.innerText = "Invalid credentials!";
            loginError.classList.remove("d-none");
        }

    } catch(err) {
        loginError.innerText = "Error connecting to database.";
        loginError.classList.remove("d-none");
        console.error(err);
    }
}

// Logout
function handleLogout() {
    document.getElementById("loginSection").classList.remove("d-none");
    document.getElementById("dashboardSection").classList.add("d-none");
    document.getElementById("tableBody").innerHTML = "";
}

// Fetch students from Realtime Database
async function fetchStudents() {
    const tableBody = document.getElementById("tableBody");
    tableBody.innerHTML = "";

    try {
        const res = await fetch(`${dbURL}/students.json`);
        const students = await res.json();

        if(!students){
            document.getElementById("emptyState").classList.remove("d-none");
            document.getElementById("recordCount").innerText = "0 records";
            document.getElementById("totalRecords").innerText = "0";
            document.getElementById("currentYearRecords").innerText = "0";
            document.getElementById("uniqueDistricts").innerText = "0";
            document.getElementById("todayRecords").innerText = "0";
            return;
        } else {
            document.getElementById("emptyState").classList.add("d-none");
        }

        let count = 0;
        let currentYearCount = 0;
        let todayCount = 0;
        let districtsSet = new Set();

        const todayDate = new Date().toISOString().slice(0,10); // YYYY-MM-DD

        for(let key in students){
            const s = students[key];
            const row = document.createElement("tr");

            row.innerHTML = `
                <td>${s.name || ""}</td>
                <td>${s.school || ""}</td>
                <td>${s.district || ""}</td>
                <td>${s.sscYear || ""}</td>
                <td>${s.location || ""}</td>
                <td>${s.notes || ""}</td>
                <td>${s.timestamp || ""}</td>
                <td>-</td>
            `;
            tableBody.appendChild(row);
            count++;

            // Stats calculation
            if(s.sscYear == new Date().getFullYear()) currentYearCount++;
            if(s.timestamp && s.timestamp.slice(0,10) === todayDate) todayCount++;
            if(s.district) districtsSet.add(s.district);
        }

        // Update statistics cards
        document.getElementById("recordCount").innerText = `${count} records`;
        document.getElementById("totalRecords").innerText = count;
        document.getElementById("currentYearRecords").innerText = currentYearCount;
        document.getElementById("uniqueDistricts").innerText = districtsSet.size;
        document.getElementById("todayRecords").innerText = todayCount;

    } catch(err){
        console.error("Error fetching students:", err);
    }
}


// Export to Excel
function exportData() {
    const table = document.getElementById("studentsTable");
    const wb = XLSX.utils.book_new();

    // Convert HTML table to worksheet
    const ws = XLSX.utils.table_to_sheet(table);

    // Append worksheet to workbook
    XLSX.utils.book_append_sheet(wb, ws, "Students");

    // Generate Excel file and trigger download
    XLSX.writeFile(wb, `students_${new Date().toISOString().slice(0,10)}.xlsx`);
}


// Refresh Button
function refreshData() {
    fetchStudents();
}
