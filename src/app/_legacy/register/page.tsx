import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import RegisterForm from './RegisterForm';

export default async function RegisterPage() {
    redirect('/join');
}
