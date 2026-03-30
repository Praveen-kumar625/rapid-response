export interface User {
  id: string;
  email: string;
  name?: string;
  role: 'CITIZEN' | 'RESPONDER' | 'ADMIN';
}

export interface Incident {
  id: string;
  title: string;
  description?: string;
  severity: number; // 1‑5
  category: string;
  location: {
    type: 'Point';
    coordinates: [number, number]; // [lng, lat]
  };
  reportedBy: string;
  status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';
  createdAt: string;
  updatedAt: string;
  externalId?: string; // for deduplication from feeds
}

export interface Resource {
  id: string;
  type: 'VEHICLE' | 'SHELTER' | 'MEDICAL' | 'FOOD';
  capacity?: number;
  location: {
    type: 'Point';
    coordinates: [number, number];
  };
  status: 'AVAILABLE' | 'ASSIGNED' | 'UNAVAILABLE';
  currentIncidentId?: string;
}

export interface Media {
  id: string;
  incidentId: string;
  url: string;
  mimeType: string;
}
