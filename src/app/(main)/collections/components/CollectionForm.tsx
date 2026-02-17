'use client';

import { useState } from 'react';
import { createCollection } from '../actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface Team {
    id: string;
    name: string;
}

export default function CollectionForm({ teams, userId }: { teams: Team[], userId: string }) {
    const [isLoading, setIsLoading] = useState(false);

    // State to manage the composite owner value
    const [ownerComposite, setOwnerComposite] = useState(`user:${userId}`);

    // Parse owner type and id from composite
    const [ownerType, ownerId] = ownerComposite.split(':');

    async function handleSubmit(formData: FormData) {
        setIsLoading(true);
        // We need to ensure owner_type and owner_id are in the formData
        // Since we are using controlled inputs for them via hidden fields below
        // or we can append them manually if we intercept the form.
        // But hidden inputs are easiest with server actions.

        const res = await createCollection(formData);

        if (res?.error) {
            toast.error(res.error);
            if (res.fields) {
                console.error(res.fields);
            }
            setIsLoading(false);
        } else {
            toast.success('Collection created!');
        }
    }

    return (
        <form action={handleSubmit} className="space-y-6 max-w-xl">
            <input type="hidden" name="owner_type" value={ownerType} />
            <input type="hidden" name="owner_id" value={ownerId} />

            <div className="space-y-2">
                <Label htmlFor="name">Collection Name</Label>
                <Input id="name" name="name" placeholder="e.g. The Davidson Collection" required className="bg-neutral-900 border-neutral-800" />
            </div>

            <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea id="description" name="description" placeholder="Brief description of this collection..." className="bg-neutral-900 border-neutral-800" />
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="type">Type</Label>
                    <div className="bg-neutral-900 border border-neutral-800 rounded-md">
                        <Select name="type" required defaultValue="Private" className="w-full bg-transparent border-none">
                            <option value="Private">Private</option>
                            <option value="Museum">Museum</option>
                            <option value="Commercial Fleet">Commercial Fleet</option>
                            <option value="Racing Team">Racing Team</option>
                            <option value="Other">Other</option>
                        </Select>
                    </div>
                </div>

                <div className="space-y-2">
                    <Label htmlFor="visibility">Visibility</Label>
                    <div className="bg-neutral-900 border border-neutral-800 rounded-md">
                        <Select name="visibility" required defaultValue="Public" className="w-full bg-transparent border-none">
                            <option value="Public">Public (Visible to everyone)</option>
                            <option value="Private">Private (Only you/team)</option>
                            <option value="Unlisted">Unlisted (Link only)</option>
                            <option value="Team">Team Only</option>
                        </Select>
                    </div>
                </div>
            </div>

            <div className="space-y-2">
                <Label htmlFor="location">Location</Label>
                <Input id="location" name="location" placeholder="e.g. Lake Bluff, IL" className="bg-neutral-900 border-neutral-800" />
            </div>

            <div className="space-y-2">
                <Label htmlFor="owner">Owner</Label>
                <div className="bg-neutral-900 border border-neutral-800 rounded-md">
                    <Select
                        value={ownerComposite}
                        onChange={(e: any) => setOwnerComposite(e.target.value)}
                        className="w-full bg-transparent border-none"
                    >
                        <option value={`user:${userId}`}>Personal (Me)</option>
                        {teams.map(team => (
                            <option key={team.id} value={`team:${team.id}`}>
                                {team.name} (Team)
                            </option>
                        ))}
                    </Select>
                </div>
                <p className="text-xs text-neutral-500">
                    Who owns this collection? If you select a Team, other team admins can also manage it.
                </p>
            </div>

            <div className="pt-4">
                <Button type="submit" disabled={isLoading} className="w-full bg-indigo-600 hover:bg-indigo-500">
                    {isLoading ? <Loader2 className="animate-spin mr-2" /> : null}
                    Create Collection
                </Button>
            </div>
        </form>
    );
}
