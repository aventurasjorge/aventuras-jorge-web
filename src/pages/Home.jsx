import { useEffect, useState } from "react";
import { getSchedules } from "../api/schedules";

export default function Home() {
  const [schedules, setSchedules] = useState([]);
  const [status, setStatus] = useState("loading");

  useEffect(() => {
    let cancelled = false;

    getSchedules()
      .then((data) => {
        if (cancelled) return;
        setSchedules(data);
        setStatus("ready");
      })
      .catch((err) => {
        if (cancelled) return;
        console.error("Failed to load schedules:", err);
        setStatus("error");
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <main>
      <h1>Aventuras Jorge</h1>

      {status === "loading" && <p>Loading schedules…</p>}
      {status === "error" && (
        <p>Couldn't load schedules right now. Please try again shortly.</p>
      )}
      {status === "ready" && schedules.length === 0 && (
        <p>No scheduled trips available at the moment.</p>
      )}

      {status === "ready" && schedules.length > 0 && (
        <ul style={{ listStyle: "none", padding: 0 }}>
          {schedules.map((trip) => (
            <li
              key={trip.id}
              style={{
                border: "1px solid #ddd",
                borderRadius: "8px",
                padding: "1rem",
                marginBottom: "0.75rem",
              }}
            >
              <strong>{trip.long_name}</strong>
              <div>
                {new Date(trip.service_date).toLocaleDateString()}
                {trip.trip_short_name ? ` · ${trip.trip_short_name}` : ""}
              </div>
              <div>
                {trip.sales_open
                  ? `${trip.available_seats} of ${trip.total_seats} seats available`
                  : "Sales closed"}
              </div>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}