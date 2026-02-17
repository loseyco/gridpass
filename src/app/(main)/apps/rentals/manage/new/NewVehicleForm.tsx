'use client'

import React, { useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import ImageUpload from '@/components/ui/ImageUpload'

export default function NewVehicleForm({ userId }: { userId: string }) {
    const [loading, setLoading] = useState(false)
    const router = useRouter()
    const supabase = createClient()

    const [formData, setFormData] = useState({
        type: 'golf_cart',
        make: '',
        model: '',
        year: new Date().getFullYear(),
        description: '',
        price_per_day: '',
        price_per_hour: '',
        location_name: '',
        image_url: ''
    })

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value })
    }

    const handleImageUpload = (url: string) => {
        setFormData({ ...formData, image_url: url })
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)

        const { error } = await supabase
            .from('rental_vehicles')
            .insert({
                owner_id: userId,
                type: formData.type,
                make: formData.make,
                model: formData.model,
                year: parseInt(formData.year.toString()),
                description: formData.description,
                price_per_day: parseFloat(formData.price_per_day),
                price_per_hour: formData.price_per_hour ? parseFloat(formData.price_per_hour) : null,
                location_name: formData.location_name,
                image_url: formData.image_url,
                status: 'available'
            })

        if (error) {
            console.error(error)
            alert('Error adding vehicle: ' + error.message)
        } else {
            router.push('/apps/rentals/manage')
            router.refresh()
        }
        setLoading(false)
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl mx-auto bg-neutral-900 p-8 rounded-xl border border-neutral-800">
            <h2 className="text-2xl font-bold mb-6">List a New Vehicle</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                    <Label htmlFor="type">Vehicle Type</Label>
                    <select
                        id="type"
                        name="type"
                        value={formData.type}
                        onChange={handleChange}
                        className="flex h-10 w-full rounded-md border border-neutral-700 bg-neutral-800 px-3 py-2 text-sm text-white placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-neutral-400 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        <option value="golf_cart">Golf Cart</option>
                        <option value="pit_bike">Pit Bike</option>
                        <option value="scooter">Scooter</option>
                        <option value="car">Car</option>
                        <option value="trailer">Trailer</option>
                        <option value="other">Other</option>
                    </select>
                </div>

                <div className="space-y-2">
                    <Label htmlFor="year">Year</Label>
                    <Input
                        id="year"
                        name="year"
                        type="number"
                        value={formData.year}
                        onChange={handleChange}
                        className="bg-neutral-800 border-neutral-700"
                        required
                    />
                </div>

                <div className="space-y-2">
                    <Label htmlFor="make">Make</Label>
                    <Input
                        id="make"
                        name="make"
                        value={formData.make}
                        onChange={handleChange}
                        className="bg-neutral-800 border-neutral-700"
                        placeholder="e.g. E-Z-GO"
                        required
                    />
                </div>

                <div className="space-y-2">
                    <Label htmlFor="model">Model</Label>
                    <Input
                        id="model"
                        name="model"
                        value={formData.model}
                        onChange={handleChange}
                        className="bg-neutral-800 border-neutral-700"
                        placeholder="e.g. RXV"
                        required
                    />
                </div>

                <div className="space-y-2">
                    <Label htmlFor="price_per_day">Price Per Day ($)</Label>
                    <Input
                        id="price_per_day"
                        name="price_per_day"
                        type="number"
                        min="0"
                        step="0.01"
                        value={formData.price_per_day}
                        onChange={handleChange}
                        className="bg-neutral-800 border-neutral-700"
                        required
                    />
                </div>

                <div className="space-y-2">
                    <Label htmlFor="price_per_hour">Price Per Hour ($) (Optional)</Label>
                    <Input
                        id="price_per_hour"
                        name="price_per_hour"
                        type="number"
                        min="0"
                        step="0.01"
                        value={formData.price_per_hour}
                        onChange={handleChange}
                        className="bg-neutral-800 border-neutral-700"
                    />
                </div>
            </div>

            <div className="space-y-2">
                <Label htmlFor="location_name">Location / Event</Label>
                <Input
                    id="location_name"
                    name="location_name"
                    value={formData.location_name}
                    onChange={handleChange}
                    className="bg-neutral-800 border-neutral-700"
                    placeholder="e.g. Indianapolis Motor Speedway"
                    required
                />
            </div>

            <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                    id="description"
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    className="bg-neutral-800 border-neutral-700"
                    rows={4}
                    placeholder="Describe the vehicle condition, features, etc."
                />
            </div>

            <div className="space-y-2">
                <Label>Vehicle Image</Label>
                <div className="border-2 border-dashed border-neutral-800 rounded-lg p-4 text-center hover:bg-neutral-800/50 transition bg-neutral-900">
                    <ImageUpload
                        value={formData.image_url}
                        onChange={handleImageUpload}
                        // removed maxFiles as it wasn't in the interface I saw, or I should double check. 
                        // The interface in view_file 60: interface ImageUploadProps { value?: string, onChange: (url: string)=>void ... }
                        // It does NOT have maxFiles.
                        // I will remove maxFiles.
                        bucket="garage" // Assuming this works if "garage" bucket exists.
                    />
                </div>
            </div>

            <Button type="submit" className="w-full bg-orange-500 hover:bg-orange-600 text-black font-bold" disabled={loading}>
                {loading ? 'Listing...' : 'List Vehicle'}
            </Button>
        </form>
    )
}
