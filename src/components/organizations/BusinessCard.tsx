'use client'

import { Organization } from '@/app/actions/organizations'
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { MapPin, ExternalLink, Clock, ArrowRight } from 'lucide-react'
import Link from 'next/link'

export function BusinessCard({ org }: { org: Organization }) {
    return (
        <Card className="group bg-neutral-900 border border-white/5 hover:border-white/20 transition-all duration-300 overflow-hidden">
            <div className="flex flex-col md:flex-row h-full">
                {/* Content Section */}
                <div className="flex-1 p-6 flex flex-col justify-between w-full">
                    <div>
                        <div className="flex items-center justify-between mb-3">
                            <h3 className="text-xl font-bold text-white group-hover:text-blue-400 transition-colors">
                                {org.name}
                            </h3>
                            <div className="px-2 py-1 rounded text-xs font-bold uppercase tracking-wider bg-neutral-800 text-neutral-400 border border-white/5">
                                {org.type}
                            </div>
                        </div>

                        <p className="text-neutral-400 mb-6 line-clamp-2 text-sm leading-relaxed">
                            {org.description || 'Professional services available.'}
                        </p>

                        <div className="flex flex-wrap gap-5 text-xs text-neutral-500 font-mono">
                            {org.location && (
                                <div className="flex items-center gap-2">
                                    <MapPin className="h-3.5 w-3.5 text-neutral-600" />
                                    {org.location}
                                </div>
                            )}
                            <div className="flex items-center gap-2">
                                <Clock className="h-3.5 w-3.5 text-emerald-500/80" />
                                <span className="text-emerald-500/80">Open Now</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Action Section */}
                <div className="p-6 md:w-auto flex items-center justify-end md:justify-center border-t md:border-t-0 md:border-l border-white/5 bg-neutral-900/50">
                    <Link href={`/biz/${org.slug}`} className="w-full md:w-auto">
                        <Button variant="ghost" className="w-full md:w-auto group/btn text-white hover:text-blue-400 hover:bg-blue-500/10 gap-2">
                            Visit Site
                            <ArrowRight className="h-4 w-4 transition-transform group-hover/btn:translate-x-1" />
                        </Button>
                    </Link>
                </div>
            </div>
        </Card>
    )
}
