import { createClient } from '@/utils/supabase/server'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ArrowLeft, Mail, Search, Send, FileText } from 'lucide-react'
import Link from 'next/link'
import { enrichOrganization, sendOutreach } from '@/app/actions/outreach'
import { updateOrganizationStatus, updateOrganizationNotes } from '@/app/actions/organizations'

export default async function OrgDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params
    const supabase = await createClient()

    const { data: org, error } = await supabase
        .from('organizations')
        .select('*')
        .eq('id', id)
        .single()

    if (error || !org) {
        return <div>Organization not found</div>
    }

    async function handleEnrich() {
        'use server'
        await enrichOrganization(id, org.website ? new URL(org.website).hostname : '')
    }

    async function handleSendEmail(formData: FormData) {
        'use server'
        const subject = formData.get('subject') as string
        const body = formData.get('body') as string
        const recipient = formData.get('recipient') as string
        await sendOutreach(id, recipient, subject, body)
    }

    async function handleUpdateStatus(formData: FormData) {
        'use server'
        const status = formData.get('status') as string
        await updateOrganizationStatus(id, status)
    }

    async function handleUpdateNotes(formData: FormData) {
        'use server'
        const notes = formData.get('notes') as string
        await updateOrganizationNotes(id, notes)
    }

    return (
        <div className="container mx-auto py-8 max-w-4xl">
            <div className="mb-6">
                <Link href="/admin/orgs" className="text-muted-foreground hover:text-foreground flex items-center gap-2 text-sm">
                    <ArrowLeft size={16} /> Back to Leads
                </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Left Column: Org Info */}
                <div className="md:col-span-2 space-y-6">
                    <div className="flex justify-between items-start">
                        <div>
                            <h1 className="text-3xl font-bold">{org.name}</h1>
                            <div className="flex gap-2 mt-2">
                                <Badge variant="outline">{org.type}</Badge>
                                <Badge className={
                                    org.lead_status === 'client' ? 'bg-green-500' :
                                        org.lead_status === 'contacted' ? 'bg-blue-500' :
                                            'bg-gray-500'
                                }>{org.lead_status || 'prospect'}</Badge>
                            </div>
                        </div>
                        <form action={handleEnrich}>
                            <Button variant="outline" size="sm" className="gap-2">
                                <Search size={14} /> Enrich Data
                            </Button>
                        </form>
                    </div>

                    <Card>
                        <CardHeader>
                            <CardTitle>Details</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <Label>Website</Label>
                                <a href={org.website} target="_blank" className="block text-primary hover:underline">{org.website || 'N/A'}</a>
                            </div>
                            <div>
                                <Label>Location</Label>
                                <p>{org.location || 'Unknown'}</p>
                            </div>
                            <div>
                                <Label>Contact Email</Label>
                                <p>{org.contact_email || 'Not found'}</p>
                            </div>
                            <div>
                                <Label>Description</Label>
                                <p className="text-sm text-muted-foreground">{org.description || 'No description'}</p>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Outreach</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <form action={handleSendEmail} className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label>To</Label>
                                        <Input name="recipient" defaultValue={org.contact_email} placeholder="Email address" required />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Template</Label>
                                        {/* Placeholder for template selector */}
                                        <Input disabled placeholder="Custom Email" />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label>Subject</Label>
                                    <Input name="subject" defaultValue={`Partnership: GridPass x ${org.name}`} required />
                                </div>
                                <div className="space-y-2">
                                    <Label>Message</Label>
                                    <Textarea name="body" className="min-h-[150px]" defaultValue={`Hi ${org.name},\n\nI saw you're based in ${org.location}...`} required />
                                </div>

                                <div className="flex items-center gap-4 border p-3 rounded-md bg-muted/20">
                                    <FileText size={16} />
                                    <div className="text-sm flex-1">
                                        <p className="font-medium">Resume.pdf</p>
                                        <p className="text-xs text-muted-foreground">Not found (please upload)</p>
                                    </div>
                                    <Button variant="secondary" size="sm" type="button">Upload</Button>
                                </div>

                                <div className="flex justify-end gap-2">
                                    <Button type="submit" className="gap-2">
                                        <Send size={14} /> Log Email & Set "Contacted"
                                    </Button>
                                    {/* Fallback to mailto */}
                                    <a
                                        href={`mailto:${org.contact_email}?subject=Partnership`}
                                        target="_blank"
                                        className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-9 px-4"
                                    >
                                        Open in Gmail
                                    </a>
                                </div>
                            </form>
                        </CardContent>
                    </Card>
                </div>

                {/* Right Column: Status & Notes */}
                <div className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Pipeline Status</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <form action={handleUpdateStatus} className="space-y-2">
                                <select
                                    name="status"
                                    defaultValue={org.lead_status || 'prospect'}
                                    className="w-full p-2 border rounded-md bg-background"
                                >
                                    <option value="prospect">Prospect</option>
                                    <option value="contacted">Contacted</option>
                                    <option value="interested">Interested</option>
                                    <option value="client">Client</option>
                                    <option value="rejected">Rejected</option>
                                </select>
                                <Button size="sm" className="w-full mt-2">Update Status</Button>
                            </form>
                        </CardContent>
                    </Card>

                    <Card className="h-full">
                        <CardHeader>
                            <CardTitle>Internal Notes</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <form action={handleUpdateNotes}>
                                <Textarea
                                    name="notes"
                                    defaultValue={org.notes || ''}
                                    className="min-h-[300px] mb-2"
                                    placeholder="Log calls, meetings, and ideas here..."
                                />
                                <Button size="sm" className="w-full">Save Notes</Button>
                            </form>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    )
}
