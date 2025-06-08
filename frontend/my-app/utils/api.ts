const BACKEND_URL = 'https://teamigo-backend.onrender.com'; 

interface ApiResponse<T> {
  data?: T;
  error?: string;
}

async function handleResponse<T>(response: Response): Promise<ApiResponse<T>> {
  if (!response.ok) {
    const error = await response.text();
    throw new Error(error || 'Network response was not ok');
  }
  const data = await response.json();
  return { data };
}

export const userApi = {
  updateName: async (userId: string, name: string) => {
    try {
      const response = await fetch(`${BACKEND_URL}/users/${userId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      });
      return handleResponse<{ user: { name: string } }>(response);
    } catch (error) {
      return { error: error instanceof Error ? error.message : 'Failed to update name' };
    }
  },

  searchByEmail: async (email: string) => {
    try {
      const response = await fetch(`${BACKEND_URL}/users/search?q=${encodeURIComponent(email.trim())}`);
      return handleResponse<any[]>(response);
    } catch (error) {
      return { error: error instanceof Error ? error.message : 'Failed to search user' };
    }
  },
};

export const eventApi = {
  getEvents: async (userId: number) => {
    try {
      const response = await fetch(`${BACKEND_URL}/events/${userId}`);
      return handleResponse<any[]>(response);
    } catch (error) {
      return { error: error instanceof Error ? error.message : 'Failed to fetch events' };
    }
  },

  createEvent: async (eventData: { user_id: number; date: string; content: string; color: string }) => {
    try {
      const response = await fetch(`${BACKEND_URL}/events`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(eventData),
      });
      return handleResponse<{ event: any }>(response);
    } catch (error) {
      return { error: error instanceof Error ? error.message : 'Failed to create event' };
    }
  },

  updateEvent: async (eventId: number, updateData: { content: string; color: string }) => {
    try {
      const response = await fetch(`${BACKEND_URL}/events/${eventId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData),
      });
      return handleResponse<{ event: any }>(response);
    } catch (error) {
      return { error: error instanceof Error ? error.message : 'Failed to update event' };
    }
  },

  deleteEvent: async (eventId: number) => {
    try {
      const response = await fetch(`${BACKEND_URL}/events/${eventId}`, {
        method: 'DELETE',
      });
      return handleResponse<void>(response);
    } catch (error) {
      return { error: error instanceof Error ? error.message : 'Failed to delete event' };
    }
  },
};

export const chatApi = {
  getChats: async (userId: number) => {
    try {
      const response = await fetch(`${BACKEND_URL}/chats?user_id=${userId}`);
      return handleResponse<any[]>(response);
    } catch (error) {
      return { error: error instanceof Error ? error.message : 'Failed to fetch chats' };
    }
  },

  createChat: async (userIds: number[]) => {
    try {
      const response = await fetch(`${BACKEND_URL}/chats`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_ids: userIds }),
      });
      return handleResponse<{ id: number }>(response);
    } catch (error) {
      return { error: error instanceof Error ? error.message : 'Failed to create chat' };
    }
  },
};


export const authApi = {
  login: async (email: string, password: string) => {
    try {
      const response = await fetch(`${BACKEND_URL}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      return handleResponse<{ id: number; name: string; role: string }>(response);
    } catch (error) {
      return { error: error instanceof Error ? error.message : 'Failed to login' };
    }
  },

  appleLogin: async (payload: { email: string; name: string; apple_user_id: string }) => {
    try {
      const response = await fetch(`${BACKEND_URL}/apple-login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      return handleResponse<{ id: number; name: string; role: string }>(response);
    } catch (error) {
      return { error: error instanceof Error ? error.message : 'Failed to login with Apple' };
    }
  },
};
