import React, { useMemo, useState } from 'react';
import type { Service } from '../types/service';

type BookingStatus = 'pending' | 'accepted';

interface BookedSlot {
  date: string; // YYYY-MM-DD
  time: string; // HH:MM (24h)
  status: BookingStatus;
}

interface BookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  service: Service;
  onConfirm?: (payload: { serviceId: string; date: string; time: string }) => void;
}

const monthNames = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const weekDays = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

const pad2 = (n: number) => String(n).padStart(2, '0');
const formatDate = (y: number, m: number, d: number) => `${y}-${pad2(m + 1)}-${pad2(d)}`;

const daysInMonth = (y: number, m: number) => new Date(y, m + 1, 0).getDate();
const firstWeekdayOfMonth = (y: number, m: number) => new Date(y, m, 1).getDay();

// Deterministic pseudo-random generator based on string seed
function seededRandom(seed: string) {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h += (h << 1) + (h << 4) + (h << 7) + (h << 8) + (h << 24);
  }
  return function() {
    h += 0x6D2B79F5;
    let t = Math.imul(h ^ (h >>> 15), 1 | h);
    t ^= t + Math.imul(t ^ (t >>> 7), 61 | t);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Generate dummy booked slots for the current month per service deterministically
function useDummyBookedSlots(serviceId: string, year: number, monthIndex: number): BookedSlot[] {
  return useMemo(() => {
    const rand = seededRandom(`${serviceId}-${year}-${monthIndex}`);
    const totalDays = daysInMonth(year, monthIndex);
    const possibleTimes = [
      '09:00','09:30','10:00','10:30','11:00','11:30','12:00','12:30',
      '13:00','13:30','14:00','14:30','15:00','15:30','16:00','16:30',
      '17:00','17:30'
    ];
    const result: BookedSlot[] = [];
    // Choose ~6 random days with 1-3 slots booked each
    const bookedDayCount = Math.max(3, Math.floor(rand() * 7));
    const chosenDays = new Set<number>();
    while (chosenDays.size < bookedDayCount) {
      const d = Math.max(1, Math.floor(rand() * totalDays));
      chosenDays.add(d);
    }
    for (const d of chosenDays) {
      const slotsCount = 1 + Math.floor(rand() * 3);
      const chosen = new Set<number>();
      while (chosen.size < slotsCount) {
        chosen.add(Math.floor(rand() * possibleTimes.length));
      }
      for (const idx of chosen) {
        result.push({
          date: formatDate(year, monthIndex, d),
          time: possibleTimes[idx],
          status: rand() > 0.5 ? 'accepted' : 'pending'
        });
      }
    }
    return result;
  }, [serviceId, year, monthIndex]);
}

const BookingModal: React.FC<BookingModalProps> = ({ isOpen, onClose, service, onConfirm }) => {
  const today = new Date();
  const [year, setYear] = useState<number>(today.getFullYear());
  const [monthIndex, setMonthIndex] = useState<number>(today.getMonth());
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedTime, setSelectedTime] = useState<string>('');

  const booked = useDummyBookedSlots(service.id, year, monthIndex);
  const bookedByDate = useMemo(() => {
    const map: Record<string, BookedSlot[]> = {};
    for (const b of booked) {
      if (!map[b.date]) map[b.date] = [];
      map[b.date].push(b);
    }
    return map;
  }, [booked]);

  const totalDays = daysInMonth(year, monthIndex);
  const firstWeekday = firstWeekdayOfMonth(year, monthIndex);
  const calendarCells = Math.ceil((firstWeekday + totalDays) / 7) * 7;

  const times: string[] = useMemo(() => (
    [
      '09:00','09:30','10:00','10:30','11:00','11:30','12:00','12:30',
      '13:00','13:30','14:00','14:30','15:00','15:30','16:00','16:30',
      '17:00','17:30'
    ]
  ), []);

  const bookedTimesForSelected = useMemo(() => {
    if (!selectedDate) return new Set<string>();
    return new Set((bookedByDate[selectedDate] || []).map(b => b.time));
  }, [selectedDate, bookedByDate]);

  const bookedStatusByTime: Record<string, BookingStatus> = useMemo(() => {
    const map: Record<string, BookingStatus> = {};
    if (selectedDate) {
      for (const b of (bookedByDate[selectedDate] || [])) {
        map[b.time] = b.status;
      }
    }
    return map;
  }, [selectedDate, bookedByDate]);

  const resetTimeIfInvalid = (newDate: string) => {
    if (selectedTime && bookedTimesForSelected.has(selectedTime)) {
      setSelectedTime('');
    }
    if (selectedDate !== newDate) {
      setSelectedTime('');
    }
  };

  const handlePrevMonth = () => {
    if (monthIndex === 0) {
      setYear(y => y - 1);
      setMonthIndex(11);
    } else {
      setMonthIndex(m => m - 1);
    }
    setSelectedDate('');
    setSelectedTime('');
  };

  const handleNextMonth = () => {
    if (monthIndex === 11) {
      setYear(y => y + 1);
      setMonthIndex(0);
    } else {
      setMonthIndex(m => m + 1);
    }
    setSelectedDate('');
    setSelectedTime('');
  };

  const confirm = () => {
    if (!selectedDate || !selectedTime) return;
    if (bookedTimesForSelected.has(selectedTime)) return;
    if (onConfirm) {
      onConfirm({ serviceId: service.id, date: selectedDate, time: selectedTime });
    } else {
      alert(`Booked '${service.title}' on ${selectedDate} at ${selectedTime} (dummy)`);
    }
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white rounded-lg shadow-xl w-full max-w-4xl mx-4 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Book: {service.title}</h3>
            <p className="text-sm text-gray-500">Select a date and time. Pending/accepted slots are disabled.</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">✕</button>
        </div>

        {/* Body */}
        <div className="p-4 grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Calendar */}
          <div className="bg-white rounded border">
            <div className="flex items-center justify-between px-3 py-2 border-b">
              <button onClick={handlePrevMonth} className="px-2 py-1 rounded hover:bg-gray-50 border">Prev</button>
              <div className="font-medium text-gray-800">{monthNames[monthIndex]} {year}</div>
              <button onClick={handleNextMonth} className="px-2 py-1 rounded hover:bg-gray-50 border">Next</button>
            </div>
            <div className="grid grid-cols-7 text-center text-xs font-medium text-gray-600 border-b">
              {weekDays.map(d => (<div key={d} className="py-2">{d}</div>))}
            </div>
            <div className="grid grid-cols-7 gap-px bg-gray-200">
              {Array.from({ length: calendarCells }).map((_, idx) => {
                const dayNum = idx - firstWeekday + 1;
                const inMonth = dayNum >= 1 && dayNum <= totalDays;
                const dateStr = inMonth ? formatDate(year, monthIndex, dayNum) : '';
                const dayBooked = inMonth ? (bookedByDate[dateStr] || []) : [];
                const isSelected = selectedDate === dateStr;
                return (
                  <button
                    key={idx}
                    disabled={!inMonth}
                    onClick={() => { if (inMonth) { setSelectedDate(dateStr); resetTimeIfInvalid(dateStr); } }}
                    className={`relative bg-white min-h-[90px] p-2 text-left ${inMonth ? 'hover:bg-gray-50' : 'bg-gray-50 text-gray-400 cursor-not-allowed'} ${isSelected ? 'ring-2 ring-blue-500' : ''}`}
                    title={inMonth ? dateStr : ''}
                  >
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-xs text-gray-600">{inMonth ? dayNum : ''}</span>
                      {dayBooked.length > 0 && (
                        <span className="text-[10px] bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full">
                          {dayBooked.length} booked
                        </span>
                      )}
                    </div>
                    {/* Indicators */}
                    <div className="flex flex-wrap gap-1">
                      {dayBooked.slice(0, 3).map((b, i) => (
                        <span key={i} className={`text-[10px] px-1.5 py-0.5 rounded ${b.status === 'accepted' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>{b.time}</span>
                      ))}
                      {dayBooked.length > 3 && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-gray-100 text-gray-700">+{dayBooked.length - 3}</span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Time selection */}
          <div className="bg-white rounded border p-3">
            <div className="mb-2">
              <div className="text-sm text-gray-600">Selected date</div>
              <div className="font-medium text-gray-900">{selectedDate || 'None'}</div>
            </div>

            <div className="grid grid-cols-3 gap-2">
              {times.map((t) => {
                const isBooked = bookedTimesForSelected.has(t);
                const isSelectedTime = selectedTime === t;
                const status = bookedStatusByTime[t];
                return (
                  <button
                    key={t}
                    disabled={!selectedDate || isBooked}
                    onClick={() => setSelectedTime(t)}
                    className={`px-2 py-2 text-sm rounded border text-center transition ${
                      isBooked
                        ? status === 'accepted'
                          ? 'bg-green-50 border-green-200 text-green-700 cursor-not-allowed'
                          : 'bg-yellow-50 border-yellow-200 text-yellow-700 cursor-not-allowed'
                        : isSelectedTime
                          ? 'bg-blue-600 border-blue-600 text-white'
                          : 'bg-white border-gray-200 text-gray-800 hover:bg-gray-50'
                    }`}
                    title={isBooked ? `${status === 'accepted' ? 'Accepted' : 'Pending'} booking` : ''}
                  >
                    {t}
                  </button>
                );
              })}
            </div>

            {/* Legend */}
            <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-gray-600">
              <span className="px-2 py-0.5 rounded bg-yellow-100 text-yellow-800">Pending</span>
              <span className="px-2 py-0.5 rounded bg-green-100 text-green-800">Accepted</span>
              <span className="px-2 py-0.5 rounded bg-blue-100 text-blue-800">Available</span>
            </div>

            <div className="mt-4 flex items-center justify-end gap-2">
              <button onClick={onClose} className="px-4 py-2 rounded border border-gray-300 text-gray-700 hover:bg-gray-50">Cancel</button>
              <button
                onClick={confirm}
                disabled={!selectedDate || !selectedTime || bookedTimesForSelected.has(selectedTime)}
                className={`px-4 py-2 rounded ${(!selectedDate || !selectedTime || bookedTimesForSelected.has(selectedTime)) ? 'bg-gray-300 text-gray-600 cursor-not-allowed' : 'bg-blue-600 text-white hover:bg-blue-700'}`}
              >
                Confirm (Dummy)
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BookingModal;


