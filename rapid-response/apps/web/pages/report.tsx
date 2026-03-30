import { NextPage } from 'next';
import dynamic from 'next/dynamic';
import { useState } from 'react';
import axios from 'axios';
import { useRouter } from 'next/router';
import { toast } from 'react-hot-toast';

const MapPicker = dynamic(() => import('../src/components/MapPicker'), {
  ssr: false,
});

const Report: NextPage = () => {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState({
    title: '',
    description: '',
    severity: 3,
    category: '',
    lat: 0,
    lng: 0,
    media: [] as File[],
  });

  const onSelectLocation = (lng: number, lat: number) => {
    setForm({ ...form, lng, lat });
    setStep(1);
  };

  const submit = async () => {
    const data = new FormData();
    Object.entries(form).forEach(([k, v]) => {
      if (k === 'media') {
        form.media.forEach((f) => data.append('media', f));
      } else {
        data.append(k, String(v));
      }
    });

    try {
      await axios.post('/api/incidents', data);
      toast.success('Incident reported!');
      router.push('/');
    } catch (e) {
      toast.error('Failed to report');
    }
  };

  return (
    <div className="p-4 max-w-3xl mx-auto">
      {step === 0 && (
        <div>
          <h2 className="text-2xl mb-4">Pick location on the map</h2>
          <MapPicker onSelect={onSelectLocation} />
        </div>
      )}
      {step === 1 && (
        <div>
          <h2 className="text-2xl mb-4">Incident details</h2>
          <form
            className="space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              submit();
            }}
          >
            <input
              className="w-full p-2 border"
              placeholder="Title"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              required
            />
            <textarea
              className="w-full p-2 border"
              placeholder="Description"
              rows={3}
              value={form.description}
              onChange={(e) =>
                setForm({ ...form, description: e.target.value })
              }
            />
            <select
              className="p-2 border"
              value={form.category}
              onChange={(e) =>
                setForm({ ...form, category: e.target.value })
              }
              required
            >
              <option value="">Category</option>
              <option>FLOOD</option>
              <option>EARTHQUAKE</option>
              <option>FIRE</option>
              <option>PANDEMIC</option>
            </select>
            <label className="block">
              Severity:
              <input
                type="range"
                min={1}
                max={5}
                value={form.severity}
                onChange={(e) =>
                  setForm({ ...form, severity: Number(e.target.value) })
                }
                className="w-full"
              />
            </label>
            <button
              type="submit"
              className="bg-blue-600 text-white px-4 py-2 rounded"
            >
              Submit
            </button>
          </form>
        </div>
      )}
    </div>
  );
};

export default Report;
