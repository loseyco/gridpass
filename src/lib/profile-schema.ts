import {
    Trophy, Wrench, Briefcase, User, MapPin,
    AlertTriangle, Award, Globe
} from 'lucide-react';

export type FieldDefinition = {
    key: string;
    label: string;
    type: string;
    placeholder?: string;
    options?: string[];
};

export type FieldCategory = {
    id: string;
    title: string;
    icon: any;
    description: string;
    db_column: string;
    fields: FieldDefinition[];
};

export const SCHEMA_CATEGORIES: FieldCategory[] = [
    {
        id: 'basic',
        title: 'Basic Info',
        icon: User,
        description: 'Public facing identity.',
        db_column: 'basic',
        fields: [
            { key: 'username', label: 'Username', type: 'text', placeholder: 'racer123' },
            { key: 'full_name', label: 'Full Name', type: 'text', placeholder: 'John Doe' },
            { key: 'bio', label: 'Bio', type: 'textarea', placeholder: 'Tell us about yourself...' },
            { key: 'website', label: 'Website', type: 'url', placeholder: 'https://...' },
            { key: 'location', label: 'Location', type: 'text', placeholder: 'Austin, TX' },
        ]
    },
    {
        id: 'real_world',
        title: 'Real World Driver',
        icon: Award,
        description: 'FIA/SCCA/NASA licenses and track experience.',
        db_column: 'real_world_info',
        fields: [
            { key: 'organization', label: 'Sanctioning Body', type: 'text', placeholder: 'SCCA, NASA, FIA' },
            { key: 'license_grade', label: 'License Grade', type: 'text', placeholder: 'Full Competition, Time Trial' },
            { key: 'primary_series', label: 'Primary Series', type: 'text', placeholder: 'Spec Miata, IMSA' },
            { key: 'car_number', label: 'Car Number', type: 'text', placeholder: '#42' },
            { key: 'years_racing', label: 'Years Competed', type: 'number', placeholder: '3' },
            { key: 'home_track', label: 'Home Circuit', type: 'text', placeholder: 'Road Atlanta' },
            { key: 'achievements', label: 'Race Wins / Titles', type: 'textarea', placeholder: '2023 Regional Champion...' }
        ]
    },
    {
        id: 'driver',
        title: 'Sim Driver (iRacing)',
        icon: Trophy,
        description: 'Your iRacing stats and license info.',
        db_column: 'driver_info',
        fields: [
            { key: 'iracing_id', label: 'iRacing Customer ID', type: 'number', placeholder: '123456' },
            { key: 'license_class', label: 'License Class', type: 'select', options: ['Rookie', 'D', 'C', 'B', 'A', 'Pro', 'WC'] },
            { key: 'irating', label: 'iRating', type: 'number', placeholder: '2500' },
            { key: 'safety_rating', label: 'Safety Rating', type: 'text', placeholder: 'A 4.99' },
            { key: 'home_track', label: 'Home Track', type: 'text', placeholder: 'Circuit of the Americas' },
            { key: 'years_racing', label: 'Years Racing', type: 'number', placeholder: '5' },
            { key: 'achievements', label: 'Key Achievements', type: 'textarea', placeholder: '2024 Season Champion...' }
        ]
    },
    {
        id: 'mechanic',
        title: 'Mechanic / Crew',
        icon: Wrench,
        description: 'For shop staff, pit crew, and engineers.',
        db_column: 'mechanic_info',
        fields: [
            { key: 'specialties', label: 'Specialties', type: 'text', placeholder: 'Engine Building, Suspension, Fab' },
            { key: 'years_wrenching', label: 'Years Experience', type: 'number', placeholder: '10' },
            { key: 'own_tools', label: 'Has Own Tools?', type: 'checkbox' },
            { key: 'tool_box_size', label: 'Tool Storage Size', type: 'text', placeholder: 'Triple Bay Snap-on' },
            { key: 'willing_to_travel', label: 'Willing to Travel?', type: 'checkbox' }
        ]
    },
    {
        id: 'physical',
        title: 'Physical & Gear',
        icon: User,
        description: 'Vital stats for team gear and cockpit fitting.',
        db_column: 'physical_info',
        fields: [
            { key: 'helmet_size', label: 'Helmet Size', type: 'select', options: ['XS', 'S', 'M', 'L', 'XL', 'XXL'] },
            { key: 'suit_size', label: 'Suit Size', type: 'text', placeholder: '52 Euro / 42 US' },
            { key: 'shoe_size', label: 'Shoe Size', type: 'number', placeholder: '10.5' },
            { key: 'glove_size', label: 'Glove Size', type: 'select', options: ['S', 'M', 'L', 'XL'] },
            { key: 'blood_type', label: 'Blood Type', type: 'text', placeholder: 'O+' },
            { key: 'allergies', label: 'Medical Allergies', type: 'text', placeholder: 'Latex, Penicillin' }
        ]
    },
    {
        id: 'logistics',
        title: 'Logistics',
        icon: Briefcase,
        description: 'Travel and employment eligibility.',
        db_column: 'logistics_info',
        fields: [
            { key: 'hometown', label: 'Hometown', type: 'text', placeholder: 'City, State' },
            { key: 'home_airport', label: 'Home Airport Code', type: 'text', placeholder: 'AUS' },
            { key: 'passport_status', label: 'Passport Valid?', type: 'checkbox' },
            { key: 'drivers_license_state', label: 'DL State', type: 'text', placeholder: 'TX' },
            { key: 'languages', label: 'Languages Spoken', type: 'text', placeholder: 'English, Spanish' }
        ]
    },
    {
        id: 'emergency',
        title: 'Emergency Contact',
        icon: AlertTriangle,
        description: 'Who to call in case of an incident.',
        db_column: 'emergency_contact',
        fields: [
            { key: 'name', label: 'Contact Name', type: 'text', placeholder: 'Jane Doe' },
            { key: 'relation', label: 'Relationship', type: 'text', placeholder: 'Spouse' },
            { key: 'phone', label: 'Phone Number', type: 'tel', placeholder: '+1 555-0123' },
            { key: 'email', label: 'Email', type: 'email', placeholder: 'jane@example.com' }
        ]
    },
    {
        id: 'skills',
        title: 'Skills & Expertise',
        icon: Trophy,
        description: 'Highlight your technical and professional skills.',
        db_column: 'skills', // Actually a root column, but handled by editor special case or mapped
        fields: [
            { key: 'skills', label: 'Skills', type: 'tags', placeholder: 'e.g. Data Analysis, Fabrication, Setup' }
        ]
    },

    {
        id: 'professional',
        title: 'Professional',
        icon: Briefcase,
        description: 'Resume and professional links.',
        db_column: 'basic', // some root columns
        fields: [
            { key: 'resume_url', label: 'Resume / CV', type: 'file', placeholder: 'Upload PDF' },
            { key: 'linkedin', label: 'LinkedIn URL', type: 'url', placeholder: 'https://linkedin.com/in/...' },
            { key: 'portfolio', label: 'Portfolio URL', type: 'url', placeholder: 'https://...' }
        ]
    },
    {
        id: 'job_preferences',
        title: 'Job Preferences',
        icon: MapPin,
        description: 'Let teams know what you are looking for.',
        db_column: 'job_preferences',
        fields: [
            { key: 'looking_for', label: 'Looking For', type: 'select', options: ['Full-time', 'Part-time', 'Contract / Fly-in', 'Volunteer / Internship'] },
            { key: 'availability', label: 'Availability', type: 'select', options: ['Immediate', '2 Weeks Notice', '1 Month Notice', 'Open to discussion'] },
            { key: 'relocation', label: 'Willing to Relocate?', type: 'checkbox' },
            { key: 'salary_expectations', label: 'Salary Expectations (Optional)', type: 'text', placeholder: 'e.g. $60k+/yr or $500/day' }
        ]
    },
    {
        id: 'social',
        title: 'Social Media',
        icon: Globe,
        description: 'Connect your social profiles.',
        db_column: 'social_links',
        fields: [
            { key: 'instagram', label: 'Instagram', type: 'url', placeholder: 'https://instagram.com/...' },
            { key: 'twitter', label: 'Twitter / X', type: 'url', placeholder: 'https://x.com/...' },
            { key: 'facebook', label: 'Facebook', type: 'url', placeholder: 'https://facebook.com/...' },
            { key: 'tiktok', label: 'TikTok', type: 'url', placeholder: 'https://tiktok.com/@...' },
            { key: 'youtube', label: 'YouTube', type: 'url', placeholder: 'https://youtube.com/...' },
        ]
    }
];
