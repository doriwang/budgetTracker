let db

// create a local offline db
const request = window.indexedDB.open("budget", 1)

request.onupgradeneeded = function (event) {
    const db = event.target.result
    console.log(db)

    // create a object called pending to store data
    db.createObjectStore("pending", {
        autoIncrement: true
    })
}

request.onsuccess = function (event) {
    db = event.target.result

    if (navigator.onLine) {
        checkDatabase()
    }
}

request.onerror = function (event) {
    console.log(event.target.errorCode)
}

// open a transaction to read and write data, and store transaction records (data) to pending object
function saveRecord(record) {
    const transaction = db.transaction(["pending"], "readwrite")
    const pendingStore = transaction.objectStore("pending")
    pendingStore.add(record)
}

function checkDatabase() {
    const transaction = db.transaction(["pending"], "readwrite")
    const pendingStore = transaction.objectStore("pending")
    const getAll = pendingStore.getAll()

    getAll.onsuccess = function () {
        if (getAll.result.length > 0) {
            fetch("/api/transaction/bulk", {
                method: "POST",
                body: JSON.stringify(getAll.result),
                headers: {
                    Accept: "application/json, text/plain, */*",
                    "Content-Type": "application/json"
                }
            })
                .then(response => {
                    return response.json();
                })
                .then(() => {
                    // delete records if successful
                    const transaction = db.transaction(["pending"], "readwrite");
                    const store = transaction.objectStore("pending");
                    store.clear();
                });
        }
    };
}

// listen for app coming back online
window.addEventListener("online", checkDatabase);
