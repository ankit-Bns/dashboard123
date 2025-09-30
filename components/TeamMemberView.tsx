
import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
// FIX: Import store-specific types from the store file to break a circular dependency.
import type { RootState, AppDispatch } from '../redux/store';
import { Status, Task } from '../types';
import { updateMemberStatus, updateTaskProgress } from '../redux/slices/appSlice';
import { BriefcaseIcon, CoffeeIcon, UsersIcon, PowerIcon, PlusIcon, MinusIcon, CheckCircleIcon } from './Icons';

const STATUS_BUTTONS = [
    { status: Status.Working, label: 'Working', icon: <BriefcaseIcon className="h-5 w-5 mr-2" /> },
    { status: Status.Break, label: 'On a Break', icon: <CoffeeIcon className="h-5 w-5 mr-2" /> },
    { status: Status.Meeting, label: 'In a Meeting', icon: <UsersIcon className="h-5 w-5 mr-2" /> },
    { status: Status.Offline, label: 'Offline', icon: <PowerIcon className="h-5 w-5 mr-2" /> },
];

const Card: React.FC<{children: React.ReactNode; className?: string}> = ({ children, className = '' }) => (
    <div className={`bg-bkg text-content border border-content/10 rounded-xl shadow-sm p-6 ${className}`}>
        {children}
    </div>
);

const ProgressBar: React.FC<{ progress: number }> = ({ progress }) => (
    <div className="w-full bg-content/10 rounded-full h-2.5">
        <div className="bg-primary h-2.5 rounded-full transition-all duration-300" style={{ width: `${progress}%` }}></div>
    </div>
);


const StatusUpdater: React.FC = () => {
    const dispatch = useDispatch<AppDispatch>();
    const currentUser = useSelector((state: RootState) => state.app.currentUser);

    const handleStatusUpdate = (newStatus: Status) => {
        if (currentUser) {
            dispatch(updateMemberStatus({ memberId: currentUser.id, status: newStatus }));
        }
    };

    if (!currentUser) return null;

    return (
        <Card>
            <h2 className="text-lg font-semibold mb-4">Update Your Status</h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {STATUS_BUTTONS.map(({ status, label, icon }) => (
                    <button
                        key={status}
                        onClick={() => handleStatusUpdate(status)}
                        className={`flex items-center justify-center font-semibold rounded-md py-2 px-4 transition-all duration-200 border-2 ${
                            currentUser.status === status 
                                ? 'bg-primary border-primary text-primary-content shadow-lg' 
                                : 'bg-transparent border-content/20 hover:bg-content/5 hover:border-content/30'
                        }`}
                    >
                        {icon} {label}
                    </button>
                ))}
            </div>
        </Card>
    );
};

const MyTasks: React.FC = () => {
    const dispatch = useDispatch<AppDispatch>();
    const currentUser = useSelector((state: RootState) => state.app.currentUser);

    const handleProgressChange = (taskId: string, currentProgress: number, change: number) => {
        if (currentUser) {
            const newProgress = currentProgress + change;
            dispatch(updateTaskProgress({ memberId: currentUser.id, taskId, progress: newProgress }));
        }
    };

    if (!currentUser || !currentUser.tasks) return null;

    const activeTasks = currentUser.tasks.filter(t => !t.completed);
    const completedTasks = currentUser.tasks.filter(t => t.completed);

    const renderTask = (task: Task) => (
         <div key={task.id} className="p-4 bg-content/5 rounded-lg flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex-grow">
                <p className="font-semibold">{task.title}</p>
                <p className="text-xs text-content/70">Due: {new Date(task.dueDate).toLocaleDateString()}</p>
            </div>
            <div className="w-full sm:w-1/3">
                <ProgressBar progress={task.progress} />
            </div>
            <div className="flex items-center gap-2 justify-end">
                {task.completed ? (
                    <div className="flex items-center gap-2 text-green-500 font-semibold">
                        <CheckCircleIcon className="h-5 w-5" />
                        <span>Completed</span>
                    </div>
                ) : (
                    <>
                        <button onClick={() => handleProgressChange(task.id, task.progress, -10)} className="p-1.5 rounded-full hover:bg-content/10 transition-colors"><MinusIcon className="h-5 w-5" /></button>
                        <span className="font-mono text-sm w-10 text-center">{task.progress}%</span>
                        <button onClick={() => handleProgressChange(task.id, task.progress, 10)} className="p-1.5 rounded-full hover:bg-content/10 transition-colors"><PlusIcon className="h-5 w-5" /></button>
                    </>
                )}
            </div>
        </div>
    );

    return (
        <Card>
            <h2 className="text-lg font-semibold mb-4">Your Tasks</h2>
            <div className="space-y-3">
                {activeTasks.length > 0 ? activeTasks.map(renderTask) : <p className="text-center text-content/70 py-4">No active tasks. Great job!</p>}
                {completedTasks.length > 0 && (
                    <>
                        <h3 className="text-md font-semibold pt-6 pb-2 border-t border-content/10">Completed Tasks</h3>
                        {completedTasks.map(renderTask)}
                    </>
                )}
            </div>
        </Card>
    );
};


const TeamMemberView: React.FC = () => {
    const currentUser = useSelector((state: RootState) => state.app.currentUser);

    if (!currentUser) {
        return <div className="text-center p-8">Loading your data...</div>;
    }
    
    return (
        <div className="space-y-6 animate-fade-in">
            <StatusUpdater />
            <MyTasks />
        </div>
    );
};

export default TeamMemberView;