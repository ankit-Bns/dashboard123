
import React, { useState, useMemo } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
// FIX: Import store-specific types from the store file to break a circular dependency.
import type { RootState, AppDispatch } from '../redux/store';
import { Status, Member } from '../types';
import { assignTask } from '../redux/slices/appSlice';
import { UsersIcon, BriefcaseIcon, CoffeeIcon, PowerIcon, ChevronDownIcon } from './Icons';

const STATUS_CONFIG = {
    [Status.Working]: { color: '#22c55e', icon: <BriefcaseIcon className="h-6 w-6" /> },
    [Status.Break]: { color: '#f59e0b', icon: <CoffeeIcon className="h-6 w-6" /> },
    [Status.Meeting]: { color: '#3b82f6', icon: <UsersIcon className="h-6 w-6" /> },
    [Status.Offline]: { color: '#6b7280', icon: <PowerIcon className="h-6 w-6" /> },
};
const COLORS = ['#22c55e', '#f59e0b', '#3b82f6', '#6b7280'];

const Card: React.FC<{children: React.ReactNode; className?: string}> = ({ children, className = '' }) => (
    <div className={`bg-bkg text-content border border-content/10 rounded-xl shadow-sm p-6 ${className}`}>
        {children}
    </div>
);

// Sub-components defined inside TeamLeadView to keep file count low
const StatusSummary: React.FC<{ members: Member[] }> = ({ members }) => {
    const statusCounts = useMemo(() => {
        return members.reduce((acc, member) => {
            acc[member.status] = (acc[member.status] || 0) + 1;
            return acc;
        }, {} as Record<Status, number>);
    }, [members]);

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {Object.values(Status).map(status => (
                <Card key={status}>
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-content/70">{status}</p>
                            <p className="text-3xl font-bold">{statusCounts[status] || 0}</p>
                        </div>
                        <div style={{ color: STATUS_CONFIG[status].color }}>
                            {STATUS_CONFIG[status].icon}
                        </div>
                    </div>
                </Card>
            ))}
        </div>
    );
};

const StatusDistributionChart: React.FC<{ members: Member[] }> = ({ members }) => {
    const chartData = useMemo(() => {
        const counts = members.reduce((acc, member) => {
            acc[member.status] = (acc[member.status] || 0) + 1;
            return acc;
        }, {} as Record<Status, number>);
        return Object.entries(counts).map(([name, value]) => ({ name, value }));
    }, [members]);

    return (
        <Card className="flex flex-col h-full">
            <h2 className="text-lg font-semibold mb-4">Status Distribution</h2>
            <div className="flex-grow">
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie data={chartData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} fill="#8884d8" label>
                            {chartData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[Object.values(Status).indexOf(entry.name as Status)]} />
                            ))}
                        </Pie>
                        <Tooltip />
                        <Legend />
                    </PieChart>
                </ResponsiveContainer>
            </div>
        </Card>
    );
};

const AssignTaskForm: React.FC<{ members: Member[] }> = ({ members }) => {
    const dispatch = useDispatch<AppDispatch>();
    const [selectedMember, setSelectedMember] = useState('');
    const [title, setTitle] = useState('');
    const [dueDate, setDueDate] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedMember || !title || !dueDate) {
            alert('Please fill out all fields');
            return;
        }
        dispatch(assignTask({ memberId: selectedMember, task: { title, dueDate } }));
        setTitle('');
        setDueDate('');
        setSelectedMember('');
    };

    return (
        <Card className="h-full">
            <h2 className="text-lg font-semibold mb-4">Assign New Task</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label htmlFor="member" className="block text-sm font-medium text-content/80 mb-1">Team Member</label>
                    <select id="member" value={selectedMember} onChange={e => setSelectedMember(e.target.value)} className="w-full bg-content/5 border border-content/10 rounded-md px-3 py-2 focus:ring-2 focus:ring-primary focus:outline-none">
                        <option value="" disabled>Select a member</option>
                        {members.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                    </select>
                </div>
                <div>
                    <label htmlFor="title" className="block text-sm font-medium text-content/80 mb-1">Task Title</label>
                    <input type="text" id="title" value={title} onChange={e => setTitle(e.target.value)} className="w-full bg-content/5 border border-content/10 rounded-md px-3 py-2 focus:ring-2 focus:ring-primary focus:outline-none" />
                </div>
                <div>
                    <label htmlFor="dueDate" className="block text-sm font-medium text-content/80 mb-1">Due Date</label>
                    <input type="date" id="dueDate" value={dueDate} onChange={e => setDueDate(e.target.value)} className="w-full bg-content/5 border border-content/10 rounded-md px-3 py-2 focus:ring-2 focus:ring-primary focus:outline-none" />
                </div>
                <button type="submit" className="w-full bg-primary text-primary-content font-semibold rounded-md py-2 px-4 hover:bg-primary-focus transition-colors">Assign Task</button>
            </form>
        </Card>
    );
};

