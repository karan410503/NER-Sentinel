import { useEffect, useRef } from 'react';
import { useAppStore } from '../store';

// Utility to calculate distance between two coordinates in km
function getDistance(lat1: number, lon1: number, lat2: number, lon2: number) {
  const p = 0.017453292519943295;    // Math.PI / 180
  const c = Math.cos;
  const a = 0.5 - c((lat2 - lat1) * p)/2 + 
          c(lat1 * p) * c(lat2 * p) * 
          (1 - c((lon2 - lon1) * p))/2;
  return 12742 * Math.asin(Math.sqrt(a)); // 2 * R; R = 6371 km
}

function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

async function fetchRouteFromOSRM(start: [number, number], end: [number, number]) {
  // OSRM routing API takes lng,lat
  const startStr = `${start[1]},${start[0]}`;
  const endStr = `${end[1]},${end[0]}`;
  const url = `http://router.project-osrm.org/route/v1/driving/${startStr};${endStr}?overview=full&geometries=geojson&alternatives=true`;
  
  try {
    const res = await fetch(url);
    const data = await res.json();
    if (data.code === 'Ok' && data.routes && data.routes.length > 0) {
      // Find the alternative route if multiple are returned
      const route = data.routes.length > 1 ? data.routes[1] : data.routes[0];
      
      // coordinates are returned as [lng, lat], our app expects [lat, lng]
      const coords = route.geometry.coordinates.map((c: any) => [c[1], c[0]]);
      return {
        coords: coords as [number, number][],
        duration: route.duration as number // in seconds
      };
    }
  } catch (error) {
    console.error("Failed to fetch route from OSRM", error);
  }
  return null;
}

export function useVehicleSimulation() {
  const updateVehicle = useAppStore(state => state.updateVehicle);
  // Keep track of which vehicles are currently fetching routes so we don't spam API
  const fetchingRoutes = useRef<Set<string>>(new Set());

  useEffect(() => {
    // 60 fps simulation loop
    let lastTime = performance.now();
    let animationFrameId: number;

    const animate = (time: number) => {
      const deltaTime = (time - lastTime) / 1000; // in seconds
      lastTime = time;

      const timeScale = 600; 
      
      const currentVehicles = useAppStore.getState().vehicles;
      const currentIncidents = useAppStore.getState().incidents;

      currentVehicles.forEach(vehicle => {
        // --- Initialization logic: Fetch real road if not initialized ---
        if (!vehicle.isInitialized) {
          // If we assign a vehicle from backend, it comes with `isInitialized: true`
          // and `currentRoute` populated. For mock vehicles, we just mark them initialized 
          // to skip the old frontend OSRM fetch.
          updateVehicle(vehicle.id, { isInitialized: true });
          return;
        }

        if (!vehicle.isInitialized) return;

        if (vehicle.status === 'STOPPED' || vehicle.status === 'IDLE') return;
        if (vehicle.status === 'REROUTING') return;

        let { currentRoute, targetPointIndex, progress, location, speed, isRerouted } = vehicle;
        
        if (targetPointIndex >= currentRoute.length) {
          targetPointIndex = 1;
          progress = 0;
          location = currentRoute[0];
          isRerouted = false;
        }

        const startPoint = targetPointIndex === 0 ? currentRoute[0] : currentRoute[targetPointIndex - 1];
        const endPoint = currentRoute[targetPointIndex];

        const segmentDist = getDistance(startPoint[0], startPoint[1], endPoint[0], endPoint[1]);
        const speedKmPerSec = (speed / 3600) * timeScale;
        
        let progressIncrement = 0;
        if (segmentDist > 0) {
            progressIncrement = (speedKmPerSec * deltaTime) / segmentDist;
        } else {
            progressIncrement = 1;
        }
        
        progress += progressIncrement;

        if (progress >= 1) {
          progress = 0;
          targetPointIndex++;
          if (targetPointIndex < currentRoute.length) {
            location = currentRoute[targetPointIndex - 1];
          } else {
            location = currentRoute[currentRoute.length - 1];
          }
        } else {
          const lat = startPoint[0] + (endPoint[0] - startPoint[0]) * progress;
          const lng = startPoint[1] + (endPoint[1] - startPoint[1]) * progress;
          location = [lat, lng];
        }

        // Rerouting logic: Check for incidents ahead
        if (!isRerouted && currentIncidents.length > 0) {
          const incidentAhead = currentIncidents.find(inc => {
            if (inc.status !== 'ACTIVE') return false;
            const distToInc = getDistance(location[0], location[1], inc.location[0], inc.location[1]);
            return distToInc < 15;
          });
          if (incidentAhead) {
            // Now the reroute is handled by the backend API and modal in Vehicles.tsx
            // The simulation just stops the vehicle here if there's an incident and we haven't manually rerouted yet.
            // In a fully autonomous system, this would call the API. Here we just halt it to prompt user action.
            updateVehicle(vehicle.id, {
              status: 'REROUTING' // Halts vehicle temporarily
            });
            return;
          }
        }

        updateVehicle(vehicle.id, { location, targetPointIndex, progress });
      });

      animationFrameId = requestAnimationFrame(animate);
    };

    animationFrameId = requestAnimationFrame(animate);

    return () => cancelAnimationFrame(animationFrameId);
  }, []);
}
