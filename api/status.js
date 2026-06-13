const getArray = (data, keys) => {
  for (const key of keys) {
    if (Array.isArray(data?.[key])) return data[key];
  }

  if (Array.isArray(data)) return data;

  return [];
};

const getValue = (...values) => {
  return values.find(
    (value) => value !== undefined && value !== null && value !== ""
  ) ?? "-";
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
        error: "Environment variables eksik.",
        envCheck: {
          OPENVPN_CLOUD_ID: Boolean(cloudId),
          OPENVPN_CLIENT_ID: Boolean(clientId),
          OPENVPN_CLIENT_SECRET: Boolean(clientSecret)
        }
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
      return res.status(tokenResponse.status).json({
        error: "OpenVPN OAuth token alınamadı.",
        status: tokenResponse.status,
        details: await tokenResponse.text()
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

    const devicesUrl = `${baseUrl}/api/v1/devices`;

    const devicesResponse = await fetch(devicesUrl, {
      headers: {
        Authorization: `Bearer ${accessToken}`
      }
    });

    if (!devicesResponse.ok) {
      return res.status(devicesResponse.status).json({
        error: "OpenVPN devices verisi alınamadı.",
        status: devicesResponse.status,
        details: await devicesResponse.text()
      });
    }

    const devicesData = await devicesResponse.json();

    const devices = getArray(devicesData, [
      "devices",
      "items",
      "content",
      "data",
      "results"
    ]);

    const normalizedDevices = devices.map((device) => {
      const name = getValue(device.name, device.deviceName);
      const status = getValue(
        device.connectionStatus,
        device.status,
        device.state
      );

      return {
        id: getValue(device.id, device.deviceId),
        name,
        type: getValue(device.osType, device.platform, device.type, "Device"),
        status: normalizeStatus(status),
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
      devices: normalizedDevices,
      debug: {
        deviceCountFromApi: devices.length
      }
    });
  } catch (error) {
    return res.status(500).json({
      error: "Beklenmeyen sunucu hatası.",
      details: error.message
    });
  }
};