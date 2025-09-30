import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
// FIX: Import `Role` and `Status` as values, not just types, because they are enums used at runtime.
import { type AppState, type Member, Role, Status, type Task } from '../../types';

export const fetchMembers = createAsyncThunk('app/fetchMembers', async (memberCount: number = 10, { rejectWithValue }) => {
  try {
    const response = await fetch(`https://randomuser.me/api/?results=${memberCount}&seed=teampulse`);
    if (!response.ok) throw new Error('Failed to fetch members');
    const data = await response.json();
    return data.results.map((user: any): Member => ({
      id: user.login.uuid,
      name: `${user.name.first} ${user.name.last}`,
      picture: user.picture.large,
      status: Status.Offline,
      tasks: [],
    }));
  } catch (error: any) {
    return rejectWithValue(error.message);
  }
});

const initialState: AppState = {
  role: Role.TeamLead,
  currentUser: null,
  members: {
    list: [],
    status: 'idle',
    error: null,
  },
  isDarkMode: false,
};

const appSlice = createSlice({
  name: 'app',
  initialState,
  reducers: {
    switchRole: (state) => {
      state.role = state.role === Role.TeamLead ? Role.TeamMember : Role.TeamLead;
    },
    setCurrentUser: (state, action: PayloadAction<Member['id']>) => {
      state.currentUser = state.members.list.find(m => m.id === action.payload) || null;
    },
    updateMemberStatus: (state, action: PayloadAction<{ memberId: string; status: Status }>) => {
      const { memberId, status } = action.payload;
      const memberIndex = state.members.list.findIndex(m => m.id === memberId);
      if (memberIndex > -1) {
        const updatedMember = {
          ...state.members.list[memberIndex],
          status,
        };
        state.members.list[memberIndex] = updatedMember;
        if (state.currentUser?.id === memberId) {
          state.currentUser = updatedMember;
        }
      }
    },
    assignTask: (state, action: PayloadAction<{ memberId: string; task: Omit<Task, 'id' | 'completed' | 'progress'> }>) => {
        const { memberId, task } = action.payload;
        const memberIndex = state.members.list.findIndex(m => m.id === memberId);
        if (memberIndex > -1) {
            const member = state.members.list[memberIndex];
            const newTask: Task = {
                ...task,
                id: `task-${new Date().toISOString()}-${Math.random()}`,
                progress: 0,
                completed: false,
            };
            const updatedMember = {
                ...member,
                tasks: [...member.tasks, newTask],
            };
            state.members.list[memberIndex] = updatedMember;
            if (state.currentUser?.id === memberId) {
                state.currentUser = updatedMember;
            }
        }
    },
    updateTaskProgress: (state, action: PayloadAction<{ memberId: string; taskId: string; progress: number }>) => {
        const { memberId, taskId, progress } = action.payload;
        const memberIndex = state.members.list.findIndex(m => m.id === memberId);
        if (memberIndex > -1) {
            const member = state.members.list[memberIndex];
            const updatedTasks = member.tasks.map(task => {
                if (task.id === taskId) {
                    const newProgress = Math.max(0, Math.min(100, progress));
                    return {
                        ...task,
                        progress: newProgress,
                        completed: newProgress === 100,
                    };
                }
                return task;
            });
            const updatedMember = { ...member, tasks: updatedTasks };
            state.members.list[memberIndex] = updatedMember;
            if (state.currentUser?.id === memberId) {
                state.currentUser = updatedMember;
            }
        }
    },
    toggleDarkMode: (state) => {
      state.isDarkMode = !state.isDarkMode;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchMembers.pending, (state) => {
        state.members.status = 'loading';
      })
      .addCase(fetchMembers.fulfilled, (state, action: PayloadAction<Member[]>) => {
        state.members.status = 'succeeded';
        state.members.list = action.payload;
        if (!state.currentUser && action.payload.length > 0) {
            state.currentUser = action.payload[0];
        }
      })
      .addCase(fetchMembers.rejected, (state, action) => {
        state.members.status = 'failed';
        state.members.error = action.payload as string;
      });
  },
});

export const { 
    switchRole, 
    setCurrentUser, 
    updateMemberStatus, 
    assignTask, 
    updateTaskProgress,
    toggleDarkMode
} = appSlice.actions;

export default appSlice.reducer;