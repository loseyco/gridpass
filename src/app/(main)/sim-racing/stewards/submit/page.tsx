"use client"

import { useState } from "react"
import { createClient } from "@/utils/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import { ArrowLeft, Loader2 } from "lucide-react"
import Link from "next/link"

import { submitIncident } from "@/actions/stewards"

// ... imports

export default function SubmitIncidentPage() {
    const [loading, setLoading] = useState(false)
    const router = useRouter()
    const supabase = createClient()

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        setLoading(true)

        const formData = new FormData(e.currentTarget)
        const result = await submitIncident(formData)

        if (result?.error) {
            toast.error(result.error)
        } else {
            toast.success("Incident submitted for review!")
            router.push('/sim-racing/stewards')
            router.refresh()
        }
        setLoading(false)
    }

    return (
        <div className="min-h-screen bg-black pt-20 px-4">
            <div className="max-w-xl mx-auto">
                <Link href="/sim-racing/stewards" className="flex items-center text-zinc-500 hover:text-white mb-6">
                    <ArrowLeft className="w-4 h-4 mr-2" /> Back to Stewards
                </Link>

                <h1 className="text-2xl font-bold text-white mb-2">Submit Incident</h1>
                <p className="text-zinc-400 mb-8">Upload a clip to get the community's verdict.</p>

                <form onSubmit={handleSubmit} className="space-y-6 bg-zinc-900/50 p-6 rounded-lg border border-zinc-800">
                    <div className="space-y-2">
                        <Label htmlFor="title">Title</Label>
                        <Input id="title" name="title" placeholder="Lap 1 Turn 1 Chaos..." required className="bg-zinc-800 border-zinc-700" />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="sim_title">Simulator</Label>
                        <Select name="sim_title" required>
                            <SelectTrigger className="bg-zinc-800 border-zinc-700">
                                <SelectValue placeholder="Select Sim" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="iRacing">iRacing</SelectItem>
                                <SelectItem value="ACC">Assetto Corsa Competizione</SelectItem>
                                <SelectItem value="F1 24">F1 24</SelectItem>
                                <SelectItem value="Gran Turismo">Gran Turismo</SelectItem>
                                <SelectItem value="Forza">Forza Motorsport</SelectItem>
                                <SelectItem value="Other">Other</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="video_url">Video Link (YouTube)</Label>
                        <Input id="video_url" name="video_url" placeholder="https://youtu.be/..." required className="bg-zinc-800 border-zinc-700" />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="description">Description (Optional)</Label>
                        <Textarea id="description" name="description" placeholder="Explain context... who is who?" className="bg-zinc-800 border-zinc-700" />
                    </div>

                    <Button type="submit" disabled={loading} className="w-full bg-red-600 hover:bg-red-700 text-white">
                        {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                        Submit for Review
                    </Button>
                </form>
            </div>
        </div>
    )
}
