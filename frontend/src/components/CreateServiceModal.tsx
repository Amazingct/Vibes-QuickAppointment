import React, { useEffect, useState } from 'react';
import { apiService } from '../services/api';
import type { ServiceCategory } from '../types/service';
import { SERVICE_CATEGORIES } from '../types/service';

interface CreateServiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated: () => void;
}

const durations = [30, 45, 60, 120] as const;

const CreateServiceModal: React.FC<CreateServiceModalProps> = ({ isOpen, onClose, onCreated }) => {
  const [name, setName] = useState('');
  const [duration, setDuration] = useState<number>(60);
  const [price, setPrice] = useState<string>('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<ServiceCategory | ''>('');
  const [isActive, setIsActive] = useState(true);
  const [files, setFiles] = useState<File[]>([]);
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  if (!isOpen) return null;

  const canSubmit = name.trim() && price && duration && !isUploading && !isSubmitting;

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(e.target.files || []);
    setFiles(selected);
  };

  const handleUpload = async () => {
    if (!files.length) return;
    try {
      setIsUploading(true);
      setError(null);
      const resp = await apiService.uploadServiceImages(files.length > 1 ? files : files[0]);
      const urls = resp.data.urls || (resp.data.url ? [resp.data.url] : []);
      setImageUrls(urls);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Upload failed');
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    try {
      setIsSubmitting(true);
      setError(null);
      await apiService.createService({
        name: name.trim(),
        duration_minutes: duration,
        price: Number(price),
        description: description || undefined,
        is_active: isActive,
        images: imageUrls,
        category: category || undefined,
      });
      onCreated();
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Create failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black bg-opacity-50" onClick={onClose} />
      <div className="relative bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold">Create Service</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600" aria-label="Close">×</button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {error && <div className="p-2 bg-red-50 text-red-700 rounded border border-red-200 text-sm">{error}</div>}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
            <input value={name} onChange={(e) => setName(e.target.value)} className="w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500" placeholder="e.g., Website Design" required />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Duration (minutes)</label>
              <select value={duration} onChange={(e) => setDuration(Number(e.target.value))} className="w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500">
                {durations.map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Price (USD)</label>
              <input type="number" min="0" step="0.01" value={price} onChange={(e) => setPrice(e.target.value)} className="w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500" placeholder="150.00" required />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
            <select value={category} onChange={(e) => setCategory(e.target.value as ServiceCategory | '')} className="w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500">
              <option value="">Select category</option>
              {SERVICE_CATEGORIES.filter(c => c !== 'All Categories').map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={4} className="w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500" placeholder="Describe your service..." />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Images</label>
            <input type="file" multiple onChange={onFileChange} className="block w-full text-sm text-gray-900" />
            <div className="mt-2 flex items-center gap-2">
              <button type="button" onClick={handleUpload} disabled={!files.length || isUploading} className="px-3 py-1.5 rounded bg-gray-800 text-white text-sm disabled:opacity-50">{isUploading ? 'Uploading...' : 'Upload'}</button>
              {!!imageUrls.length && <span className="text-xs text-gray-600">{imageUrls.length} uploaded</span>}
            </div>
            {!!imageUrls.length && (
              <div className="mt-3 grid grid-cols-4 gap-2">
                {imageUrls.map((url) => (
                  <img key={url} src={url} alt="uploaded" className="w-full h-20 object-cover rounded" />
                ))}
              </div>
            )}
          </div>

          <div className="flex items-center">
            <input id="isActive" type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} className="mr-2" />
            <label htmlFor="isActive" className="text-sm text-gray-700">Active</label>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t">
            <button type="button" onClick={onClose} className="px-4 py-2 rounded border text-sm">Cancel</button>
            <button type="submit" disabled={!canSubmit} className="px-4 py-2 rounded bg-blue-600 text-white text-sm disabled:opacity-50">{isSubmitting ? 'Creating...' : 'Create Service'}</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateServiceModal;


