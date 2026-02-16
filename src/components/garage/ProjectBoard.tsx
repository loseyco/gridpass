'use client';

import { useState } from 'react';
import { GarageProject, ProjectTask } from '@/types/garage';
import { createTask, updateTask, deleteTask } from '@/app/actions/project'; // deleteTask updateTask needed
import { Plus, GripVertical, CheckCircle, Circle, Clock, MoreVertical, X, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface ProjectBoardProps {
    project: GarageProject;
    initialTasks: ProjectTask[];
}

export default function ProjectBoard({ project, initialTasks }: ProjectBoardProps) {
    const [tasks, setTasks] = useState(initialTasks);
    const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const router = useRouter();

    // Task Form
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [priority, setPriority] = useState<ProjectTask['priority']>('medium');
    const [dueDate, setDueDate] = useState('');

    // Optimistic UI updates could be added here, but sticking to simple refresh for now

    // Group tasks by status
    const todoTasks = tasks.filter(t => t.status === 'todo');
    const inProgressTasks = tasks.filter(t => t.status === 'in_progress');
    const doneTasks = tasks.filter(t => t.status === 'done' || t.status === 'review');

    const handleCreateTask = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            await createTask({
                project_id: project.id,
                title,
                description,
                priority,
                due_date: dueDate || undefined,
                status: 'todo'
            });
            // Refresh
            router.refresh();
            setIsTaskModalOpen(false);
            // Reset form
            setTitle('');
            setDescription('');
            setPriority('medium');
            setDueDate('');
        } catch (error) {
            console.error('Failed to create task', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleMoveTask = async (taskId: string, newStatus: ProjectTask['status']) => {
        // Optimistic update
        setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: newStatus } : t));

        try {
            await updateTask(taskId, { status: newStatus }, project.id);
            router.refresh();
        } catch (error) {
            console.error('Failed to move task', error);
            // Revert on error would be ideal
        }
    };

    const handleDeleteTask = async (taskId: string) => {
        if (!confirm('Delete this task?')) return;
        setTasks(prev => prev.filter(t => t.id !== taskId));
        try {
            await deleteTask(taskId, project.id);
            router.refresh();
        } catch (error) {
            console.error('Failed to delete task', error);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold uppercase tracking-wide flex items-center gap-2">
                    <span className="w-2 h-8 bg-amber-500 rounded-full block"></span>
                    Board
                </h2>
                <button
                    onClick={() => setIsTaskModalOpen(true)}
                    className="bg-white text-black px-4 py-2 rounded font-bold hover:bg-neutral-200 transition-colors flex items-center gap-2 text-sm uppercase tracking-wide"
                >
                    <Plus className="w-4 h-4" /> Add Task
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Todo Column */}
                <div className="space-y-4">
                    <div className="flex justify-between items-center px-2">
                        <h3 className="font-bold text-neutral-400 text-sm uppercase tracking-wider">To Do <span className="text-neutral-600 ml-2">{todoTasks.length}</span></h3>
                    </div>
                    <div className="space-y-3 min-h-[200px] bg-neutral-900/30 rounded-xl p-2 border border-dashed border-white/5">
                        {todoTasks.map(task => (
                            <TaskCard
                                key={task.id}
                                task={task}
                                onMove={handleMoveTask}
                                onDelete={handleDeleteTask}
                            />
                        ))}
                        {todoTasks.length === 0 && (
                            <div className="text-center py-8 text-neutral-600 text-sm italic">No tasks pending</div>
                        )}
                    </div>
                </div>

                {/* In Progress Column */}
                <div className="space-y-4">
                    <div className="flex justify-between items-center px-2">
                        <h3 className="font-bold text-blue-400 text-sm uppercase tracking-wider">In Progress <span className="text-neutral-600 ml-2">{inProgressTasks.length}</span></h3>
                    </div>
                    <div className="space-y-3 min-h-[200px] bg-neutral-900/30 rounded-xl p-2 border border-dashed border-white/5">
                        {inProgressTasks.map(task => (
                            <TaskCard
                                key={task.id}
                                task={task}
                                onMove={handleMoveTask}
                                onDelete={handleDeleteTask}
                            />
                        ))}
                        {inProgressTasks.length === 0 && (
                            <div className="text-center py-8 text-neutral-600 text-sm italic">Nothing in progress</div>
                        )}
                    </div>
                </div>

                {/* Done Column */}
                <div className="space-y-4">
                    <div className="flex justify-between items-center px-2">
                        <h3 className="font-bold text-green-400 text-sm uppercase tracking-wider">Done <span className="text-neutral-600 ml-2">{doneTasks.length}</span></h3>
                    </div>
                    <div className="space-y-3 min-h-[200px] bg-neutral-900/30 rounded-xl p-2 border border-dashed border-white/5">
                        {doneTasks.map(task => (
                            <TaskCard key={task.id} task={task} onMove={handleMoveTask} onDelete={handleDeleteTask} isDone />
                        ))}
                        {doneTasks.length === 0 && (
                            <div className="text-center py-8 text-neutral-600 text-sm italic">Nothing finished yet</div>
                        )}
                    </div>
                </div>
            </div>

            {/* Task Modal */}
            {isTaskModalOpen && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-neutral-900 border border-white/10 rounded-xl w-full max-w-md shadow-2xl animate-in fade-in zoom-in duration-200">
                        <div className="p-6 border-b border-white/10 flex justify-between items-center">
                            <h3 className="font-bold text-lg text-white">Add Task</h3>
                            <button onClick={() => setIsTaskModalOpen(false)} className="text-neutral-400 hover:text-white"><X className="w-5 h-5" /></button>
                        </div>
                        <form onSubmit={handleCreateTask} className="p-6 space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-neutral-500 uppercase mb-1">Task Title</label>
                                <input
                                    type="text"
                                    className="w-full bg-black border border-white/10 p-3 rounded text-white focus:border-amber-400 outline-none transition-colors"
                                    value={title}
                                    onChange={e => setTitle(e.target.value)}
                                    placeholder="e.g. Order parts"
                                    required
                                    autoFocus
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-neutral-500 uppercase mb-1">Priority</label>
                                    <select
                                        className="w-full bg-black border border-white/10 p-3 rounded text-white focus:border-amber-400 outline-none transition-colors"
                                        value={priority}
                                        onChange={e => setPriority(e.target.value as any)}
                                    >
                                        <option value="low">Low</option>
                                        <option value="medium">Medium</option>
                                        <option value="high">High</option>
                                        <option value="urgent">Urgent</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-neutral-500 uppercase mb-1">Due Date</label>
                                    <input
                                        type="date"
                                        className="w-full bg-black border border-white/10 p-3 rounded text-white focus:border-amber-400 outline-none transition-colors"
                                        value={dueDate}
                                        onChange={e => setDueDate(e.target.value)}
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-neutral-500 uppercase mb-1">Description</label>
                                <textarea
                                    className="w-full bg-black border border-white/10 p-3 rounded text-white h-24 resize-none focus:border-amber-400 outline-none transition-colors"
                                    value={description}
                                    onChange={e => setDescription(e.target.value)}
                                    placeholder="Details..."
                                />
                            </div>

                            <div className="pt-4 flex justify-end gap-3">
                                <button
                                    type="button"
                                    onClick={() => setIsTaskModalOpen(false)}
                                    className="px-4 py-2 hover:bg-neutral-800 rounded text-neutral-400 font-bold text-sm"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={isLoading}
                                    className="px-6 py-2 bg-white text-black font-bold rounded hover:bg-neutral-200 disabled:opacity-50 flex items-center gap-2 text-sm uppercase tracking-wide"
                                >
                                    {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                                    Create Task
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

function TaskCard({ task, onMove, onDelete, isDone }: { task: ProjectTask, onMove: (id: string, status: any) => void, onDelete: (id: string) => void, isDone?: boolean }) {
    return (
        <div className="bg-neutral-900 border border-white/10 rounded-lg p-4 hover:border-white/30 transition-all group relative">
            <div className="flex justify-between items-start mb-2">
                <h4 className={`font-bold text-sm ${isDone ? 'text-neutral-500 line-through' : 'text-white'}`}>{task.title}</h4>
                <div className={`w-2 h-2 rounded-full ${task.priority === 'urgent' ? 'bg-red-500' :
                    task.priority === 'high' ? 'bg-amber-500' :
                        task.priority === 'medium' ? 'bg-blue-500' :
                            'bg-neutral-500'
                    }`} />
            </div>
            {task.description && <p className="text-xs text-neutral-500 line-clamp-2 mb-3">{task.description}</p>}

            <div className="flex justify-between items-center pt-2 border-t border-white/5">
                <span className="text-[10px] text-neutral-600 font-mono uppercase">
                    {task.due_date ? new Date(task.due_date).toLocaleDateString() : 'No Due Date'}
                </span>

                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    {!isDone && (
                        <>
                            {task.status === 'todo' && (
                                <button onClick={() => onMove(task.id, 'in_progress')} className="text-blue-400 hover:text-blue-300 bg-blue-900/20 p-1 rounded">
                                    <Clock className="w-3 h-3" />
                                </button>
                            )}
                            {(task.status === 'in_progress' || task.status === 'todo') && (
                                <button onClick={() => onMove(task.id, 'done')} className="text-green-400 hover:text-green-300 bg-green-900/20 p-1 rounded">
                                    <CheckCircle className="w-3 h-3" />
                                </button>
                            )}
                        </>
                    )}
                    {isDone && (
                        <button onClick={() => onMove(task.id, 'in_progress')} className="text-neutral-400 hover:text-white bg-neutral-800 p-1 rounded">
                            <Clock className="w-3 h-3" />
                        </button>
                    )}

                    <button onClick={() => onDelete(task.id)} className="text-red-400 hover:text-red-300 bg-red-900/20 p-1 rounded">
                        <X className="w-3 h-3" />
                    </button>
                </div>
            </div>
        </div>
    );
}
