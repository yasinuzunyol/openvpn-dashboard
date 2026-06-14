const KULLANICI_ADI = "admin";
const API_ENDPOINT = "/.netlify/functions/status";

const lastUpdated = document.getElementById("last-updated");
const onlineUsers = document.getElementById("online-users");
const onlineDevices = document.getElementById("online-devices");
const deviceTableBody = document.getElementById("device-table-body");
const reportedTableBody = document.getElementById("reported-table-body");
const loginOverlay = document.getElementById("login-overlay");
const loginForm = document.getElementById("login-form");
const dashboardContent = document.getElementById("dashboard-content");
const profileContent = document.getElementById("profile-content");
const reportsContent = document.getElementById("reports-content"); // Yeni Karantina Sayfası
const exportBtn = document.getElementById("export-csv");
const themeBtn = document.getElementById("theme-toggle");
const langSelect = document.getElementById("language-select");
const profileBtn = document.getElementById("profile-btn");
const profileDropdown = document.getElementById("profile-dropdown");
const logoutBtn = document.getElementById("logout-btn");
const settingsBtn = document.getElementById("settings-btn");
const backToDashBtn = document.getElementById("back-to-dash");
const backToDashFromReportsBtn = document.getElementById("back-to-dash-from-reports");
const reportsNavBtn = document.getElementById("reports-nav-btn"); // Menüdeki Karantina Butonu
const profileEditForm = document.getElementById("profile-edit-form");
const profileMsg = document.getElementById("profile-msg");

let currentDevicesData = [];
let fetchInterval;

