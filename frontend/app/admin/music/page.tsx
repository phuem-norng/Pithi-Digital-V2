'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Music, Pencil, Plus, Trash2, Upload } from 'lucide-react';
import { apiClient, type MusicTrack } from '@/lib/api-client';
import { useAuth } from '@/lib/auth-context';
import { AdminSidebar } from '@/components/admin-sidebar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { MessageCard } from '@/components/ui/message-card';

export default function AdminMusicPage() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();

  const [tracks, setTracks] = useState<MusicTrack[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Add form
  const [showAdd, setShowAdd] = useState(false);
  const [addName, setAddName] = useState('');
  const [addFile, setAddFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const feedbackRef = useRef<HTMLDivElement | null>(null);

  // Edit
  const [editId, setEditId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');

  // Delete confirm
  const [deleteId, setDeleteId] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && user?.role !== 'ADMIN') {
      router.push('/dashboard');
    }
  }, [authLoading, user, router]);

  useEffect(() => {
    if (user?.role === 'ADMIN') loadTracks();
  }, [user]);

  useEffect(() => {
    if (!error && !success) {
      return;
    }
    feedbackRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, [error, success]);

  async function loadTracks() {
    try {
      setIsLoading(true);
      setTracks(await apiClient.getMusic());
    } catch {
      setError('Failed to load music');
    } finally {
      setIsLoading(false);
    }
  }

  async function handleAdd() {
    if (!addName.trim() || !addFile) {
      setError('Please enter a name and select an audio file.');
      return;
    }
    try {
      setIsUploading(true);
      setError('');
      const url = await apiClient.uploadFile(addFile);
      const track = await apiClient.createMusic(addName.trim(), url);
      setTracks((prev) => [...prev, track]);
      setAddName('');
      setAddFile(null);
      setShowAdd(false);
      setSuccess('Music added successfully!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (e: any) {
      setError(e?.response?.data?.message || 'Upload failed');
    } finally {
      setIsUploading(false);
    }
  }

  async function handleEditSave(id: string) {
    if (!editName.trim()) return;
    try {
      const updated = await apiClient.updateMusic(id, { name: editName.trim() });
      setTracks((prev) => prev.map((t) => (t.id === id ? updated : t)));
      setEditId(null);
      setSuccess('Name updated!');
      setTimeout(() => setSuccess(''), 3000);
    } catch {
      setError('Failed to update');
    }
  }

  async function handleDelete(id: string) {
    try {
      await apiClient.deleteMusic(id);
      setTracks((prev) => prev.filter((t) => t.id !== id));
      setDeleteId(null);
      setSuccess('Deleted successfully!');
      setTimeout(() => setSuccess(''), 3000);
    } catch {
      setError('Failed to delete');
    }
  }

  const handleNavigate = (menu: string) => {
    const routes: Record<string, string> = {
      dashboard: '/admin/dashboard',
      'create-event': '/admin/events',
      'all-guests': '/admin/guests',
      users: '/admin/users',
      music: '/admin/music',
      analytics: '/admin/analytics',
      settings: '/admin/settings',
      profile: '/admin/profile',
    };
    if (routes[menu]) router.push(routes[menu]);
  };

  if (authLoading || user?.role !== 'ADMIN') return null;

  return (
    <div className="flex min-h-screen bg-gray-50 font-khmer-body">
      <AdminSidebar
        userName={user.name}
        role={user.role}
        avatarUrl={user.avatarUrl}
        activeItem="music"
        onSelect={handleNavigate as any}
        recentEvents={[]}
      />

      <main className="flex-1 p-8">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="font-khmer-heading text-2xl text-gray-900">តន្ត្រី — Music Library</h1>
            <p className="mt-1 text-sm text-gray-500">គ្រប់គ្រងបទតន្ត្រីសម្រាប់ធៀបអញ្ជើញ</p>
          </div>
          <Button
            onClick={() => { setShowAdd(true); setError(''); }}
            className="gap-2 bg-amber-600 text-white hover:bg-amber-700"
          >
            <Plus className="h-4 w-4" />
            បន្ថែមបទថ្មី
          </Button>
        </div>

        {(error || success) && (
          <div ref={feedbackRef} className="mb-4 space-y-3">
            {error && <MessageCard text={error} tone="error" onClose={() => setError('')} className="p-3" />}
            {success && (
              <MessageCard text={success} tone="success" onClose={() => setSuccess('')} className="p-3" />
            )}
          </div>
        )}

        {/* Add new track form */}
        {showAdd && (
          <div className="mb-6 rounded-2xl border border-amber-100 bg-white p-6 shadow-sm">
            <h2 className="mb-4 font-semibold text-gray-900">បន្ថែមបទតន្ត្រីថ្មី</h2>
            <div className="space-y-3">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">ឈ្មោះបទ</label>
                <Input
                  value={addName}
                  onChange={(e) => setAddName(e.target.value)}
                  placeholder="e.g. Classic Wedding"
                  className="max-w-sm"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">ឯកសារអូឌីយ៉ូ (MP3)</label>
                <div
                  className="flex max-w-sm cursor-pointer items-center gap-3 rounded-xl border-2 border-dashed border-amber-200 bg-amber-50 px-4 py-3 hover:border-amber-400"
                  onClick={() => fileRef.current?.click()}
                >
                  <Upload className="h-5 w-5 text-amber-600" />
                  <span className="text-sm text-gray-600">
                    {addFile ? addFile.name : 'ចុចដើម្បីជ្រើសរើសឯកសារ'}
                  </span>
                </div>
                <input
                  ref={fileRef}
                  type="file"
                  accept="audio/*"
                  className="hidden"
                  onChange={(e) => setAddFile(e.target.files?.[0] || null)}
                />
              </div>
              {addFile && (
                <audio controls src={URL.createObjectURL(addFile)} className="mt-2 w-full max-w-sm" />
              )}
              <div className="flex gap-2 pt-2">
                <Button
                  onClick={handleAdd}
                  disabled={isUploading}
                  className="bg-amber-600 text-white hover:bg-amber-700"
                >
                  {isUploading ? 'កំពុង Upload...' : 'រក្សាទុក'}
                </Button>
                <Button variant="outline" onClick={() => { setShowAdd(false); setAddName(''); setAddFile(null); }}>
                  បោះបង់
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Track list */}
        {isLoading ? (
          <div className="text-center py-12 text-gray-500">កំពុងផ្ទុក...</div>
        ) : tracks.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-gray-200 bg-white py-16 text-center">
            <Music className="mx-auto h-12 w-12 text-gray-300" />
            <p className="mt-3 text-gray-500">មិនទាន់មានបទតន្ត្រីទេ</p>
          </div>
        ) : (
          <div className="space-y-3">
            {tracks.map((track) => (
              <div
                key={track.id}
                className="flex items-center gap-4 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amber-100">
                  <Music className="h-5 w-5 text-amber-600" />
                </div>

                <div className="flex-1 min-w-0">
                  {editId === track.id ? (
                    <div className="flex items-center gap-2">
                      <Input
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="h-8 max-w-xs text-sm"
                        autoFocus
                        onKeyDown={(e) => { if (e.key === 'Enter') handleEditSave(track.id); if (e.key === 'Escape') setEditId(null); }}
                      />
                      <Button size="sm" onClick={() => handleEditSave(track.id)} className="bg-green-600 text-white hover:bg-green-700 h-8">
                        រក្សាទុក
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => setEditId(null)} className="h-8">
                        បោះបង់
                      </Button>
                    </div>
                  ) : (
                    <p className="font-medium text-gray-900 truncate">{track.name}</p>
                  )}
                  <audio controls src={track.url} className="mt-2 h-8 w-full max-w-md" />
                </div>

                <div className="flex shrink-0 items-center gap-2">
                  <button
                    type="button"
                    onClick={() => { setEditId(track.id); setEditName(track.name); }}
                    className="rounded-full p-2 text-gray-400 hover:bg-gray-100 hover:text-amber-600"
                    title="Edit name"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeleteId(track.id)}
                    className="rounded-full p-2 text-gray-400 hover:bg-red-50 hover:text-red-600"
                    title="Delete"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Delete confirm modal */}
        {deleteId && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
            <div className="rounded-2xl bg-white p-6 shadow-xl w-80">
              <h3 className="font-semibold text-gray-900 mb-2">លុបបទតន្ត្រី?</h3>
              <p className="text-sm text-gray-500 mb-4">បទនេះនឹងត្រូវលុបចេញពី Library។ ធៀបដែលប្រើបទនេះនឹងបាត់បទ។</p>
              <div className="flex gap-2">
                <Button onClick={() => handleDelete(deleteId)} className="flex-1 bg-red-600 text-white hover:bg-red-700">
                  លុប
                </Button>
                <Button variant="outline" onClick={() => setDeleteId(null)} className="flex-1">
                  បោះបង់
                </Button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
