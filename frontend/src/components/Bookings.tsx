import React, { useMemo, useState, useEffect } from 'react';
import { apiService } from '../services/api';
import { useAuth } from '../context/AuthContext';

type BookingStatus = 'pending' | 'accepted' | 'rejected' | 'cancelled' | 'canceled';

interface BookingItem {
  id: number;
  title: string;
  description?: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:MM
  durationMinutes: number;
  customerName: string;
  status: BookingStatus;
  client?: { id: number; username?: string; avatar_url?: string };
  provider?: { id: number; username?: string; avatar_url?: string };
  raw?: any;
}

const daysInMonth = (year: number, monthIndex: number) => new Date(year, monthIndex + 1, 0).getDate();
const getFirstDayOfMonth = (year: number, monthIndex: number) => new Date(year, monthIndex, 1).getDay();
const pad2 = (n: number) => String(n).padStart(2, '0');
const formatDate = (y: number, m: number, d: number) => `${y}-${pad2(m + 1)}-${pad2(d)}`;

const statusBadge: Record<BookingStatus, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  accepted: 'bg-green-100 text-green-800',
  rejected: 'bg-red-100 text-red-800',
  cancelled: 'bg-gray-100 text-gray-800',
  canceled: 'bg-gray-100 text-gray-800'
};

