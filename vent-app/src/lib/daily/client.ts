import 'server-only';

const DAILY_API_BASE = 'https://api.daily.co/v1';

function dailyApiKey(): string {
  const key = process.env.DAILY_API_KEY;
  if (!key) throw new Error('DAILY_API_KEY is not set');
  return key;
}

async function dailyFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${DAILY_API_BASE}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${dailyApiKey()}`,
      'Content-Type': 'application/json',
      ...(init?.headers ?? {}),
    },
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Daily API ${path} failed: ${res.status} ${body}`);
  }

  return res.json() as Promise<T>;
}

export interface DailyRoom {
  name: string;
  url: string;
  config: { exp: number };
}

interface CreateRoomOptions {
  cameraOff: boolean;
  /** Outer safety ceiling only — NOT the 60s vent-timer mechanism. See matcher.ts. */
  expiresAt: Date;
}

export async function createRoom({ cameraOff, expiresAt }: CreateRoomOptions): Promise<DailyRoom> {
  return dailyFetch<DailyRoom>('/rooms', {
    method: 'POST',
    body: JSON.stringify({
      privacy: 'private',
      properties: {
        max_participants: 2,
        enable_screenshare: false,
        enable_chat: false,
        eject_at_room_exp: true,
        start_video_off: cameraOff,
        start_audio_off: false,
        exp: Math.floor(expiresAt.getTime() / 1000),
        // Recording is deliberately never enabled here — see plan §5.
        enable_recording: undefined,
      },
    }),
  });
}

export async function deleteRoom(roomName: string): Promise<void> {
  await dailyFetch(`/rooms/${roomName}`, { method: 'DELETE' });
}

interface CreateTokenOptions {
  roomName: string;
  userName: string;
  expiresAt: Date;
}

export async function createMeetingToken({ roomName, userName, expiresAt }: CreateTokenOptions): Promise<string> {
  const { token } = await dailyFetch<{ token: string }>('/meeting-tokens', {
    method: 'POST',
    body: JSON.stringify({
      properties: {
        room_name: roomName,
        user_name: userName,
        is_owner: false,
        exp: Math.floor(expiresAt.getTime() / 1000),
      },
    }),
  });
  return token;
}
