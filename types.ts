
export enum Role {
  TeamLead = 'TeamLead',
  TeamMember = 'TeamMember',
}

export enum Status {
  Working = 'Working',
  Break = 'Break',
  Meeting = 'Meeting',
  Offline = 'Offline',
}

export interface Task {
  id: string;
  title: string;
  dueDate: string;
  progress: number;
  completed: boolean;
}

export interface Member {
  id: string;
  name: string;
  picture: string;
  status: Status;
  tasks: Task[];
}

export interface AppState {
  role: Role;
  currentUser: Member | null;
  members: {
    list: Member[];
    status: 'idle' | 'loading' | 'succeeded' | 'failed';
    error: string | null;
  };
  isDarkMode: boolean;
}
