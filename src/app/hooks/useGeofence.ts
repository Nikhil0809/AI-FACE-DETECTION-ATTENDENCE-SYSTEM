import { useState, useEffect, useCallback } from 'react';

// ── Vignan's Institute of Information Technology (VIIT), Duvvada, Visakhapatnam ──
export const CAMPUS_COORDS = {
    lat: 17.7104743,  // 17.7104743° N  (Vadlapudi, Duvvada, Gajuwaka, Vizag)
    lng: 83.1659175,  // 83.1659175° E
    radiusMeters: 1000,  // 1 km radius around campus
};

export type GeofenceStatus = 'checking' | 'inside' | 'outside' | 'denied' | 'unavailable';

export interface GeofenceResult {
    status: GeofenceStatus;
    distance?: number;   // metres from campus centre
    coords?: { lat: number; lng: number };
    error?: string;
}

function haversineDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const R = 6371000; // earth radius in metres
    const toRad = (d: number) => d * Math.PI / 180;
    const dLat = toRad(lat2 - lat1);
    const dLng = toRad(lng2 - lng1);
    const a =
        Math.sin(dLat / 2) ** 2 +
        Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function useGeofence(enabled = true): GeofenceResult {
    const [result, setResult] = useState<GeofenceResult>({ status: 'checking' });

    const check = useCallback(() => {
        if (!enabled) { setResult({ status: 'inside' }); return; } // bypass for dev
        if (!navigator.geolocation) {
            setResult({ status: 'unavailable', error: 'Geolocation not supported' });
            return;
        }
        setResult({ status: 'checking' });
        navigator.geolocation.getCurrentPosition(
            (pos) => {
                const { latitude: lat, longitude: lng } = pos.coords;
                const dist = haversineDistance(lat, lng, CAMPUS_COORDS.lat, CAMPUS_COORDS.lng);
                setResult({
                    status: dist <= CAMPUS_COORDS.radiusMeters ? 'inside' : 'outside',
                    distance: Math.round(dist),
                    coords: { lat, lng },
                });
            },
            (err) => {
                if (err.code === 1) setResult({ status: 'denied', error: 'Location permission denied' });
                else setResult({ status: 'unavailable', error: err.message });
            },
            { enableHighAccuracy: true, timeout: 8000, maximumAge: 60000 }
        );
    }, [enabled]);

    useEffect(() => { check(); }, [check]);

    return result;
}