const translations = {
  tr: {
    loginTitle: "Sisteme Giriş", loginDesc: "NOC Paneline erişmek için yetkilendirme gereklidir.",
    username: "Kullanıcı Adı", password: "Şifre", loginBtn: "Giriş Yap",
    headerTitle: "CloudConnexa Ağ İzleme Paneli", headerSub: "Kurumsal VPN Altyapısı Canlı Takip Sistemi",
    profName: "Yönetici Paneli", profRole: "Sistem Yöneticisi", btnLogout: "🚪 Çıkış Yap", btnSettings: "⚙️ Profil Ayarları",
    card1Title: "Aktif Kullanıcı", card2Title: "Aktif Bağlantı / Cihaz", card3Title: "VPN Altyapısı",
    tableTitle: "Canlı İstemci Matrisi", liveIndicator: "● Canlı Veri Akışı", exportBtn: "⬇ Rapor İndir (CSV)",
    thDevice: "İSTEMCİ TANIMI", thOs: "İŞLETİM SİSTEMİ", thStatus: "BAĞLANTI DURUMU", thNetwork: "AĞ DETAYLARI", thAction: "İŞLEM",
    loading: "Canlı veri akışı senkronize ediliyor...", footerText: "Ağ Operasyonları Merkezi (NOC)",
    btnBack: "⬅ Geri Dön", profPageTitle: "Profil ve Güvenlik Ayarları", emailLabel: "E-posta Adresi", 
    passwordTitle: "Şifre Değiştir", oldPassLabel: "Mevcut Şifre (Zorunlu)", newPassLabel: "Yeni Şifre", btnSave: "Değişiklikleri Kaydet",
    errPass: "Mevcut şifre hatalı!", successSave: "Değişiklikler kaydedildi!", syncText: "Son Güncelleme: ",
    btnReport: "⚠️ Bildir", confirmReport: "{name} adlı cihazı şüpheli olarak güvenlik ekibine bildirmek istiyor musunuz?", successReport: "Cihaz raporlandı ve incelemeye alındı.", statusReported: "İnceleniyor",
    lblTunnelIp: "Tünel IP:", lblRealIp: "Gerçek IP:", lblUser: "Kullanıcı:", lblRegion: "Bölge:", lblData: "Veri (Tx/Rx):", lblUptime: "Süre:",
    btnReports: "⚠️ Karantina", reportsPageTitle: "Karantinadaki Cihazlar", reportsPageSub: "Güvenlik ekiplerince incelenen şüpheli bağlantılar",
    btnRevoke: "♻️ Ağa Geri Al", successRevoke: "Cihaz karantinadan çıkarıldı, ağa güvenli olarak eklendi.", emptyReports: "Karantinada cihaz bulunmamaktadır."
  },
  en: {
    loginTitle: "System Login", loginDesc: "Authorization is required to access the NOC Panel.",
    username: "Username", password: "Password", loginBtn: "Sign In",
    headerTitle: "CloudConnexa Network Dashboard", headerSub: "Corporate VPN Live Monitoring System",
    profName: "Admin Panel", profRole: "System Administrator", btnLogout: "🚪 Sign Out", btnSettings: "⚙️ Profile Settings",
    card1Title: "Active Users", card2Title: "Active Connections / Devices", card3Title: "VPN Infrastructure",
    tableTitle: "Live Client Matrix", liveIndicator: "● Live Data Stream", exportBtn: "⬇ Export Report (CSV)",
    thDevice: "CLIENT DEFINITION", thOs: "OPERATING SYSTEM", thStatus: "CONNECTION STATUS", thNetwork: "NETWORK DETAILS", thAction: "ACTION",
    loading: "Synchronizing live data stream...", footerText: "Network Operations Center (NOC)",
    btnBack: "⬅ Go Back", profPageTitle: "Profile and Security Settings", emailLabel: "Email Address", 
    passwordTitle: "Change Password", oldPassLabel: "Current Password (Required)", newPassLabel: "New Password", btnSave: "Save Changes",
    errPass: "Current password is incorrect!", successSave: "Changes have been saved!", syncText: "Last Update: ",
    btnReport: "⚠️ Report", confirmReport: "Do you want to report {name} as suspicious to the security team?", successReport: "Device reported and is under review.", statusReported: "Under Review",
    lblTunnelIp: "Tunnel IP:", lblRealIp: "Public IP:", lblUser: "User:", lblRegion: "Region:", lblData: "Data (Tx/Rx):", lblUptime: "Uptime:",
    btnReports: "⚠️ Quarantine", reportsPageTitle: "Quarantined Devices", reportsPageSub: "Suspicious connections under review by security teams",
    btnRevoke: "♻️ Restore Access", successRevoke: "Device removed from quarantine and restored to the network.", emptyReports: "No devices in quarantine."
  },
  ar: {
    loginTitle: "تسجيل الدخول", loginDesc: "التفويض مطلوب للوصول إلى لوحة NOC.",
    username: "اسم المستخدم", password: "كلمة المرور", loginBtn: "تسجيل الدخول",
    headerTitle: "لوحة مراقبة شبكة CloudConnexa", headerSub: "نظام التتبع الحي لشبكة VPN",
    profName: "لوحة المسؤول", profRole: "مسؤول النظام", btnLogout: "🚪 تسجيل الخروج", btnSettings: "⚙️ إعدادات الملف الشخصي",
    card1Title: "المستخدمون النشطون", card2Title: "الاتصالات النشطة", card3Title: "البنية التحتية لـ VPN",
    tableTitle: "مصفوفة العملاء المباشرة", liveIndicator: "● تدفق البيانات المباشر", exportBtn: "⬇ تحميل التقرير (CSV)",
    thDevice: "تعريف العميل", thOs: "نظام التشغيل", thStatus: "حالة الاتصال", thNetwork: "تفاصيل الشبكة", thAction: "إجراء",
    loading: "جاري مزامنة تدفق البيانات...", footerText: "مركز عمليات الشبكة (NOC)",
    btnBack: "⬅ العودة", profPageTitle: "إعدادات الملف الشخصي والأمان", emailLabel: "عنوان البريد الإلكتروني", 
    passwordTitle: "تغيير كلمة المرور", oldPassLabel: "كلمة المرور الحالية (مطلوب)", newPassLabel: "كلمة المرور الجديدة", btnSave: "حفظ التغييرات",
    errPass: "كلمة المرور الحالية غير صحيحة!", successSave: "تم حفظ التغييرات!", syncText: "آخر تحديث: ",
    btnReport: "⚠️ إبلاغ", confirmReport: "هل تريد إبلاغ فريق الأمان بأن {name} مشبوه؟", successReport: "تم الإبلاغ عن الجهاز وهو قيد المراجعة.", statusReported: "قيد المراجعة",
    lblTunnelIp: "نفق IP:", lblRealIp: "IP العام:", lblUser: "مستخدم:", lblRegion: "منطقة:", lblData: "بيانات (Tx/Rx):", lblUptime: "مدة:",
    btnReports: "⚠️ الحجر الصحي", reportsPageTitle: "الأجهزة المعزولة", reportsPageSub: "الاتصالات المشبوهة قيد المراجعة",
    btnRevoke: "♻️ استعادة الوصول", successRevoke: "تمت إزالة الجهاز من الحجر الصحي واستعادته إلى الشبكة.", emptyReports: "لا توجد أجهزة في الحجر الصحي."
  },
  fr: {
    loginTitle: "Connexion", loginDesc: "Une autorisation est requise pour accéder au panneau NOC.",
    username: "Nom d'utilisateur", password: "Mot de passe", loginBtn: "Se connecter",
    headerTitle: "Tableau de Bord CloudConnexa", headerSub: "Système de Suivi VPN d'Entreprise",
    profName: "Panneau Admin", profRole: "Administrateur Système", btnLogout: "🚪 Déconnexion", btnSettings: "⚙️ Paramètres du Profil",
    card1Title: "Utilisateurs Actifs", card2Title: "Connexions Actives", card3Title: "Infrastructure VPN",
    tableTitle: "Matrice des Clients en Direct", liveIndicator: "● Flux de Données en Direct", exportBtn: "⬇ Exporter (CSV)",
    thDevice: "DÉFINITION DU CLIENT", thOs: "SYSTÈME D'EXPLOITATION", thStatus: "ÉTAT", thNetwork: "DÉTAILS DU RÉSEAU", thAction: "ACTION",
    loading: "Synchronisation du flux en direct...", footerText: "Centre des Opérations Réseau (NOC)",
    btnBack: "⬅ Retour", profPageTitle: "Paramètres du Profil et de Sécurité", emailLabel: "Adresse e-mail", 
    passwordTitle: "Changer le Mot de Passe", oldPassLabel: "Mot de passe actuel (Requis)", newPassLabel: "Nouveau Mot de Passe", btnSave: "Enregistrer les Modifications",
    errPass: "Le mot de passe actuel est incorrect!", successSave: "Les modifications ont été enregistrées!", syncText: "Dernière mise à jour : ",
    btnReport: "⚠️ Signaler", confirmReport: "Voulez-vous signaler {name} comme suspect à l'équipe de sécurité ?", successReport: "Appareil signalé et en cours d'examen.", statusReported: "En Examen",
    lblTunnelIp: "IP Tunnel:", lblRealIp: "IP Publique:", lblUser: "Utilisateur:", lblRegion: "Région:", lblData: "Données (Tx/Rx):", lblUptime: "Durée:",
    btnReports: "⚠️ Quarantaine", reportsPageTitle: "Appareils en Quarantaine", reportsPageSub: "Connexions suspectes en cours d'examen",
    btnRevoke: "♻️ Restaurer l'accès", successRevoke: "Appareil retiré de la quarantaine et restauré sur le réseau.", emptyReports: "Aucun appareil en quarantaine."
  }
};

