// ===== Кешаня: збереження і спільні дані =====
const KAT = {
    akt: { nazva: "Активності", mistce: "Нова активність" },
    khar: { nazva: "Харчування", mistce: "Нова їжа" }
};

const MISYATSI = ["Січень", "Лютий", "Березень", "Квітень", "Травень", "Червень",
    "Липень", "Серпень", "Вересень", "Жовтень", "Листопад", "Грудень"];
const DNI_TYZH = ["Неділя", "Понеділок", "Вівторок", "Середа", "Четвер", "П'ятниця", "Субота"];

// Іконки: { akt: [{emoji, tekst}], khar: [...] }
let ikony = JSON.parse(localStorage.getItem("kesha-ikony")) || {
    akt: [{ emoji: "😜", tekst: "Свист" }],
    khar: [{ emoji: "🥦", tekst: "Броколі" }]
};

// Збережені дні: dni[data] = { akt: [група, ...], khar: [група, ...] }
let dni = JSON.parse(localStorage.getItem("kesha-dni3")) || {};

function zberehtyDni() {
    localStorage.setItem("kesha-ikony", JSON.stringify(ikony));
    localStorage.setItem("kesha-dni3", JSON.stringify(dni));
    hmaraZberehty({
        ikony: JSON.stringify(ikony),
        dni: JSON.stringify(dni)
    });
}

function sohodni() {
    const d = new Date();
    return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
}

function novaHrupa(ch) {
    return { chas: "", ch: !!ch, slots: [] };
}

function kopiya(obj) {
    return JSON.parse(JSON.stringify(obj));
}

// Гарантує, що в кожній групі є порожня активність у кінці
function normalizuvaty(grupy) {
    grupy.forEach(function (g) {
        if (g.slots.length === 0 || g.slots[g.slots.length - 1].mistce) {
            g.slots.push({ mistce: null });
        }
    });
}