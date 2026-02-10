const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, serviceRoleKey);

const USER_ID = '885eba3f-65cf-40da-809d-196be4eaba9d'; // pjlosey

const VEHICLE = {
    name: '2009 BMW 528i',
    type: 'real',
    make: 'BMW',
    model: '528i',
    year: 2009,
    description: 'Daily driver. Unicorn spec: RWD with factory 6-Speed Manual transmission. A true driver\'s sedan. 136k miles.',
    image_url: 'https://scontent-ord5-1.xx.fbcdn.net/v/t39.30808-6/476313886_10161427670390555_8835845946394589999_n.jpg?stp=dst-jpg_p720x720_tt6&_nc_cat=104&ccb=1-7&_nc_sid=92e707&_nc_ohc=y7y1X9y5y6AAX8Q1x4-&_nc_oc=Adkz8lJz7Jz8Jz8Jz8Jz8Jz8Jz8Jz8Jz8Jz8Jz8Jz8Jz8Jz8Jz8Jz8Jz8Jz8Jz8&_nc_zt=23&_nc_ht=scontent-ord5-1.xx&_nc_gid=Aw4q4q4q4q4q4q4q4q4q4q4&oh=00_AfC-C-C-C-C-C-C-C-C-C-C&oe=65C5C5C5', // Placeholder effective URL, logic to update if needed
    metadata: {
        mileage: 136000,
        transmission: 'Manual',
        drivetrain: 'RWD',
        color: 'Siver/Grey'
    }
};

async function importVehicle() {
    console.log(`🚗 Importing BMW for user ${USER_ID}...`);

    const { data, error } = await supabase
        .from('vehicles')
        .insert({
            user_id: USER_ID,
            name: VEHICLE.name,
            type: VEHICLE.type,
            make: VEHICLE.make,
            model: VEHICLE.model,
            year: VEHICLE.year,
            description: VEHICLE.description,
            image_url: VEHICLE.image_url,
            metadata: VEHICLE.metadata,
            is_active: true
        })
        .select()
        .single();

    if (error) {
        console.error('❌ Error importing vehicle:', error.message);
    } else {
        console.log(`✅ Vehicle imported successfully!`);
        console.log(`   ID: ${data.id}`);
        console.log(`   Link (Internal): http://localhost:3000/garage/${data.id}`);
    }
}

importVehicle();
