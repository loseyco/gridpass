'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { createJob, createGig } from '@/app/actions/jobs'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'

interface PostJobModalProps {
    isOpen: boolean
    onClose: () => void
}

export default function PostJobModal({ isOpen, onClose }: PostJobModalProps) {
    const [loading, setLoading] = useState(false)
    const [activeTab, setActiveTab] = useState('job')

    // Job State
    const [jobData, setJobData] = useState({
        title: '',
        company_name: '',
        location: '',
        salary_range: '',
        description: '',
        external_url: ''
    })

    // Gig State
    const [gigData, setGigData] = useState({
        title: '',
        location: '',
        daily_rate: '',
        description: '',
        category: 'Mechanic',
        is_urgent: false
    })

    const handleJobChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setJobData({ ...jobData, [e.target.name]: e.target.value })
    }

    const handleGigChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        setGigData({ ...gigData, [e.target.name]: e.target.value })
    }

    const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setGigData({ ...gigData, [e.target.name]: e.target.checked })
    }

    async function onJobSubmit(e: React.FormEvent) {
        e.preventDefault()
        setLoading(true)

        const formData = new FormData()
        Object.entries(jobData).forEach(([key, value]) => formData.append(key, value))

        const result = await createJob(formData)
        setLoading(false)

        if (result.error) {
            toast.error(result.error)
        } else {
            toast.success('Job Posted Successfully!')
            onClose()
            // Reset form
            setJobData({
                title: '',
                company_name: '',
                location: '',
                salary_range: '',
                description: '',
                external_url: ''
            })
        }
    }

    async function onGigSubmit(e: React.FormEvent) {
        e.preventDefault()
        setLoading(true)

        const formData = new FormData()
        Object.entries(gigData).forEach(([key, value]) => {
            if (key === 'is_urgent') {
                if (value) formData.append(key, 'on')
            } else if (key === 'category') {
                // Skip sending raw category here, we'll set it hardcoded below
            } else if (key === 'description') {
                // Skip raw description, we'll append category
            } else {
                formData.append(key, String(value))
            }
        })

        // Hardcode DB-valid category
        formData.append('category', 'personnel')
        // Append specific functionality to description
        formData.append('description', `**Department:** ${gigData.category}\n\n${gigData.description}`)

        const result = await createGig(formData)
        setLoading(false)

        if (result.error) {
            toast.error(result.error)
        } else {
            toast.success('Gig Posted Successfully!')
            onClose()
            // Reset form
            setGigData({
                title: '',
                location: '',
                daily_rate: '',
                description: '',
                category: 'Mechanic',
                is_urgent: false
            })
        }
    }

    const [smartPasteContent, setSmartPasteContent] = useState('')
    const [isSmartPasteOpen, setIsSmartPasteOpen] = useState(false)

    // ... existing handlers ...

    const handleSmartPaste = () => {
        // Simple heuristic parser for now
        const text = smartPasteContent

        // Extract Title (first line or look for "Role:")
        const titleMatch = text.match(/(?:Role|Title|Looking for):?\s*(.*)/i) || text.split('\n')[0]
        const title = titleMatch && typeof titleMatch === 'object' ? titleMatch[1] : titleMatch

        // Extract Rate
        const rateMatch = text.match(/\$([\d,]+)/)
        const rate = rateMatch ? rateMatch[1].replace(',', '') : ''

        // Extract Location
        const locMatch = text.match(/(?:Location|Where):?\s*(.*)/i)
        const location = locMatch ? locMatch[1] : ''

        if (activeTab === 'job') {
            setJobData(prev => ({
                ...prev,
                title: String(title).substring(0, 50),
                description: text,
                salary_range: rate ? `$${rate}` : prev.salary_range,
                location: location || prev.location
            }))
        } else {
            setGigData(prev => ({
                ...prev,
                title: String(title).substring(0, 50),
                description: text,
                daily_rate: rate || prev.daily_rate,
                location: location || prev.location
            }))
        }

        setIsSmartPasteOpen(false)
        setSmartPasteContent('')
        toast.success('Content pasted! Please review details.')
    }

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[600px] bg-neutral-900 text-white border-neutral-800 max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <div className="flex justify-between items-start">
                        <div>
                            <DialogTitle className="text-2xl font-bold">Post an Opportunity</DialogTitle>
                            <DialogDescription className="text-neutral-400">
                                Reach thousands of motorsports professionals.
                            </DialogDescription>
                        </div>
                        <Button
                            variant="outline"
                            size="sm"
                            className="bg-neutral-800 border-neutral-700 text-xs"
                            onClick={() => setIsSmartPasteOpen(!isSmartPasteOpen)}
                        >
                            {isSmartPasteOpen ? 'Cancel Import' : 'Import from Text'}
                        </Button>
                    </div>
                </DialogHeader>

                {isSmartPasteOpen && (
                    <div className="bg-neutral-800 p-4 rounded-lg mb-4 animate-in slide-in-from-top-2">
                        <Label className="text-xs text-neutral-400 mb-2 block">Paste job description from Facebook, Email, etc.</Label>
                        <Textarea
                            value={smartPasteContent}
                            onChange={(e) => setSmartPasteContent(e.target.value)}
                            placeholder="Paste text here..."
                            className="bg-neutral-900 border-neutral-700 min-h-[100px] mb-2 text-sm"
                        />
                        <Button onClick={handleSmartPaste} size="sm" className="w-full bg-blue-600 hover:bg-blue-700">
                            Auto-Fill Form
                        </Button>
                    </div>
                )}

                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                    <TabsList className="grid w-full grid-cols-2 bg-neutral-800 mb-6">
                        <TabsTrigger value="job" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">Full-Time Job</TabsTrigger>
                        <TabsTrigger value="gig" className="data-[state=active]:bg-emerald-600 data-[state=active]:text-white">Gig / Contract</TabsTrigger>
                    </TabsList>

                    {/* FULL TIME JOB FORM */}
                    <TabsContent value="job">
                        <form onSubmit={onJobSubmit} className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="title">Job Title</Label>
                                    <Input
                                        id="title"
                                        name="title"
                                        value={jobData.title}
                                        onChange={handleJobChange}
                                        placeholder="e.g. Race Engineer"
                                        required
                                        className="bg-neutral-800 border-neutral-700"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="company_name">Company</Label>
                                    <Input
                                        id="company_name"
                                        name="company_name"
                                        value={jobData.company_name}
                                        onChange={handleJobChange}
                                        placeholder="e.g. Red Bull Racing"
                                        required
                                        className="bg-neutral-800 border-neutral-700"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="location">Location</Label>
                                    <Input
                                        id="location"
                                        name="location"
                                        value={jobData.location}
                                        onChange={handleJobChange}
                                        placeholder="e.g. Milton Keynes / Remote"
                                        required
                                        className="bg-neutral-800 border-neutral-700"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="salary_range">Salary Range</Label>
                                    <Input
                                        id="salary_range"
                                        name="salary_range"
                                        value={jobData.salary_range}
                                        onChange={handleJobChange}
                                        placeholder="e.g. $80k - $120k"
                                        className="bg-neutral-800 border-neutral-700"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="description">Description (Markdown Supported)</Label>
                                <Textarea
                                    id="description"
                                    name="description"
                                    value={jobData.description}
                                    onChange={handleJobChange}
                                    placeholder="Describe the role, responsibilities, and requirements..."
                                    required
                                    className="bg-neutral-800 border-neutral-700 min-h-[150px]"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="external_url">Application Link (Optional)</Label>
                                <Input
                                    id="external_url"
                                    name="external_url"
                                    value={jobData.external_url}
                                    onChange={handleJobChange}
                                    placeholder="https://..."
                                    className="bg-neutral-800 border-neutral-700"
                                />
                                <p className="text-xs text-neutral-500">Leave blank to use GridPass Apply.</p>
                            </div>

                            <Button type="submit" disabled={loading} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 mt-4">
                                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Post Job
                            </Button>
                        </form>
                    </TabsContent>

                    {/* GIG FORM */}
                    <TabsContent value="gig">
                        <form onSubmit={onGigSubmit} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="gig-title">Gig Title</Label>
                                <Input
                                    id="gig-title"
                                    name="title"
                                    value={gigData.title}
                                    onChange={handleGigChange}
                                    placeholder="e.g. Weekend Tire Specialist"
                                    required
                                    className="bg-neutral-800 border-neutral-700"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="gig-location">Location</Label>
                                    <Input
                                        id="gig-location"
                                        name="location"
                                        value={gigData.location}
                                        onChange={handleGigChange}
                                        placeholder="e.g. COTA, Austin TX"
                                        required
                                        className="bg-neutral-800 border-neutral-700"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="daily_rate">Daily Rate ($)</Label>
                                    <Input
                                        id="daily_rate"
                                        name="daily_rate"
                                        type="number"
                                        value={gigData.daily_rate}
                                        onChange={handleGigChange}
                                        placeholder="500"
                                        required
                                        className="bg-neutral-800 border-neutral-700"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="category">Category</Label>
                                <select
                                    id="category"
                                    name="category"
                                    value={gigData.category}
                                    onChange={handleGigChange}
                                    className="flex h-10 w-full rounded-md border border-neutral-700 bg-neutral-800 px-3 py-2 text-sm ring-offset-neutral-950 file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-neutral-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 text-white"
                                >
                                    <option value="Mechanic">Mechanic</option>
                                    <option value="Engineering">Engineering</option>
                                    <option value="Logistics">Logistics</option>
                                    <option value="Hospitality">Hospitality</option>
                                    <option value="Media/Content">Media/Content</option>
                                    <option value="Management">Management</option>
                                </select>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="gig-description">Details</Label>
                                <Textarea
                                    id="gig-description"
                                    name="description"
                                    value={gigData.description}
                                    onChange={handleGigChange}
                                    placeholder="What needs to be done? What dates?"
                                    required
                                    className="bg-neutral-800 border-neutral-700 min-h-[150px]"
                                />
                            </div>

                            <div className="flex items-center space-x-2 pt-2">
                                <input
                                    type="checkbox"
                                    id="is_urgent"
                                    name="is_urgent"
                                    checked={gigData.is_urgent}
                                    onChange={handleCheckboxChange}
                                    className="h-4 w-4 rounded border-neutral-300 text-emerald-600 focus:ring-emerald-600"
                                />
                                <Label htmlFor="is_urgent" className="text-red-400 font-bold">Urgent / Last Minute</Label>
                            </div>

                            <Button type="submit" disabled={loading} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 mt-4">
                                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Post Gig
                            </Button>
                        </form>
                    </TabsContent>
                </Tabs>
            </DialogContent>
        </Dialog>
    )
}