function updateLanguage(lang) {
  document.documentElement.lang = lang;
  document.querySelectorAll("[data-i18n]").forEach(el => {
    const key = el.getAttribute("data-i18n");
    if (translations[lang] && translations[lang][key]) {
      el.textContent = translations[lang][key];
    }
  });
  document.body.dir = lang === 'ar' ? 'rtl' : 'ltr';
  
  if(sessionStorage.getItem("noc_authenticated") === "true" && lastUpdated.textContent.includes(":")) {
    const timeStr = lastUpdated.textContent.split(": ").pop();
    lastUpdated.textContent = `${translations[lang].syncText}${timeStr}`;
  }
  if(currentDevicesData.length > 0) {
    renderDevices(currentDevicesData);
    renderReportedDevices(currentDevicesData);
  }
}

langSelect.addEventListener("change", (e) => {
  const selectedLang = e.target.value;
  localStorage.setItem("noc_lang", selectedLang);
  updateLanguage(selectedLang);
});

function applyTheme(isDark) {
  if (isDark) {
    document.body.classList.add("dark-theme");
    document.body.classList.remove("light-theme");
    themeBtn.textContent = "☀️";
  } else {
    document.body.classList.add("light-theme");
    document.body.classList.remove("dark-theme");
    themeBtn.textContent = "🌙";
  }
}