const Bookings: React.FC = () => {
  const { user } = useAuth();
  const today = new Date();
  const [year, setYear] = useState<number>(today.getFullYear());
  const [monthIndex, setMonthIndex] = useState<number>(today.getMonth());
  const [selected, setSelected] = useState<BookingItem | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const [bookings, setBookings] = useState<BookingItem[]>([]);

  // Fetch bookings for provider role (current user is provider)
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        if (user && user.is_verified === false) { setBookings([]); return; }
        const { data } = await apiService.listBookings({ role: 'provider', page: 1, per_page: 200 });
        const items: BookingItem[] = (data.bookings || []).map((b: any) => {
          const dt = new Date(b.time_booked);
          const y = dt.getUTCFullYear();
          const m = dt.getUTCMonth();
          const d = dt.getUTCDate();
          const hh = pad2(dt.getUTCHours());
          const mm = pad2(dt.getUTCMinutes());
          return {
            id: b.id,
            title: b.service?.name || 'Booking',
            description: '',
            date: formatDate(y, m, d),
            time: `${hh}:${mm}`,
            durationMinutes: 60,
            customerName: b.client?.username || `Client #${b.client?.id ?? ''}`,
            status: (b.status || 'pending') as BookingStatus,
            client: b.client,
            provider: b.provider,
            raw: b,
          };
        });
        setBookings(items);
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to load bookings');
        setBookings([]);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [user?.is_verified]);

  const days = daysInMonth(year, monthIndex);
  const firstWeekday = getFirstDayOfMonth(year, monthIndex);
  const calendarCells = firstWeekday + days;
  const weeks = Math.ceil(calendarCells / 7);

  const byDate = useMemo(() => {
    const map: Record<string, BookingItem[]> = {};
    for (const b of bookings) {
      if (!map[b.date]) map[b.date] = [];
      map[b.date].push(b);
    }
    return map;
  }, [bookings]);

  const handlePrevMonth = () => {
    if (monthIndex === 0) { setYear(y => y - 1); setMonthIndex(11); } else { setMonthIndex(m => m - 1); }
  };
  const handleNextMonth = () => {
    if (monthIndex === 11) { setYear(y => y + 1); setMonthIndex(0); } else { setMonthIndex(m => m + 1); }
  };

  const monthNames = ['January','February','March','April','May','June','July','August','September','October','November','December'];

  const changeStatusLocal = (id: number, status: BookingStatus) => {
    setBookings(prev => prev.map(b => b.id === id ? { ...b, status } : b));
    if (selected?.id === id) setSelected({ ...selected, status });
  };

  const handleReject = async (id: number) => {
    try { await apiService.updateBooking(id, { status: 'rejected' }); changeStatusLocal(id, 'rejected'); } catch {}
  };
  const handleAccept = async (id: number) => {
    try { await apiService.updateBooking(id, { status: 'accepted' }); changeStatusLocal(id, 'accepted'); } catch {}
  };
  const handleCancel = async (id: number) => {
    try { await apiService.updateBooking(id, { status: 'cancelled' }); changeStatusLocal(id, 'cancelled'); } catch {}
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">My Bookings</h1>
            <p className="text-gray-600">View and manage your upcoming bookings</p>
          </div>
          <div className="flex items-center space-x-3">
            <button onClick={handlePrevMonth} className="px-3 py-2 bg-white border border-gray-200 rounded hover:bg-gray-50">Prev</button>
            <div className="font-medium text-gray-800 w-40 text-center">{monthNames[monthIndex]} {year}</div>
            <button onClick={handleNextMonth} className="px-3 py-2 bg-white border border-gray-200 rounded hover:bg-gray-50">Next</button>
          </div>
        </div>

        {error && (
          <div className="mb-4 text-sm text-red-600">{error}</div>
        )}

        {/* Calendar */}
        <div className="bg-white rounded-lg shadow">
          <div className="grid grid-cols-7 text-center text-sm font-medium text-gray-600 border-b">
            {['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map(d => (
              <div key={d} className="py-3">{d}</div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-px bg-gray-200">
            {Array.from({ length: weeks * 7 }).map((_, idx) => {
              const dayNum = idx - firstWeekday + 1;
              const inMonth = dayNum >= 1 && dayNum <= days;
              const dateStr = inMonth ? formatDate(year, monthIndex, dayNum) : '';
              const dayBookings = inMonth ? (byDate[dateStr] || []) : [];
              return (
                <div key={idx} className={`bg-white min-h-[110px] p-2 ${inMonth ? '' : 'bg-gray-50 text-gray-400'}`}>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-xs text-gray-500">{inMonth ? dayNum : ''}</span>
                    {dayBookings.length > 0 && (
                      <span className="text-[10px] bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full">
                        {dayBookings.length} booking{dayBookings.length > 1 ? 's' : ''}
                      </span>
                    )}
                  </div>
                  <div className="space-y-1">
                    {dayBookings.map((b) => (
                      <button
                        key={b.id}
                        onClick={() => setSelected(b)}
                        className={`w-full text-left text-xs px-2 py-1 rounded border ${statusBadge[b.status]} hover:opacity-90`}
                        title={`${b.title} • ${b.time}`}
                      >
                        <div className="truncate font-medium">{b.time} • {b.title}</div>
                        <div className="truncate text-[10px] opacity-80">{b.customerName}</div>
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Legend */}
        <div className="mt-4 flex flex-wrap items-center gap-3 text-sm text-gray-600">
          <span className={`px-2 py-0.5 rounded ${statusBadge['pending']}`}>Pending</span>
          <span className={`px-2 py-0.5 rounded ${statusBadge['accepted']}`}>Accepted</span>
          <span className={`px-2 py-0.5 rounded ${statusBadge['rejected']}`}>Rejected</span>
          <span className={`px-2 py-0.5 rounded ${statusBadge['cancelled']}`}>Cancelled</span>
        </div>
      </div>

      {/* Modal */}
      {selected && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">{selected.title}</h3>
                <p className="text-sm text-gray-500">{selected.date} • {selected.time} • {selected.durationMinutes} mins</p>
              </div>
              <button onClick={() => setSelected(null)} className="text-gray-400 hover:text-gray-600">✕</button>
            </div>
            <div className="space-y-2 mb-4 text-sm text-gray-700">
              <div><span className="font-medium">Client:</span> {selected.raw?.client?.full_name || selected.client?.username || selected.customerName}</div>
              {selected.raw?.client?.username && (
                <div><span className="font-medium">Username:</span> {selected.raw.client.username}</div>
              )}
              {selected.raw?.client?.email && (
                <div><span className="font-medium">Email:</span> {selected.raw.client.email}</div>
              )}
              <div>
                <span className="font-medium">Status:</span> <span className={`inline-block px-2 py-0.5 rounded text-xs ${statusBadge[selected.status]}`}>{String(selected.status).toUpperCase()}</span>
              </div>
            </div>
            <div className="flex items-center justify-end gap-2">
              {selected.status === 'pending' && (
                <>
                  <button onClick={() => handleReject(selected.id)} className="px-4 py-2 rounded border border-red-300 text-red-700 hover:bg-red-50">Reject</button>
                  <button onClick={() => handleAccept(selected.id)} className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700">Accept</button>
                </>
              )}
              {selected.status === 'accepted' && (
                <button onClick={() => handleCancel(selected.id)} className="px-4 py-2 rounded border border-gray-300 text-gray-700 hover:bg-gray-50">Cancel</button>
              )}
              {(selected.status === 'rejected' || selected.status === 'cancelled' || selected.status === 'canceled') && (
                <button onClick={() => handleAccept(selected.id)} className="px-4 py-2 rounded bg-green-600 text-white hover:bg-green-700">Accept</button>
              )}
              <button onClick={() => setSelected(null)} className="px-4 py-2 rounded border border-gray-300 text-gray-700 hover:bg-gray-50">Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Bookings;


