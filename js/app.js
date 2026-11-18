// ===== Перемикання вкладок =====
const vkladky = document.querySelectorAll(".tab");
const paneli = document.querySelectorAll(".panel");

function pokazatyVkladku(id) {
  if (!document.getElementById(id)) id = "papuha";
  paneli.forEach(p => p.classList.toggle("active", p.id === id));
  vkladky.forEach(t => t.classList.toggle("active", t.dataset.tab === id));
}
window.addEventListener("hashchange", () => pokazatyVkladku(location.hash.slice(1)));
pokazatyVkladku(location.hash.slice(1) || "papuha");

// ===== Підтвердження =====
let potvDiyu = null;

function potverdyty(tekst, diya) {
  document.getElementById("potv-tekst").textContent = tekst;
  potvDiyu = diya;
  document.getElementById("potverdzhennya").hidden = false;
}

function zakrytyPotv() {
  potvDiyu = null;
  document.getElementById("potverdzhennya").hidden = true;
}

document.getElementById("potv-ta").addEventListener("click", function () {
  const d = potvDiyu;
  zakrytyPotv();
  if (d) d();
});
document.getElementById("potv-ni").addEventListener("click", zakrytyPotv);