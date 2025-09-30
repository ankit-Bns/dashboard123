
import React, { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
// FIX: Import store-specific types from the store file to break a circular dependency.
import type { RootState, AppDispatch } from './redux/store';
import { Role } from './types';
import { fetchMembers, switchRole, toggleDarkMode, setCurrentUser } from './redux/slices/appSlice';
import TeamLeadView from './components/TeamLeadView';
import TeamMemberView from './components/TeamMemberView';
import { MoonIcon, SunIcon, BriefcaseIcon } from './components/Icons';

// UI Components defined in App.tsx to reduce file count
const ToggleSwitch: React.FC<{ checked: boolean; onChange: () => void; }> = ({ checked, onChange }) => (
    <button onClick={onChange} className={`relative inline-flex items-center h-6 rounded-full w-11 transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary ${checked ? 'bg-primary' : 'bg-content/20'}`}>
        <span className={`inline-block w-4 h-4 transform bg-white rounded-full transition-transform duration-300 ${checked ? 'translate-x-6' : 'translate-x-1'}`}/>
    </button>
);

const Header: React.FC = () => {
    const dispatch = useDispatch<AppDispatch>();
    const { role, currentUser, isDarkMode } = useSelector((state: RootState) => state.app);

    return (
        <header className="bg-bkg border-b border-content/10 p-4 sticky top-0 z-10 backdrop-blur-sm bg-opacity-80">
            <div className="max-w-7xl mx-auto flex justify-between items-center">
                <div className="flex items-center gap-3">
                    <BriefcaseIcon className="h-8 w-8 text-primary"/>
                    <h1 className="text-xl font-bold tracking-tight">Team Pulse</h1>
                </div>
                <div className="flex items-center gap-4 sm:gap-6">
                    <div className="flex items-center gap-2">
                        <span className="text-sm font-medium hidden sm:inline">Member</span>
                        <ToggleSwitch checked={role === Role.TeamLead} onChange={() => dispatch(switchRole())} />
                        <span className="text-sm font-medium">Lead</span>
                    </div>
                    
                     <div className="flex items-center gap-2">
                        <SunIcon className={`h-5 w-5 ${!isDarkMode ? 'text-accent' : ''}`}/>
                        <ToggleSwitch checked={isDarkMode} onChange={() => dispatch(toggleDarkMode())} />
                        <MoonIcon className={`h-5 w-5 ${isDarkMode ? 'text-accent' : ''}`}/>
                    </div>

                    {currentUser && (
                        <div className="flex items-center gap-3">
                            <img src={currentUser.picture} alt={currentUser.name} className="h-9 w-9 rounded-full"/>
                            <div className="hidden md:block">
                                <p className="font-semibold text-sm">{currentUser.name}</p>
                                <p className="text-xs text-content/70">{role === Role.TeamLead ? 'Team Lead View' : 'My Dashboard'}</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
};

const Dashboard: React.FC = () => {
    const role = useSelector((state: RootState) => state.app.role);
    const { status, error } = useSelector((state: RootState) => state.app.members);

    if (status === 'loading') {
        return <div className="text-center p-10">Initializing Dashboard...</div>;
    }

    if (status === 'failed') {
        return <div className="text-center p-10 text-red-500">Error: {error}</div>;
    }
    
    return (
         <main className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
            {role === Role.TeamLead ? <TeamLeadView /> : <TeamMemberView />}
        </main>
    );
};


const App: React.FC = () => {
    const dispatch = useDispatch<AppDispatch>();
    // FIX: Add currentUser to the state destructuring to use it in the component.
    const { isDarkMode, members, currentUser } = useSelector((state: RootState) => state.app);

    useEffect(() => {
        if (members.status === 'idle') {
            dispatch(fetchMembers(10));
        }
    }, [members.status, dispatch]);

    useEffect(() => {
        // This effect ensures currentUser is set from the persisted state if members list is already populated
        // FIX: Use `currentUser` from the selector instead of the undefined `state` object.
        // Added `currentUser` to the dependency array to re-run the effect when it changes.
        if (members.list.length > 0 && !members.list.find(m => m.id === currentUser?.id)) {
            dispatch(setCurrentUser(members.list[0].id));
        }
    }, [members.list, currentUser, dispatch]);

    useEffect(() => {
        if (isDarkMode) {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
    }, [isDarkMode]);

    return (
        <div className="min-h-screen">
            <Header />
            <Dashboard />
        </div>
    );
};

export default App;