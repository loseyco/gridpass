'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Plus, Trash2, CheckCircle, Clock, Archive, AlertCircle, Edit2, X, Tag, ChevronDown, ChevronRight, CornerDownRight } from 'lucide-react'
import { Spinner } from '@/components/ui/spinner'

// Define Task Interface
interface Task {
    id: string
    title: string
    description: string | null
    status: 'todo' | 'in_progress' | 'done' | 'archived'
    priority: 'low' | 'medium' | 'high' | 'critical'
    category: string | null
    parent_id: string | null
    tags: string[] | null
    created_at: string
}

export default function TaskAppClient() {
    const [tasks, setTasks] = useState<Task[]>([])
    const [loading, setLoading] = useState(true)
    const [isSuperAdmin, setIsSuperAdmin] = useState(false)
    const [filter, setFilter] = useState<'all' | 'todo' | 'in_progress' | 'done'>('all')
    const [categoryFilter, setCategoryFilter] = useState<string>('all')
    const [isEditing, setIsEditing] = useState<Task | null>(null)
    const [isCreating, setIsCreating] = useState(false)
    const [newTask, setNewTask] = useState<Partial<Task>>({ status: 'todo', priority: 'medium', category: 'Feature' })
    const [newSubTaskTitle, setNewSubTaskTitle] = useState('')

    const router = useRouter()
    const supabase = createClient()

    // 1. Check Permissions & Fetch Data
    useEffect(() => {
        async function init() {
            const { data: { user } } = await supabase.auth.getUser()

            if (!user) {
                router.push('/')
                return
            }

            const { data: profile } = await supabase
                .from('profiles')
                .select('role')
                .eq('id', user.id)
                .single()

            if (profile?.role !== 'superadmin') {
                router.push('/')
                return
            }

            setIsSuperAdmin(true)
            fetchTasks()
        }
        init()
    }, [router])

    async function fetchTasks() {
        setLoading(true)
        const { data, error } = await supabase
            .from('os_task')
            .select('*')
            .order('created_at', { ascending: false })

        if (error) {
            console.error('Error fetching tasks:', error)
        } else {
            setTasks(data || [])
        }
        setLoading(false)
    }

    // 2. CRUD Operations
    async function handleCreate() {
        if (!newTask.title) return

        const { error } = await supabase
            .from('os_task')
            .insert([{
                title: newTask.title,
                description: newTask.description,
                status: newTask.status || 'todo',
                priority: newTask.priority || 'medium',
                category: newTask.category || 'General',
                tags: newTask.tags || []
            }])

        if (!error) {
            setIsCreating(false)
            setNewTask({ status: 'todo', priority: 'medium', category: 'Feature' })
            fetchTasks()
        }
    }

    async function handleAddSubTask(parentId: string) {
        if (!newSubTaskTitle.trim()) return

        const { error } = await supabase
            .from('os_task')
            .insert([{
                title: newSubTaskTitle,
                parent_id: parentId,
                status: 'todo',
                priority: 'medium',
                category: isEditing?.category || 'General' // Inherit category by default
            }])

        if (!error) {
            setNewSubTaskTitle('')
            fetchTasks()
        }
    }

    async function handleUpdate() {
        if (!isEditing || !isEditing.title) return

        const { error } = await supabase
            .from('os_task')
            .update({
                title: isEditing.title,
                description: isEditing.description,
                status: isEditing.status,
                priority: isEditing.priority,
                category: isEditing.category
            })
            .eq('id', isEditing.id)

        if (!error) {
            setIsEditing(null)
            fetchTasks()
        }
    }

    async function handleDelete(id: string) {
        if (!confirm('Delete this task?')) return

        const { error } = await supabase
            .from('os_task')
            .delete()
            .eq('id', id)

        if (!error) {
            if (isEditing?.id === id) setIsEditing(null)
            fetchTasks()
        }
    }

    async function clearCompleted() {
        if (!confirm('Clear all completed tasks? This cannot be undone.')) return

        const { error } = await supabase
            .from('os_task')
            .delete()
            .eq('status', 'done')

        if (!error) {
            fetchTasks()
        }
    }

    async function toggleStatus(task: Task) {
        const nextStatus = task.status === 'done' ? 'todo' : 'done'
        const { error } = await supabase
            .from('os_task')
            .update({ status: nextStatus })
            .eq('id', task.id)

        if (!error) {
            // Optimistic update for subtask view
            if (isEditing && isEditing.id === task.parent_id) {
                fetchTasks()
            } else if (isEditing && isEditing.id === task.id) {
                setIsEditing({ ...task, status: nextStatus })
                fetchTasks()
            } else {
                fetchTasks()
            }
        }
    }

    // 3. Render Helpers
    const priorityColor = (p: string) => {
        switch (p) {
            case 'critical': return 'text-red-500 font-bold'
            case 'high': return 'text-orange-500 font-semibold'
            case 'medium': return 'text-yellow-500'
            case 'low': return 'text-green-500'
            default: return 'text-gray-500'
        }
    }

    const statusIcon = (s: string) => {
        switch (s) {
            case 'done': return <CheckCircle size={20} className="text-green-500 fill-green-500/20" />
            case 'in_progress': return <Clock size={20} className="text-blue-500" />
            case 'archived': return <Archive size={20} className="text-gray-500" />
            default: return <div className="w-5 h-5 rounded-full border-2 border-zinc-600 hover:border-zinc-400 transition" />
        }
    }

    if (!isSuperAdmin) return null

    // Filter Logic
    const availableCategories = Array.from(new Set(tasks.map(t => t.category || 'General'))).sort()

    // Only show top-level tasks in the main list
    const filteredTasks = tasks.filter(t => {
        const isTopLevel = !t.parent_id
        const statusMatch = filter === 'all' ? t.status !== 'archived' : t.status === filter
        const categoryMatch = categoryFilter === 'all' ? true : (t.category || 'General') === categoryFilter
        return isTopLevel && statusMatch && categoryMatch
    })

    const getSubTasks = (taskId: string) => tasks.filter(t => t.parent_id === taskId).sort((a, b) => a.created_at > b.created_at ? 1 : -1)

    return (
        <div className="min-h-screen bg-black text-white p-4 pb-24 font-sans pt-20 md:pt-24">

            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <Link href="/" className="p-2 bg-zinc-900 rounded-full hover:bg-zinc-800 transition">
                        <ArrowLeft size={20} />
                    </Link>
                    <h1 className="text-2xl font-bold tracking-tight">TASKS</h1>
                </div>
                <button
                    onClick={() => setIsCreating(true)}
                    className="p-3 bg-blue-600 rounded-full hover:bg-blue-500 transition shadow-lg shadow-blue-900/20">
                    <Plus size={24} />
                </button>
            </div>

            {/* Filters Row 1: Status */}
            <div className="flex gap-2 mb-3 overflow-x-auto pb-1 scrollbar-hide">
                {['all', 'todo', 'in_progress', 'done'].map(f => (
                    <button
                        key={f}
                        onClick={() => setFilter(f as any)}
                        className={`px-4 py-2 rounded-full text-xs font-bold uppercase whitespace-nowrap transition
                    ${filter === f
                                ? 'bg-white text-black'
                                : 'bg-zinc-900 text-zinc-500 hover:bg-zinc-800'}`}
                    >
                        {f.replace('_', ' ')}
                    </button>
                ))}
            </div>

            {/* Clear Done */}
            <button
                onClick={clearCompleted}
                className="ml-auto px-3 py-1.5 text-xs font-bold text-red-500/50 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition uppercase flex items-center gap-1"
            >
                <Trash2 size={12} /> Clear Done
            </button>

            {/* Filters Row 2: Categories */}
            <div className="flex gap-2 mb-6 overflow-x-auto pb-2 scrollbar-hide">
                <button
                    onClick={() => setCategoryFilter('all')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition
                    ${categoryFilter === 'all'
                            ? 'bg-blue-900/40 text-blue-300 border border-blue-500/50'
                            : 'bg-zinc-900 text-zinc-500 border border-zinc-800'}`}
                >
                    All Cats
                </button>
                {availableCategories.map(c => (
                    <button
                        key={c}
                        onClick={() => setCategoryFilter(c)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition
                    ${categoryFilter === c
                                ? 'bg-blue-900/40 text-blue-300 border border-blue-500/50'
                                : 'bg-zinc-900 text-zinc-500 border border-zinc-800'}`}
                    >
                        {c}
                    </button>
                ))}
            </div>

            {/* List */}
            <div className="space-y-3">
                {loading ? (
                    <div className="flex justify-center py-10">
                        <Spinner className="w-8 h-8 text-blue-500" />
                    </div>
                ) : filteredTasks.length === 0 ? (
                    <div className="text-center text-zinc-600 py-10 italic">No tasks found. Time to build?</div>
                ) : (
                    filteredTasks.map(task => {
                        const subTasks = getSubTasks(task.id)
                        const completedSubTasks = subTasks.filter(st => st.status === 'done').length

                        return (
                            <div key={task.id} className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4 flex gap-4 items-start active:scale-[0.99] transition touch-manipulation hover:bg-zinc-900/80 cursor-pointer group pr-2" onClick={() => setIsEditing(task)}>

                                {/* Status Toggle (Stop propagation to avoid opening modal) */}
                                <div onClick={(e) => { e.stopPropagation(); toggleStatus(task); }} className="mt-1 flex-shrink-0 cursor-pointer p-1 -ml-1">
                                    {statusIcon(task.status)}
                                </div>

                                {/* Content */}
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                                        <span className={`text-[10px] font-bold uppercase tracking-wider ${priorityColor(task.priority)}`}>
                                            {task.priority}
                                        </span>
                                        {task.category && (
                                            <span className="text-[10px] bg-zinc-800 text-zinc-400 px-1.5 py-0.5 rounded flex items-center gap-1">
                                                <Tag size={10} /> {task.category}
                                            </span>
                                        )}
                                    </div>
                                    <h3 className={`font-semibold text-lg leading-tight truncate ${task.status === 'done' ? 'text-zinc-500 line-through' : 'text-zinc-100'}`}>
                                        {task.title}
                                    </h3>
                                    {task.description && (
                                        <p className="text-zinc-400 text-sm mt-1 line-clamp-2">{task.description}</p>
                                    )}

                                    {/* Subtask Indicator */}
                                    {subTasks.length > 0 && (
                                        <div className="mt-2 text-xs text-zinc-500 flex items-center gap-1">
                                            <CornerDownRight size={12} /> {completedSubTasks}/{subTasks.length} sub-tasks
                                        </div>
                                    )}
                                </div>

                                {/* Quick Delete */}
                                <button
                                    onClick={(e) => { e.stopPropagation(); handleDelete(task.id); }}
                                    className="opacity-0 group-hover:opacity-100 transition p-2 text-zinc-600 hover:text-red-500 hover:bg-red-500/10 rounded-lg"
                                    title="Delete Task"
                                >
                                    <Trash2 size={18} />
                                </button>
                            </div>
                        )
                    })
                )}
            </div>

            {/* Create Modal */}
            {
                isCreating && (
                    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-4">
                        <div className="bg-zinc-900 w-full max-w-md rounded-2xl p-6 border border-zinc-800 shadow-2xl animate-in slide-in-from-bottom-10 fade-in">
                            <h2 className="text-xl font-bold mb-4">New Task</h2>
                            <input
                                autoFocus
                                placeholder="What needs to be done?"
                                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-3 mb-3 text-lg focus:outline-none focus:border-blue-500 transition"
                                value={newTask.title || ''}
                                onChange={e => setNewTask({ ...newTask, title: e.target.value })}
                            />
                            <textarea
                                placeholder="Details..."
                                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-3 mb-4 h-24 resize-none focus:outline-none focus:border-blue-500 transition"
                                value={newTask.description || ''}
                                onChange={e => setNewTask({ ...newTask, description: e.target.value })}
                            />

                            <div className="mb-4">
                                <label className="text-xs text-zinc-500 mb-1 block uppercase">Category</label>
                                <div className="flex gap-2 overflow-x-auto pb-1">
                                    {['Feature', 'Bug', 'UI', 'Tech Debt', 'Idea'].map(c => (
                                        <button
                                            key={c}
                                            onClick={() => setNewTask({ ...newTask, category: c })}
                                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap
                                            ${newTask.category === c ? 'bg-blue-600 text-white' : 'bg-zinc-800 text-zinc-400'}`}
                                        >
                                            {c}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="flex gap-2 mb-6">
                                {['low', 'medium', 'high', 'critical'].map(p => (
                                    <button
                                        key={p}
                                        onClick={() => setNewTask({ ...newTask, priority: p as any })}
                                        className={`flex-1 py-2 rounded-lg text-xs font-bold uppercase transition
                                ${newTask.priority === p ? 'bg-white text-black' : 'bg-zinc-800 text-zinc-500'}`}
                                    >
                                        {p}
                                    </button>
                                ))}
                            </div>

                            <div className="flex gap-3">
                                <button
                                    onClick={() => setIsCreating(false)}
                                    className="flex-1 py-3 bg-zinc-800 rounded-xl font-bold hover:bg-zinc-700 transition">
                                    Cancel
                                </button>
                                <button
                                    onClick={handleCreate}
                                    disabled={!newTask.title}
                                    className="flex-1 py-3 bg-blue-600 rounded-xl font-bold hover:bg-blue-500 transition disabled:opacity-50 disabled:cursor-not-allowed">
                                    Create
                                </button>
                            </div>
                        </div>
                    </div>
                )
            }

            {/* Detail / Edit Modal */}
            {
                isEditing && (
                    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-end sm:items-center justify-center p-4 pb-24 sm:pb-4">
                        <div className="bg-zinc-900 w-full max-w-lg rounded-2xl border border-zinc-800 shadow-2xl animate-in slide-in-from-bottom-10 fade-in flex flex-col max-h-[85vh]">

                            {/* Modal Header */}
                            <div className="p-6 border-b border-zinc-800 flex justify-between items-start shrink-0">
                                <div className="flex-1 mr-4">
                                    <input
                                        className="w-full bg-transparent text-xl font-bold focus:outline-none placeholder-zinc-600"
                                        value={isEditing.title}
                                        onChange={e => setIsEditing({ ...isEditing, title: e.target.value })}
                                    />
                                </div>
                                <button onClick={() => setIsEditing(null)} className="p-1 hover:bg-zinc-800 rounded transition"><X className="text-zinc-500" /></button>
                            </div>

                            {/* Modal Body - Scrollable */}
                            <div className="p-6 overflow-y-auto">

                                {/* Description */}
                                <textarea
                                    className="w-full bg-zinc-950/50 border border-zinc-800/50 rounded-lg p-3 mb-6 h-24 resize-none focus:outline-none focus:border-blue-500 transition text-sm"
                                    value={isEditing.description || ''}
                                    onChange={e => setIsEditing({ ...isEditing, description: e.target.value })}
                                    placeholder="Add a description..."
                                />

                                {/* Properties Grid */}
                                <div className="grid grid-cols-2 gap-4 mb-8">
                                    <div>
                                        <label className="text-xs text-zinc-500 mb-1.5 block uppercase font-bold tracking-wider">Status</label>
                                        <select
                                            value={isEditing.status}
                                            onChange={e => setIsEditing({ ...isEditing, status: e.target.value as any })}
                                            className="w-full bg-zinc-950 p-2.5 rounded-lg border border-zinc-800 text-sm appearance-none"
                                        >
                                            {['todo', 'in_progress', 'done', 'archived'].map(s => <option key={s} value={s}>{s.replace('_', ' ').toUpperCase()}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="text-xs text-zinc-500 mb-1.5 block uppercase font-bold tracking-wider">Priority</label>
                                        <select
                                            value={isEditing.priority}
                                            onChange={e => setIsEditing({ ...isEditing, priority: e.target.value as any })}
                                            className="w-full bg-zinc-950 p-2.5 rounded-lg border border-zinc-800 text-sm appearance-none"
                                        >
                                            {['low', 'medium', 'high', 'critical'].map(p => <option key={p} value={p}>{p.toUpperCase()}</option>)}
                                        </select>
                                    </div>
                                </div>

                                {/* Category Pills */}
                                <div className="mb-8">
                                    <label className="text-xs text-zinc-500 mb-2 block uppercase font-bold tracking-wider">Category</label>
                                    <div className="flex gap-2 overflow-x-auto pb-1 flex-wrap">
                                        {['Feature', 'Bug', 'UI', 'Tech Debt', 'Idea'].map(c => (
                                            <button
                                                key={c}
                                                onClick={() => setIsEditing({ ...isEditing, category: c })}
                                                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap border
                                                ${isEditing.category === c
                                                        ? 'bg-blue-600 text-white border-blue-500'
                                                        : 'bg-zinc-950 text-zinc-400 border-zinc-800 hover:border-zinc-700'}`}
                                            >
                                                {c}
                                            </button>
                                        ))}
                                        {/* Custom Category Input if needed, implied by current selection not in list */}
                                        {!['Feature', 'Bug', 'UI', 'Tech Debt', 'Idea'].includes(isEditing.category || '') && isEditing.category && (
                                            <button className="px-3 py-1.5 rounded-lg text-xs font-bold bg-blue-600 text-white border border-blue-500">
                                                {isEditing.category}
                                            </button>
                                        )}
                                    </div>
                                </div>

                                {/* Sub-tasks Section */}
                                <div className="mb-6">
                                    <h3 className="text-sm font-bold uppercase tracking-wider text-zinc-500 mb-3 flex items-center gap-2">
                                        Sub-tasks
                                    </h3>

                                    <div className="space-y-2 mb-3">
                                        {/* List Subtasks */}
                                        {getSubTasks(isEditing.id).map(sub => (
                                            <div key={sub.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-zinc-800/50 group">
                                                <button onClick={() => toggleStatus(sub)}>
                                                    {statusIcon(sub.status)}
                                                </button>
                                                <span className={`text-sm flex-1 ${sub.status === 'done' ? 'text-zinc-600 line-through' : 'text-zinc-300'}`}>
                                                    {sub.title}
                                                </span>
                                                <button onClick={() => handleDelete(sub.id)} className="opacity-0 group-hover:opacity-100 text-zinc-600 hover:text-red-500 transition">
                                                    <X size={14} />
                                                </button>
                                            </div>
                                        ))}

                                        {/* New Subtask Input */}
                                        <div className="flex items-center gap-3 p-2">
                                            <Plus size={18} className="text-zinc-600" />
                                            <input
                                                className="bg-transparent focus:outline-none text-sm w-full placeholder-zinc-600"
                                                placeholder="Add a sub-task..."
                                                value={newSubTaskTitle}
                                                onChange={e => setNewSubTaskTitle(e.target.value)}
                                                onKeyDown={e => {
                                                    if (e.key === 'Enter') {
                                                        handleAddSubTask(isEditing.id)
                                                    }
                                                }}
                                            />
                                        </div>
                                    </div>
                                </div>

                            </div>

                            {/* Modal Footer */}
                            <div className="p-6 border-t border-zinc-800 flex gap-3 shrink-0 bg-zinc-900 rounded-b-2xl">
                                <button
                                    onClick={handleUpdate}
                                    className="flex-1 py-3 bg-zinc-100 text-black rounded-xl font-bold hover:bg-white transition">
                                    Save Changes
                                </button>
                                {isEditing.status !== 'done' && (
                                    <button
                                        onClick={() => {
                                            toggleStatus(isEditing)
                                            setIsEditing(null)
                                        }}
                                        className="px-4 py-3 bg-green-600/20 text-green-500 border border-green-600/50 rounded-xl font-bold hover:bg-green-600/30 transition flex items-center gap-2">
                                        <CheckCircle size={18} /> Done
                                    </button>
                                )}
                                <button
                                    onClick={() => handleDelete(isEditing.id)}
                                    className="px-4 py-3 text-zinc-500 hover:text-red-500 transition">
                                    <Trash2 size={20} />
                                </button>
                            </div>
                        </div>
                    </div>
                )
            }

        </div >
    )
}