themeBtn.addEventListener("click", () => {
  const isDark = document.body.classList.contains("dark-theme");
  localStorage.setItem("noc_theme", !isDark ? "dark" : "light");
  applyTheme(!isDark);
});

document.addEventListener("DOMContentLoaded", () => {
  const savedLang = localStorage.getItem("noc_lang") || "tr";
  langSelect.value = savedLang;
  updateLanguage(savedLang);

  const savedTheme = localStorage.getItem("noc_theme") || "light";
  applyTheme(savedTheme === "dark");

  if (sessionStorage.getItem("noc_authenticated") === "true") showDashboard();
});

function getSavedPassword() {
  return localStorage.getItem("noc_pass") || "proje123";
}

loginForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const user = document.getElementById("username").value;
  const pass = document.getElementById("password").value;
  
  if (user === KULLANICI_ADI && pass === getSavedPassword()) {
    sessionStorage.setItem("noc_authenticated", "true");
    showDashboard();
  } else {
    document.getElementById("login-error").textContent = "Hatalı giriş. Kullanıcı adı veya şifre yanlış.";
  }
});

function showDashboard() {
  loginOverlay.style.display = "none";
  profileContent.style.display = "none";
  reportsContent.style.display = "none";
  dashboardContent.style.display = "block";
  loadStatus();
  fetchInterval = setInterval(loadStatus, 30000);
}

const formatDeviceType = (type) => type && type.os ? `${type.os} ${type.version || ""}` : (type || "-");

// --- GÜVENLİK EKİBİNE BİLDİRME SİMÜLASYONU ---
window.reportConnection = function(deviceName, btnElement) {
  const lang = document.documentElement.lang || "tr";
  const confirmMsg = translations[lang].confirmReport.replace("{name}", deviceName);
  
  if(confirm(confirmMsg)) {
    const originalText = btnElement.innerHTML;
    btnElement.innerHTML = "⏳ İşleniyor...";
    btnElement.disabled = true;
    
    setTimeout(() => {
      alert(translations[lang].successReport);
      
      // LocalStorage Güncellemesi (Kalıcı Rapor)
      let storedSimData = JSON.parse(localStorage.getItem("noc_device_sim_data")) || {};
      if(storedSimData[deviceName]) {
        storedSimData[deviceName].isReported = true;
        localStorage.setItem("noc_device_sim_data", JSON.stringify(storedSimData));
      }

      currentDevicesData = currentDevicesData.map(d => {
        if(d.name === deviceName) d.status = "Reported";
        return d;
      });
      
      renderDevices(currentDevicesData);
      renderReportedDevices(currentDevicesData);
    }, 1000);
  }
};

// --- KARANTİNADAN ÇIKARMA (İPTAL ETME) SİMÜLASYONU ---
window.revokeReport = function(deviceName, btnElement) {
  const lang = document.documentElement.lang || "tr";
  
  const originalText = btnElement.innerHTML;
  btnElement.innerHTML = "⏳ İşleniyor...";
  btnElement.disabled = true;
  
  setTimeout(() => {
    alert(translations[lang].successRevoke);
    
    // LocalStorage Güncellemesi
    let storedSimData = JSON.parse(localStorage.getItem("noc_device_sim_data")) || {};
    if(storedSimData[deviceName]) {
      storedSimData[deviceName].isReported = false;
      localStorage.setItem("noc_device_sim_data", JSON.stringify(storedSimData));
    }

    currentDevicesData = currentDevicesData.map(d => {
      if(d.name === deviceName) d.status = "Online"; // Ağa geri alındı
      return d;
    });
    
    renderDevices(currentDevicesData);
    renderReportedDevices(currentDevicesData);
  }, 1000);
};


