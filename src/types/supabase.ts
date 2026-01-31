export type Json =
    | string
    | number
    | boolean
    | null
    | { [key: string]: Json | undefined }
    | Json[]

export type Database = {
    public: {
        Tables: {
            profiles: {
                Row: {
                    id: string
                    username: string | null
                    full_name: string | null
                    avatar_url: string | null
                    role: Database["public"]["Enums"]["user_role"]
                    created_at: string | null
                    updated_at: string | null
                    // ... other fields implicitly supported via JSON or we can expand if needed but role is key here
                    real_world_info: Json
                    driver_info: Json
                    mechanic_info: Json
                    physical_info: Json
                    logistics_info: Json
                    emergency_contact: Json
                }
                Insert: {
                    id: string
                    username?: string | null
                    full_name?: string | null
                    avatar_url?: string | null
                    role?: Database["public"]["Enums"]["user_role"]
                    real_world_info?: Json
                    driver_info?: Json
                    mechanic_info?: Json
                    physical_info?: Json
                    logistics_info?: Json
                    emergency_contact?: Json
                }
                Update: {
                    id?: string
                    username?: string | null
                    full_name?: string | null
                    avatar_url?: string | null
                    role?: Database["public"]["Enums"]["user_role"]
                    real_world_info?: Json
                    driver_info?: Json
                    mechanic_info?: Json
                    physical_info?: Json
                    logistics_info?: Json
                    emergency_contact?: Json
                }
            }
            // ... other tables mapping omitted for brevity as we focus on profiles.role
        }
        Enums: {
            user_role: "superadmin" | "admin" | "founder" | "member" | "user"
            classified_category: "Vehicles" | "Electronics" | "Tools" | "Parts" | "Other"
            classified_status: "active" | "sold" | "draft" | "hidden"
        }
    }
}
