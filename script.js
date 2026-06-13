const KULLANICI_ADI = "admin";
const SIFRE = "proje123";

const API_ENDPOINT = "/.netlify/functions/status";

// DOM Elementleri
const lastUpdated = document.getElementById("last-updated");
const onlineUsers = document.getElementById("online-users");
const onlineDevices = document.getElementById("online-devices");
const deviceTableBody = document.getElementById("device-table-body");

const loginOverlay = document.getElementById("login-overlay");
const loginForm = document.getElementById("login-form");
const loginError = document.getElementById("login-error");
const dashboardContent = document.getElementById("dashboard-content");

// Uygulama Başlangıcı ve Oturum Kontrolü
document.addEventListener("DOMContentLoaded", () => {
  const isAuthenticated = sessionStorage.getItem("noc_authenticated");

  if (isAuthenticated === "true") {
    // Daha önce giriş yapılmışsa paneli aç ve veriyi çek
    showDashboard();
  }
});

// Giriş Formu Dinleyicisi
loginForm.addEventListener("submit", (e) => {
  e.preventDefault();
  
  const user = document.getElementById("username").value;
  const pass = document.getElementById("password").value;

  if (user === KULLANICI_ADI && pass === SIFRE) {
    sessionStorage.setItem("noc_authenticated", "true");
    showDashboard();
  } else {
    loginError.textContent = "Hatalı kullanıcı adı veya şifre. Lütfen tekrar deneyin.";
  }
});

function showDashboard() {
  loginOverlay.style.display = "none";
  dashboardContent.style.display = "block";
  loadStatus();
  setInterval(loadStatus, 30000);
}

// Formatlama Fonksiyonları
const formatDeviceType = (type) => {
  if (!type) return "-";
  if (typeof type === "string") return type;
  if (typeof type === "object") {
    const os = type.os || "Device";
    const version = type.version ? ` ${type.version}` : "";
    return `${os}${version}`;
  }
  return "-";
};

const escapeHtml = (value) => {
  return String(value ?? "-")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
};

// Tabloyu Ekrana Basma
const renderDevices = (devices) => {
  if (!devices || devices.length === 0) {
    deviceTableBody.innerHTML = `<tr><td colspan="4">Cihaz verisi bulunamadı.</td></tr>`;
    return;
  }

  deviceTableBody.innerHTML = devices.map((device) => {
    const isOnline = device.status === "Online";
    const badgeClass = isOnline ? "online" : "offline";

    return `
      <tr>
        <td>${escapeHtml(device.name)}</td>
        <td>${escapeHtml(formatDeviceType(device.type))}</td>
        <td><span class="badge ${badgeClass}">${escapeHtml(device.status)}</span></td>
        <td>
          <strong>Tünel IP:</strong> ${escapeHtml(device.tunnelIp)}<br>
          <strong>Kullanıcı:</strong> ${escapeHtml(device.user)}<br>
          <strong>Bölge:</strong> ${escapeHtml(device.connectedTo)}
        </td>
      </tr>
    `;
  }).join("");
};

const renderError = (message) => {
  onlineUsers.textContent = "Hata";
  onlineDevices.textContent = "Hata";
  deviceTableBody.innerHTML = `<tr><td colspan="4"><div class="error-box">Bağlantı hatası: ${escapeHtml(message)}</div></td></tr>`;
};

// API'den Veri Çekme
const loadStatus = async () => {
  try {
    const response = await fetch(API_ENDPOINT);
    const data = await response.json();

    if (!response.ok) throw new Error(data.error || "API isteği başarısız oldu.");

    onlineUsers.textContent = `${data.summary.onlineUsers || 0}`;
    onlineDevices.textContent = `${data.summary.onlineDevices || 0} / ${data.summary.totalDevices || 0}`;
    
    renderDevices(data.devices);

    const updatedDate = new Date(data.updatedAt);
    lastUpdated.textContent = `Son senkronizasyon: ${updatedDate.toLocaleTimeString("tr-TR")}`;
  } catch (error) {
    renderError(error.message);
  }
};