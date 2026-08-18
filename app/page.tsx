'use client';

import { useState, useEffect, useRef } from 'react';

type Task = {
  id: string;
  title: string;
  completed: boolean;
  createdAt: string;
};

const POMODORO_SECONDS = 25 * 60;
const RADIUS = 90;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export default function Home() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [title, setTitle] = useState('');
  const [secondsLeft, setSecondsLeft] = useState(POMODORO_SECONDS);
  const [isRunning, setIsRunning] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchTasks = async () => {
    const res = await fetch('/api/tasks');
    setTasks(await res.json());
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  useEffect(() => {
    if (isRunning) {
      intervalRef.current = setInterval(() => {
        setSecondsLeft((prev) => {
          if (prev <= 1) {
            setIsRunning(false);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isRunning]);

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60).toString().padStart(2, '0');
    const s = (secs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const addTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    await fetch('/api/tasks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title }),
    });
    setTitle('');
    fetchTasks();
  };

  const toggleComplete = async (task: Task) => {
    await fetch(`/api/tasks/${task.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ completed: !task.completed }),
    });
    fetchTasks();
  };

  const progress = secondsLeft / POMODORO_SECONDS;
  const dashOffset = CIRCUMFERENCE * (1 - progress);

  return (
    <>
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;700&family=Inter:wght@400;500;600&display=swap');

        * {
          box-sizing: border-box;
        }
        body {
          margin: 0;
          background: #17160f;
        }
        input::placeholder {
          color: #6b6656;
        }
        .task-row:hover {
          background: #1f1e15;
        }
        .btn {
          transition: transform 0.12s ease, filter 0.12s ease;
        }
        .btn:hover {
          filter: brightness(1.1);
          transform: translateY(-1px);
        }
        .btn:active {
          transform: translateY(0);
        }
        .checkbox-custom {
          accent-color: #c15f35;
        }
      `}</style>

      <main
        style={{
          minHeight: '100vh',
          background: '#17160f',
          color: '#eeeade',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'flex-start',
          paddingTop: '10vh',
          fontFamily: "'Inter', sans-serif",
        }}
      >
        <div style={{ display: 'flex', gap: 56, maxWidth: 920, width: '100%', padding: '0 24px' }}>
          {/* LEFT: Task list card */}
          <div
            style={{
              flex: 1,
              background: '#1c1b13',
              border: '1px solid #2c2a1e',
              borderRadius: 14,
              padding: 32,
            }}
          >
            <h1
              style={{
                fontFamily: "'Space Grotesk', sans-serif",
                fontSize: 22,
                fontWeight: 700,
                letterSpacing: 0.3,
                marginBottom: 24,
                color: '#f4f1e8',
              }}
            >
              Tasks
            </h1>

            <form onSubmit={addTask} style={{ display: 'flex', gap: 10, marginBottom: 28 }}>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="What's your next task?"
                style={{
                  flex: 1,
                  padding: '12px 14px',
                  fontSize: 15,
                  background: '#141309',
                  color: '#eeeade',
                  border: '1px solid #33301f',
                  borderRadius: 8,
                  outline: 'none',
                  fontFamily: "'Inter', sans-serif",
                }}
              />
              <button
                type="submit"
                className="btn"
                style={{
                  padding: '12px 22px',
                  fontSize: 15,
                  fontWeight: 600,
                  background: '#c15f35',
                  color: '#17160f',
                  border: 'none',
                  borderRadius: 8,
                  cursor: 'pointer',
                }}
              >
                Add
              </button>
            </form>

            {tasks.length === 0 ? (
              <p style={{ color: '#6b6656', fontSize: 14 }}>No tasks yet — add one above.</p>
            ) : (
              <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                {tasks.map((task) => (
                  <li
                    key={task.id}
                    className="task-row"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 14,
                      padding: '13px 10px',
                      borderRadius: 8,
                      marginBottom: 2,
                    }}
                  >
                    <input
                      type="checkbox"
                      className="checkbox-custom"
                      checked={task.completed}
                      onChange={() => toggleComplete(task)}
                      style={{ width: 17, height: 17, cursor: 'pointer', flexShrink: 0 }}
                    />
                    <span
                      style={{
                        fontSize: 15,
                        textDecoration: task.completed ? 'line-through' : 'none',
                        color: task.completed ? '#5c5847' : '#eeeade',
                        transition: 'color 0.2s ease',
                      }}
                    >
                      {task.title}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* RIGHT: Pomodoro timer card */}
          <div
            style={{
              flex: '0 0 300px',
              background: '#1c1b13',
              border: '1px solid #2c2a1e',
              borderRadius: 14,
              padding: 32,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
            }}
          >
            <h1
              style={{
                fontFamily: "'Space Grotesk', sans-serif",
                fontSize: 22,
                fontWeight: 700,
                letterSpacing: 0.3,
                marginBottom: 24,
                color: '#f4f1e8',
                alignSelf: 'flex-start',
              }}
            >
              Pomodoro
            </h1>

            <div style={{ position: 'relative', width: 220, height: 220, marginBottom: 28 }}>
              <svg width="220" height="220" style={{ transform: 'rotate(-90deg)' }}>
                <circle cx="110" cy="110" r={RADIUS} fill="none" stroke="#2c2a1e" strokeWidth="10" />
                <circle
                  cx="110"
                  cy="110"
                  r={RADIUS}
                  fill="none"
                  stroke="#c15f35"
                  strokeWidth="10"
                  strokeLinecap="round"
                  strokeDasharray={CIRCUMFERENCE}
                  strokeDashoffset={dashOffset}
                  style={{ transition: 'stroke-dashoffset 1s linear' }}
                />
              </svg>
              <div
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontFamily: "'Space Grotesk', sans-serif",
                  fontSize: 44,
                  fontWeight: 700,
                  letterSpacing: 1,
                  color: '#f4f1e8',
                }}
              >
                {formatTime(secondsLeft)}
              </div>
            </div>

            <div style={{ display: 'flex', gap: 10 }}>
              {!isRunning ? (
                <button
                  onClick={() => setIsRunning(true)}
                  className="btn"
                  style={{
                    padding: '11px 26px',
                    fontSize: 15,
                    fontWeight: 600,
                    background: '#8fa88a',
                    color: '#17160f',
                    border: 'none',
                    borderRadius: 8,
                    cursor: 'pointer',
                  }}
                >
                  Start
                </button>
              ) : (
                <button
                  onClick={() => setIsRunning(false)}
                  className="btn"
                  style={{
                    padding: '11px 26px',
                    fontSize: 15,
                    fontWeight: 600,
                    background: '#e8a33d',
                    color: '#17160f',
                    border: 'none',
                    borderRadius: 8,
                    cursor: 'pointer',
                  }}
                >
                  Pause
                </button>
              )}
              <button
                onClick={() => {
                  setIsRunning(false);
                  setSecondsLeft(POMODORO_SECONDS);
                }}
                className="btn"
                style={{
                  padding: '11px 26px',
                  fontSize: 15,
                  fontWeight: 600,
                  background: 'transparent',
                  color: '#c15f3c',
                  border: '1px solid #4a3527',
                  borderRadius: 8,
                  cursor: 'pointer',
                }}
              >
                Reset
              </button>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}