const MemberList: React.FC<{ members: Member[] }> = ({ members }) => {
    const [filter, setFilter] = useState<Status | 'All'>('All');
    const [sort, setSort] = useState<'name' | 'tasks'>('name');

    const filteredAndSortedMembers = useMemo(() => {
        let result = members;
        if (filter !== 'All') {
            result = result.filter(m => m.status === filter);
        }
        // FIX: Create a shallow copy of the array before sorting to avoid mutating
        // the read-only state from Redux. `Array.prototype.sort` sorts in-place.
        return [...result].sort((a, b) => {
            if (sort === 'tasks') {
                return (b.tasks.filter(t => !t.completed).length) - (a.tasks.filter(t => !t.completed).length);
            }
            return a.name.localeCompare(b.name);
        });
    }, [members, filter, sort]);

    return (
        <Card className="col-span-1 lg:col-span-3">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-4">
                <h2 className="text-lg font-semibold">Team Members</h2>
                <div className="flex items-center gap-4">
                    <select value={filter} onChange={e => setFilter(e.target.value as Status | 'All')} className="bg-content/5 border border-content/10 rounded-md px-3 py-1.5 text-sm focus:ring-2 focus:ring-primary focus:outline-none">
                        <option value="All">All Statuses</option>
                        {Object.values(Status).map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                    <select value={sort} onChange={e => setSort(e.target.value as 'name' | 'tasks')} className="bg-content/5 border border-content/10 rounded-md px-3 py-1.5 text-sm focus:ring-2 focus:ring-primary focus:outline-none">
                        <option value="name">Sort by Name</option>
                        <option value="tasks">Sort by Active Tasks</option>
                    </select>
                </div>
            </div>
            <div className="space-y-3">
                {filteredAndSortedMembers.map(member => (
                    <div key={member.id} className="flex items-center justify-between p-3 bg-content/5 rounded-lg">
                        <div className="flex items-center gap-4">
                            <img src={member.picture} alt={member.name} className="h-12 w-12 rounded-full" />
                            <div>
                                <p className="font-semibold">{member.name}</p>
                                <p className="text-sm text-content/70">{member.tasks.filter(t => !t.completed).length} active tasks</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium" style={{ backgroundColor: `${STATUS_CONFIG[member.status].color}20`, color: STATUS_CONFIG[member.status].color }}>
                           <div className="h-2 w-2 rounded-full" style={{ backgroundColor: STATUS_CONFIG[member.status].color }}></div>
                            {member.status}
                        </div>
                    </div>
                ))}
            </div>
        </Card>
    );
};


const TeamLeadView: React.FC = () => {
    const members = useSelector((state: RootState) => state.app.members.list);

    if (members.length === 0) {
        return <div className="text-center p-8">Loading team data...</div>;
    }
    
    return (
        <div className="space-y-6 animate-fade-in">
            <StatusSummary members={members} />
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
                    <AssignTaskForm members={members} />
                    <StatusDistributionChart members={members} />
                </div>
                <div className="lg:col-span-1">
                     {/* This is a placeholder for potential future content. Let's place the MemberList here. */}
                </div>
            </div>
             <MemberList members={members} />
        </div>
    );
};

export default TeamLeadView;