export default function JsonLd() {
    const schema = {
        "@context": "https://schema.org",
        "@graph": [
            {
                "@type": "Organization",
                "@id": "https://gridpass.app/#organization",
                "name": "GridPass",
                "url": "https://gridpass.app",
                "logo": "https://gridpass.app/logo-square.png",
                "sameAs": [
                    "https://twitter.com/gridpassapp",
                    "https://instagram.com/gridpass",
                    "https://linkedin.com/company/gridpass"
                ]
            },
            {
                "@type": "SoftwareApplication",
                "name": "GridPass Industry OS",
                "operatingSystem": "Web, iOS, Android",
                "applicationCategory": "BusinessApplication",
                "offers": {
                    "@type": "Offer",
                    "price": "0.00",
                    "priceCurrency": "USD"
                },
                "aggregateRating": {
                    "@type": "AggregateRating",
                    "ratingValue": "4.8",
                    "ratingCount": "150"
                }
            }
        ]
    };

    return (
        <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
        />
    );
}
