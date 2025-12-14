let map;
let currentMarker;
let routeLine;
let watchId;

// 現在地取得 → 地図初期化
navigator.geolocation.getCurrentPosition(
  (pos) => {
    const lat = pos.coords.latitude;
    const lng = pos.coords.longitude;

    map = L.map("map", {
      zoomControl: true
    }).setView([lat, lng], 15);

    // OpenStreetMap
    L.tileLayer(
      "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
      {
        maxZoom: 19,
        attribution: "&copy; OpenStreetMap contributors"
      }
    ).addTo(map);

    // 現在地マーカー
    currentMarker = L.marker([lat, lng]).addTo(map)
      .bindPopup("現在地")
      .openPopup();

    // 地図タップで目的地指定
    map.on("click", (e) => {
      getRoute(
        lat,
        lng,
        e.latlng.lat,
        e.latlng.lng
      );
    });

    // 現在地追従開始
    startWatchPosition();
  },
  (err) => {
    alert("位置情報を取得できません");
    console.error(err);
  },
  {
    enableHighAccuracy: true
  }
);

// 現在地追従
function startWatchPosition() {
  watchId = navigator.geolocation.watchPosition(
    (pos) => {
      const lat = pos.coords.latitude;
      const lng = pos.coords.longitude;

      currentMarker.setLatLng([lat, lng]);
      map.panTo([lat, lng], { animate: true });
    },
    null,
    {
      enableHighAccuracy: true,
      maximumAge: 1000,
      timeout: 10000
    }
  );
}

// OSRMで車ルート取得
async function getRoute(startLat, startLng, endLat, endLng) {
  const url =
    "https://router.project-osrm.org/route/v1/driving/" +
    `${startLng},${startLat};${endLng},${endLat}` +
    "?overview=full&geometries=geojson&steps=false";

  try {
    const res = await fetch(url);
    const data = await res.json();

    if (data.code !== "Ok") {
      alert("ルート取得失敗");
      return;
    }

    const route = data.routes[0];

    // 既存ルート削除
    if (routeLine) {
      map.removeLayer(routeLine);
    }

    // ルート描画
    routeLine = L.geoJSON(route.geometry, {
      style: {
        weight: 6
      }
    }).addTo(map);

    map.fitBounds(routeLine.getBounds());

    // 距離・時間表示
    const distanceKm = (route.distance / 1000).toFixed(1);
    const durationMin = Math.round(route.duration / 60);

    document.getElementById("distance").textContent =
      `距離: ${distanceKm} km`;
    document.getElementById("duration").textContent =
      `時間: ${durationMin} 分`;

  } catch (e) {
    console.error(e);
    alert("通信エラー");
  }
}
