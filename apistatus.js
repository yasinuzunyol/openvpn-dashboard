const getArray = (data, keys) => {
  for (const key of keys) {
    if (Array.isArray(data?.[key])) return data[key];
  }
  if (Array.isArray(data)) return data;
  return [];
};

const getValue = (...values) => {
  return values.find((value) => value !== undefined && value !== null && value !== "") ?? "-";
};

const normalizeStatus = (value) => {
  const text = String(value || "").toUpperCase();

  if (
    text.includes("ONLINE") ||
    text.includes("ACTIVE") ||
    text.includes("CONNECTED")
  ) {
    return "Online";
  }

  return "Offline";
};

module.exports = async function handler(req, res) {
  try {
    const cloudId = process.env.OPENVPN_CLOUD_ID;
    const clientId = process.env.OPENVPN_CLIENT_ID;
    const clientSecret = process.env.OPENVPN_CLIENT_SECRET;

    if (!cloudId || !clientId || !clientSecret) {
      return res.status(500).json({
        error: "Environment variables eksik. OPENVPN_CLOUD_ID, OPENVPN_CLIENT_ID ve OPENVPN_CLIENT_SECRET kontrol edilmeli."
      });
    }

    const baseUrl = `https://${cloudId}.api.openvpn.com`;

    const tokenUrl =
      `${baseUrl}/api/v1/oauth/token` +
      `?client_id=${encodeURIComponent(clientId)}` +
      `&client_secret=${encodeURIComponent(clientSecret)}` +
      `&grant_type=client_credentials`;

    const tokenResponse = await fetch(tokenUrl, {
      method: "POST"
    });

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      return res.status(tokenResponse.status).json({
        error: "OpenVPN OAuth token alınamadı.",
        details: errorText
      });
    }

    const tokenData = await tokenResponse.json();
    const accessToken = tokenData.access_token || tokenData.accessToken;

    if (!accessToken) {
      return res.status(500).json({
        error: "Access token yanıt içinde bulunamadı.",
        response: tokenData
      });
    }

    const endDate = new Date();
    const startDate = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const sessionsUrl =
      `${baseUrl}/api/v1/sessions` +
      `?startDate=${encodeURIComponent(startDate.toISOString())}` +
      `&endDate=${encodeURIComponent(endDate.toISOString())}` +
      `&size=100` +
      `&status=ACTIVE`;

    const devicesUrl = `${baseUrl}/api/v1/devices`;

    const [sessionsResponse, devicesResponse] = await Promise.all([
      fetch(sessionsUrl, {
        headers: {
          Authorization: `Bearer ${accessToken}`
        }
      }),
      fetch(devicesUrl, {
        headers: {
          Authorization: `Bearer ${accessToken}`
        }
      })
    ]);

    if (!sessionsResponse.ok) {
      const errorText = await sessionsResponse.text();
      return res.status(sessionsResponse.status).json({
        error: "OpenVPN active sessions verisi alınamadı.",
        details: errorText
      });
    }

    if (!devicesResponse.ok) {
      const errorText = await devicesResponse.text();
      return res.status(devicesResponse.status).json({
        error: "OpenVPN devices verisi alınamadı.",
        details: errorText
      });
    }

    const sessionsData = await sessionsResponse.json();
    const devicesData = await devicesResponse.json();

    const sessions = getArray(sessionsData, [
      "sessions",
      "items",
      "content",
      "data",
      "results"
    ]);

    const devices = getArray(devicesData, [
      "devices",
      "items",
      "content",
      "data",
      "results"
    ]);

    const activeSessionKeys = new Set();

    sessions.forEach((session) => {
      const deviceId = getValue(
        session.deviceId,
        session.device?.id,
        session.sourceDeviceId
      );

      const deviceName = getValue(
        session.deviceName,
        session.device?.name,
        session.sourceDeviceName
      );

      if (deviceId !== "-") activeSessionKeys.add(String(deviceId));
      if (deviceName !== "-") activeSessionKeys.add(String(deviceName));
    });

    let normalizedDevices = devices.map((device) => {
      const id = getValue(device.id, device.deviceId);
      const name = getValue(device.name, device.deviceName);
      const rawStatus = getValue(
        device.connectionStatus,
        device.status,
        device.state,
        activeSessionKeys.has(String(id)) || activeSessionKeys.has(String(name))
          ? "ACTIVE"
          : "OFFLINE"
      );

      return {
        id,
        name,
        type: getValue(device.osType, device.platform, device.type, "Device"),
        status: normalizeStatus(rawStatus),
        tunnelIp: getValue(
          device.tunnelIpAddress,
          device.tunnelIPv4,
          device.ipV4Address,
          device.ipv4Address
        ),
        connectedTo: getValue(
          device.connectedTo,
          device.regionName,
          device.vpnRegionName
        ),
        user: getValue(
          device.username,
          device.userName,
          device.user?.username,
          device.user?.email
        )
      };
    });

    if (normalizedDevices.length === 0 && sessions.length > 0) {
      normalizedDevices = sessions.map((session) => ({
        id: getValue(session.deviceId, session.device?.id),
        name: getValue(session.deviceName, session.device?.name, "Aktif cihaz"),
        type: getValue(session.deviceType, session.osType, "Device"),
        status: "Online",
        tunnelIp: getValue(
          session.tunnelIpAddress,
          session.tunnelIPv4,
          session.ipV4Address,
          session.ipv4Address
        ),
        connectedTo: getValue(
          session.regionName,
          session.vpnRegionName,
          session.connectedTo
        ),
        user: getValue(
          session.username,
          session.userName,
          session.user?.email
        )
      }));
    }

    const onlineDevices = normalizedDevices.filter(
      (device) => device.status === "Online"
    ).length;

    const onlineUsers = new Set(
      normalizedDevices
        .filter((device) => device.status === "Online")
        .map((device) => device.user)
        .filter((user) => user && user !== "-")
    ).size;

    return res.status(200).json({
      updatedAt: new Date().toISOString(),
      summary: {
        totalDevices: normalizedDevices.length,
        onlineDevices,
        onlineUsers
      },
      devices: normalizedDevices
    });
  } catch (error) {
    return res.status(500).json({
      error: "Beklenmeyen sunucu hatası.",
      details: error.message
    });
  }
};