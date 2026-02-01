"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

export function useReferral() {
    const searchParams = useSearchParams();
    const [referrer, setReferrer] = useState<string | null>(null);

    useEffect(() => {
        // 1. Check URL for ?ref=username
        const refFromUrl = searchParams.get("ref");

        if (refFromUrl) {
            localStorage.setItem("gridpass_referrer", refFromUrl);
            setReferrer(refFromUrl);
        } else {
            // 2. Check LocalStorage if not in URL
            const storedRef = localStorage.getItem("gridpass_referrer");
            if (storedRef) {
                setReferrer(storedRef);
            }
        }
    }, [searchParams]);

    return referrer;
}
