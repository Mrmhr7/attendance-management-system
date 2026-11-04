import { useCallback } from 'react';

// Resolves { latitude, longitude, accuracy } from the browser Geolocation API.
export default function useGeolocation() {
  return useCallback(
    () =>
      new Promise((resolve, reject) => {
        if (!navigator.geolocation) return reject(new Error('Geolocation is not supported on this device'));
        navigator.geolocation.getCurrentPosition(
          (pos) =>
            resolve({
              latitude: pos.coords.latitude,
              longitude: pos.coords.longitude,
              accuracy: pos.coords.accuracy,
            }),
          (err) => reject(new Error(err.message || 'Could not get your location. Please allow location access.')),
          { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
        );
      }),
    []
  );
}
