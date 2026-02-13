'use server';

import { createClient } from '@/utils/supabase/server';
import { GarageProject, ProjectMember, ProjectTask } from '@/types/garage';
import { revalidatePath } from 'next/cache';

// --- Projects ---

export async function getProjects(vehicleId: string): Promise<GarageProject[]> {
    const supabase = await createClient();
    const { data, error } = await supabase
        .from('garage_projects')
        .select('*')
        .eq('vehicle_id', vehicleId)
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching projects:', error);
        return [];
    }

    return data as GarageProject[];
}

export async function getProject(projectId: string): Promise<GarageProject | null> {
    const supabase = await createClient();
    const { data, error } = await supabase
        .from('garage_projects')
        .select('*')
        .eq('id', projectId)
        .single();

    if (error) {
        console.error('Error fetching project:', error);
        return null;
    }

    return data as GarageProject;
}

export async function createProject(project: Partial<GarageProject>) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) throw new Error('User not authenticated');

    const { error } = await supabase
        .from('garage_projects')
        .insert({
            ...project,
            user_id: user.id,
        });

    if (error) throw error;
    revalidatePath('/dashboard/profile');
}

export async function updateProject(id: string, updates: Partial<GarageProject>) {
    const supabase = await createClient();
    const { error } = await supabase
        .from('garage_projects')
        .update(updates)
        .eq('id', id);

    if (error) throw error;
    revalidatePath(`/garage/project/${id}`);
}

export async function deleteProject(id: string) {
    const supabase = await createClient();
    const { error } = await supabase
        .from('garage_projects')
        .delete()
        .eq('id', id);

    if (error) throw error;
    revalidatePath('/dashboard/profile');
}

// --- Tasks ---

export async function getProjectTasks(projectId: string): Promise<ProjectTask[]> {
    const supabase = await createClient();
    const { data, error } = await supabase
        .from('project_tasks')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: true }); // Todo lists usually oldest first or by priority

    if (error) {
        console.error('Error fetching tasks:', error);
        return [];
    }

    return data as ProjectTask[];
}

export async function createTask(task: Partial<ProjectTask>) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) throw new Error('User not authenticated');

    const { error } = await supabase
        .from('project_tasks')
        .insert({
            ...task,
            created_by: user.id
            // assigned_user_id can be passed in 'task'
        });

    if (error) throw error;
    revalidatePath(`/garage/project/${task.project_id}`);
}

export async function updateTask(id: string, updates: Partial<ProjectTask>, projectId: string) {
    const supabase = await createClient();
    const { error } = await supabase
        .from('project_tasks')
        .update(updates)
        .eq('id', id);

    if (error) throw error;
    revalidatePath(`/garage/project/${projectId}`);
}

export async function deleteTask(id: string, projectId: string) {
    const supabase = await createClient();
    const { error } = await supabase
        .from('project_tasks')
        .delete()
        .eq('id', id);

    if (error) throw error;
    revalidatePath(`/garage/project/${projectId}`);
}

// --- Members ---

export async function getProjectMembers(projectId: string): Promise<ProjectMember[]> {
    const supabase = await createClient();
    const { data, error } = await supabase
        .from('project_members')
        .select('*, profiles:user_id(full_name, avatar_url, username)') // Join with profiles if possible, otherwise just raw
        .eq('project_id', projectId);

    if (error) {
        console.error('Error fetching members:', error);
        return [];
    }

    // Transform if we did a join, but for now let's type loosely or just return raw
    // The type definition doesn't strictly include the joined profile, I'll update that later if needed.
    return data as any[];
}

export async function inviteMember(projectId: string, email: string) {
    // This is the "viral" part. 
    // IF user exists -> add them as pending
    // IF user does not exist -> creating a pending invite in a separate table might be better, 
    // but for MVP let's just assume we only invite existing users or fail.
    // Actually, let's try to look up user by email.

    // Note: Supabase auth admin API needed to look up by email, which we can't do from client safely without service role.
    // However, if we are just adding "pending" members, maybe we just store the email in a separate invites table?
    // For MVP, let's stick to: "Enter Username" to invite. It's safer.

    // Changing plan slightly to Invite by Username for MVP simplicity unless I have an RPC for email lookup.
    // Or I can just try to insert into project_members if I know the UUID.
    // Let's implement 'addMember' by UUID for now, and the UI can handle the lookup or we just rely on knowing the ID.
    // WAIT: The plan said "Viral Loop: Inviting non-members".
    // Realistically, to invite non-members, we need an `project_invites` table { email, token, project_id }.
    // When they sign up, we check this table.
    // I'll skip the complex viral loop for the *very first* step and just focus on adding *existing* users or just placeholders.
    // Actually, I can just create a `project_members` row with `user_id` if I can find them.

    // Let's stick to basic CRUD for members first.
    return { error: "Not implemented yet" };
}

export async function addMemberByUserId(projectId: string, userId: string, role: string = 'member') {
    const supabase = await createClient();

    const { error } = await supabase
        .from('project_members')
        .insert({
            project_id: projectId,
            user_id: userId,
            role,
            status: 'pending' // They should accept it, but for MVP maybe auto-accept?
        });

    if (error) throw error;
    revalidatePath(`/garage/project/${projectId}`);
}

export async function removeMember(projectId: string, userId: string) {
    const supabase = await createClient();
    const { error } = await supabase
        .from('project_members')
        .delete()
        .match({ project_id: projectId, user_id: userId });

    if (error) throw error;
    revalidatePath(`/garage/project/${projectId}`);
}