const renderDevices = (devices) => {
  currentDevicesData = devices || [];
  if (currentDevicesData.length === 0) {
    deviceTableBody.innerHTML = `<tr><td colspan="5" data-i18n="loading">Veri bulunamadı.</td></tr>`;
    return;
  }
  
  const lang = document.documentElement.lang || "tr";
  const t = translations[lang];
  
  deviceTableBody.innerHTML = currentDevicesData.map((d) => {
    let badgeClass = "offline";
    let statusText = d.status || "-";
    
    if (d.status === "Online") {
      badgeClass = "online";
    } else if (d.status === "Reported") {
      badgeClass = "reported";
      statusText = t.statusReported;
    }
    
    const disableBtn = (d.status !== "Online") ? "disabled" : "";

    return `
      <tr>
        <td><strong>${d.name || "-"}</strong></td>
        <td>${formatDeviceType(d.type)}</td>
        <td><span class="badge ${badgeClass}">${statusText}</span></td>
        <td>
          <div class="network-details">
            <span><strong>${t.lblTunnelIp}</strong> ${d.tunnelIp || "-"}</span>
            <span><strong>${t.lblRealIp}</strong> ${d.realIp || "-"}</span>
            <span><strong>${t.lblUser}</strong> ${d.user || "-"}</span>
            <span><strong>${t.lblRegion}</strong> ${d.connectedTo || "-"}</span>
            <span><strong>${t.lblData}</strong> ${d.txrx || "-"}</span>
            <span><strong>${t.lblUptime}</strong> ${d.uptime || "-"}</span>
          </div>
        </td>
        <td>
          <button class="btn-report" onclick="reportConnection('${d.name}', this)" ${disableBtn}>
            ${d.status === "Reported" ? "✓ İletildi" : t.btnReport}
          </button>
        </td>
      </tr>
    `;
  }).join("");
};

// Yeni: Karantina Sayfası Tablosunu Çiz
const renderReportedDevices = (devices) => {
  const reportedDevices = devices.filter(d => d.status === "Reported");
  const lang = document.documentElement.lang || "tr";
  const t = translations[lang];

  if (reportedDevices.length === 0) {
    reportedTableBody.innerHTML = `<tr><td colspan="5">${t.emptyReports}</td></tr>`;
    return;
  }

  reportedTableBody.innerHTML = reportedDevices.map((d) => {
    return `
      <tr>
        <td><strong>${d.name || "-"}</strong></td>
        <td>${formatDeviceType(d.type)}</td>
        <td><span class="badge reported">${t.statusReported}</span></td>
        <td>
          <div class="network-details">
            <span><strong>${t.lblRealIp}</strong> ${d.realIp || "-"}</span>
            <span><strong>${t.lblUser}</strong> ${d.user || "-"}</span>
            <span><strong>${t.lblData}</strong> ${d.txrx || "-"}</span>
          </div>
        </td>
        <td>
          <button class="btn-revoke" onclick="revokeReport('${d.name}', this)">
            ${t.btnRevoke}
          </button>
        </td>
      </tr>
    `;
  }).join("");
};

const loadStatus = async () => {
  try {
    const response = await fetch(API_ENDPOINT);
    const data = await response.json();
    onlineUsers.textContent = data.summary.onlineUsers || 0;
    onlineDevices.textContent = `${data.summary.onlineDevices || 0} / ${data.summary.totalDevices || 0}`;
    
    let storedSimData = JSON.parse(localStorage.getItem("noc_device_sim_data")) || {};

    const mergedData = data.devices.map(newDevice => {
      newDevice.user = "IT Uzmanı";
      newDevice.connectedTo = "Bilecik";

      if (!storedSimData[newDevice.name]) {
        storedSimData[newDevice.name] = {
          realIp: `85.105.${Math.floor(Math.random()*255)}.${Math.floor(Math.random()*255)}`,
          tx: parseFloat((Math.random()*2 + 0.1).toFixed(2)),
          rx: parseFloat((Math.random()*1 + 0.05).toFixed(2)),
          uptimeMinutes: Math.floor(Math.random()*300 + 15),
          isReported: false // Karantina durumu
        };
      } else {
        storedSimData[newDevice.name].tx += parseFloat((Math.random() * 0.02).toFixed(2));
        storedSimData[newDevice.name].rx += parseFloat((Math.random() * 0.01).toFixed(2));
        storedSimData[newDevice.name].uptimeMinutes += 0.5;
      }

      const sim = storedSimData[newDevice.name];
      newDevice.realIp = sim.realIp;
      newDevice.txrx = `${sim.tx.toFixed(2)} GB / ${sim.rx.toFixed(2)} GB`;
      
      const hours = Math.floor(sim.uptimeMinutes / 60);
      const mins = Math.floor(sim.uptimeMinutes % 60);
      newDevice.uptime = hours > 0 ? `${hours}s ${mins}dk` : `${mins}dk`;

      // Eğer cihaz localStorage'da karantinaya alınmışsa her sayfayı yenilediğimizde karantinada kalır
      if (sim.isReported) {
        newDevice.status = "Reported";
      }

      return newDevice;
    });

    localStorage.setItem("noc_device_sim_data", JSON.stringify(storedSimData));
    
    renderDevices(mergedData);
    renderReportedDevices(mergedData); // Karantina tablosunu da güncelle
    
    const currentLang = document.documentElement.lang || "tr";
    const syncPrefix = translations[currentLang].syncText;
    lastUpdated.textContent = `${syncPrefix}${new Date().toLocaleTimeString()}`;
  } catch (error) {
    console.error("API Error", error);
  }
};

