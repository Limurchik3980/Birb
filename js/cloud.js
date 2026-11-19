// ===== Firebase: вхід і синхронізація =====
const firebaseConfig = {
    apiKey: "AIzaSyBkm80ThyHeBQGW8NXRlrsJZp32iMrZJvs",
    authDomain: "birb-71931.firebaseapp.com",
    projectId: "birb-71931",
    storageBucket: "birb-71931.firebasestorage.app",
    messagingSenderId: "940360708485",
    appId: "1:940360708485:web:f93f9105dd7097031ed4ec"
};

firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

let korystuvach = null; // поточний залогінений користувач або null

function uvijty() {
    const provider = new firebase.auth.GoogleAuthProvider();
    auth.signInWithPopup(provider).catch(function (err) {
        alert("Не вдалося увійти: " + err.message);
    });
}

function vyjty() {
    auth.signOut();
}

// Зберігає шматки даних у хмару, тільки якщо користувач увійшов
function hmaraZberehty(dani) {
    if (!korystuvach) return;
    db.collection("users").doc(korystuvach.uid).set(dani, { merge: true })
        .catch(function (err) { console.error(err); });
}

// Після входу: беремо дані з хмари, а якщо їх там ще немає, завантажуємо локальні
async function zavantazhytyZHmary() {
    const ref = db.collection("users").doc(korystuvach.uid);
    const snap = await ref.get();

    if (snap.exists) {
        const d = snap.data();
        if (d.chekliest !== undefined) {
            zavdannya = JSON.parse(d.chekliest);
            localStorage.setItem("chekliest", d.chekliest);
        }
        if (d.ikony !== undefined) {
            ikony = JSON.parse(d.ikony);
            localStorage.setItem("kesha-ikony", d.ikony);
        }
        if (d.dni !== undefined) {
            dni = JSON.parse(d.dni);
            localStorage.setItem("kesha-dni3", d.dni);
        }
    } else {
        // Перший вхід: переносимо те, що вже є в цьому браузері
        await ref.set({
            chekliest: JSON.stringify(zavdannya),
            ikony: JSON.stringify(ikony),
            dni: JSON.stringify(dni)
        });
    }

    pokazaty();
    renderIkony();
    pokazatyMinuli();
}

// Показує в меню, увійшла людина чи ні
function pokazatyStanVhodu() {
    const info = document.getElementById("vhid-info");
    const knopka = document.getElementById("vhid-knopka");
    if (korystuvach) {
        knopka.hidden = true;
        info.hidden = false;
        document.getElementById("vhid-email").textContent = korystuvach.email;
    } else {
        knopka.hidden = false;
        info.hidden = true;
    }
}

// Стежить за входом і виходом
auth.onAuthStateChanged(function (u) {
    korystuvach = u;
    pokazatyStanVhodu();
    if (u) {
        zavantazhytyZHmary().catch(function (err) { console.error(err); });
    }
});

document.getElementById("vhid-knopka").addEventListener("click", uvijty);
document.getElementById("vyhid-knopka").addEventListener("click", vyjty);