import axios from 'axios';
import { Incident } from '@rapid-response/contracts';

export const fetchIncidents = async (bbox?: string): Promise<Incident[]> => {
  const resp = await axios.get<Incident[]>('/api/incidents', {
    params: { bbox },
  });
  return resp.data;
};

export const fetchIncident = async (id: string): Promise<Incident> => {
  const resp = await axios.get<Incident>(`/api/incidents/${id}`);
  return resp.data;
};