exportBtn.addEventListener("click", () => {
  if (currentDevicesData.length === 0) {
    alert("Dışa aktarılacak aktif cihaz verisi yok!");
    return;
  }
  
  const lang = document.documentElement.lang || "tr";
  let csvContent = "Device Name,Operating System,Status,Tunnel IP,Real IP,Username,Region,Data(Tx/Rx),Uptime\n";
  
  currentDevicesData.forEach(row => {
    let name = `"${row.name || "-"}"`;
    let os = `"${formatDeviceType(row.type)}"`;
    let status = `"${row.status === 'Reported' ? translations[lang].statusReported : (row.status || '-')}"`;
    let tunnel = `"${row.tunnelIp || "-"}"`;
    let realIp = `"${row.realIp || "-"}"`;
    let user = `"${row.user || "-"}"`;
    let region = `"${row.connectedTo || "-"}"`;
    let txrx = `"${row.txrx || "-"}"`;
    let uptime = `"${row.uptime || "-"}"`;
    
    csvContent += `${name},${os},${status},${tunnel},${realIp},${user},${region},${txrx},${uptime}\n`;
  });

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);
  link.setAttribute("href", url);
  link.setAttribute("download", `NOC_Network_Report_${new Date().toISOString().slice(0,10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
});

// Sayfa Navigasyonları
reportsNavBtn.addEventListener("click", () => {
  dashboardContent.style.display = "none";
  profileContent.style.display = "none";
  reportsContent.style.display = "block";
  renderReportedDevices(currentDevicesData);
});

backToDashFromReportsBtn.addEventListener("click", () => {
  showDashboard();
});

profileBtn.addEventListener("click", (e) => {
  e.stopPropagation(); 
  profileDropdown.classList.toggle("active");
});

document.addEventListener("click", (e) => {
  if (!profileDropdown.contains(e.target) && !profileBtn.contains(e.target)) {
    profileDropdown.classList.remove("active");
  }
});

logoutBtn.addEventListener("click", () => {
  sessionStorage.removeItem("noc_authenticated");
  window.location.reload();
});

settingsBtn.addEventListener("click", () => {
  profileDropdown.classList.remove("active");
  clearInterval(fetchInterval);
  dashboardContent.style.display = "none";
  reportsContent.style.display = "none";
  profileContent.style.display = "block";
  profileMsg.textContent = "";
  
  document.getElementById("edit-email").value = localStorage.getItem("noc_email") || "admin@sistem.com";
  document.getElementById("edit-old-pass").value = "";
  document.getElementById("edit-new-pass").value = "";
});

backToDashBtn.addEventListener("click", () => {
  showDashboard();
});

profileEditForm.addEventListener("submit", (e) => {
  e.preventDefault();
  
  const currentLang = document.documentElement.lang || "tr";
  const oldPass = document.getElementById("edit-old-pass").value;
  const newPass = document.getElementById("edit-new-pass").value;
  const newEmail = document.getElementById("edit-email").value;

  if (oldPass !== getSavedPassword()) {
    profileMsg.style.color = "#ef4444";
    profileMsg.textContent = translations[currentLang].errPass;
    return;
  }

  localStorage.setItem("noc_email", newEmail);
  if (newPass.trim() !== "") {
    localStorage.setItem("noc_pass", newPass);
  }

  profileMsg.style.color = "var(--success)";
  profileMsg.textContent = translations[currentLang].successSave;
  
  if (newPass.trim() !== "") {
    setTimeout(() => {
      sessionStorage.removeItem("noc_authenticated");
      window.location.reload();
    }, 2000);
  }
});
