export const RESUME_BUILDER_SCHEMA = {
    component: 'Container',
    props: { className: 'v2-content', style: { padding: '2rem', maxWidth: '800px', margin: '0 auto' } },
    children: [
        {
            component: 'Container',
            props: { style: { marginBottom: '2rem', textAlign: 'center' } },
            children: [
                { component: 'Container', props: { children: 'Paddock Resume Builder', style: { fontSize: '2rem', fontWeight: 'bold' } } },
                { component: 'Container', props: { children: 'Build your profile for the modern motorsport network.', style: { color: '#888' } } }
            ]
        },
        {
            component: 'GridStepWizard',
            props: {
                steps: ['Basic Stats', 'Travel', 'Experience', 'Skills', 'Vouch'],
                onComplete: 'submit_action' // Placeholder for action
            },
            children: [
                // Step 1: Basic Stats
                {
                    component: 'Container',
                    children: [
                        { component: 'Container', props: { children: 'Step 1: Who are you?', style: { marginBottom: '1.5rem', fontSize: '1.5rem' } } },
                        {
                            component: 'Row',
                            children: [
                                { component: 'Col', children: [{ component: 'GridInput', props: { label: 'First Name', name: 'first_name', required: true }, bind: 'os_user_profiles.first_name' }] },
                                { component: 'Col', children: [{ component: 'GridInput', props: { label: 'Last Name', name: 'last_name', required: true }, bind: 'os_user_profiles.last_name' }] }
                            ]
                        },
                        { component: 'GridInput', props: { label: 'Headline', name: 'headline', placeholder: 'e.g. Race Engineer' }, bind: 'os_user_profiles.headline' },
                        { component: 'GridInput', props: { label: 'Current Location', name: 'current_location', placeholder: 'e.g. London, UK' }, bind: 'os_user_profiles.current_location' },
                        { component: 'GridInput', props: { label: 'Bio', name: 'bio', placeholder: 'Tell us your story...' }, bind: 'os_user_profiles.bio' }
                    ]
                },
                // Step 2: Travel Logistics
                {
                    component: 'Container',
                    children: [
                        { component: 'Container', props: { children: 'Step 2: Logistics', style: { marginBottom: '1.5rem', fontSize: '1.5rem' } } },
                        { component: 'GridInput', props: { label: 'Nearest Airport', name: 'nearest_airport', placeholder: 'e.g. LHR' }, bind: 'os_user_logistics.nearest_airport' },
                        { component: 'GridToggle', props: { label: 'Passport Ready?', name: 'passport_status' }, bind: 'os_user_logistics.passport_status' },
                        // Shirt Size would optionally be a select, but we'll use input for now or add GridSelect later
                        { component: 'GridInput', props: { label: 'Shirt Size', name: 'shirt_size' }, bind: 'os_user_logistics.shirt_size' }
                    ]
                },
                // Step 3: Experience
                {
                    component: 'Container',
                    children: [
                        { component: 'Container', props: { children: 'Step 3: Experience', style: { marginBottom: '1.5rem', fontSize: '1.5rem' } } },
                        { component: 'Container', props: { children: 'Work history repeater will go here (GridList). For now, listing most recent.', style: { color: '#888', marginBottom: '1rem' } } },
                        { component: 'GridInput', props: { label: 'Recent Team', name: 'recent_team' }, bind: 'os_user_work_history[0].team_name' },
                        { component: 'GridInput', props: { label: 'Role', name: 'recent_role' }, bind: 'os_user_work_history[0].role' }
                    ]
                },
                // Step 4: Technical Skills
                {
                    component: 'Container',
                    children: [
                        { component: 'Container', props: { children: 'Step 4: Skills', style: { marginBottom: '1.5rem', fontSize: '1.5rem' } } },
                        { component: 'GridBadgePicker', props: { label: 'Technical Skills', name: 'skills', placeholder: 'Add skill...' }, bind: 'os_user_skills.skill' }
                    ]
                },
                // Step 5: Community Vouch
                {
                    component: 'Container',
                    children: [
                        { component: 'Container', props: { children: 'Step 5: Vouch', style: { marginBottom: '1.5rem', fontSize: '1.5rem' } } },
                        { component: 'Container', props: { children: 'Community vouching system coming soon.', style: { color: '#888' } } }
                    ]
                }
            ]
        }
    ]
}
