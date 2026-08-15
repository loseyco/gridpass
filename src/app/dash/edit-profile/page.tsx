'use client';

import React, { useEffect, useState, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/components/auth/AuthProvider';
import { db, storage, auth } from '@/lib/firebase/config';
import { sendPasswordResetEmail } from 'firebase/auth';
import { doc, getDoc, updateDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { Loader2, ArrowLeft, Camera, User } from 'lucide-react';
import Link from 'next/link';

interface UserProfile {
  display_name: string;
  username?: string;
  bio: string;
  location: string;
  avatar_url?: string;
  is_supporter?: boolean;
  home_town?: string;
  birth_town?: string;
  birthday?: string;
  billing_address?: string;
  iracing_cust_id?: string;
  social_instagram?: string;
  social_youtube?: string;
  social_tiktok?: string;
  social_facebook?: string;
  social_twitter?: string;
  socials?: {
    instagram?: string;
    youtube?: string;
    tiktok?: string;
    facebook?: string;
    twitter?: string;
  };
}

function EditProfileForm() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectUrl = searchParams.get('redirect') || '/dash';
  
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [displayName, setDisplayName] = useState('');
  const [username, setUsername] = useState('');
  const [usernameStatus, setUsernameStatus] = useState<'idle' | 'checking' | 'available' | 'taken' | 'invalid'>('idle');
  const [bio, setBio] = useState('');
  const [location, setLocation] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [uploadingImage, setUploadingImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Generic Core Personal Fields
  const [homeTown, setHomeTown] = useState('');
  const [birthTown, setBirthTown] = useState('');
  const [birthday, setBirthday] = useState('');
  const [billingAddress, setBillingAddress] = useState('');
  const [iracingCustId, setIracingCustId] = useState('');
  
  // Social Media Handles
  const [instagram, setInstagram] = useState('');
  const [youtube, setYoutube] = useState('');
  const [tiktok, setTiktok] = useState('');
  const [facebook, setFacebook] = useState('');
  const [twitter, setTwitter] = useState('');

  const [sendingReset, setSendingReset] = useState(false);
  const [resetSent, setResetSent] = useState(false);

  const handleSendResetEmail = async () => {
    if (!user?.email) return;
    setSendingReset(true);
    try {
      if (isMock) {
        setResetSent(true);
        return;
      }
      await sendPasswordResetEmail(auth, user.email);
      setResetSent(true);
    } catch (err) {
      console.error("Failed to send reset email:", err);
    } finally {
      setSendingReset(false);
    }
  };

  const isMock = typeof window !== 'undefined' && !!(window as any).__PLAYWRIGHT_MOCK__;

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (!user) return;
    const uid = user.uid;
    const fallbackName = user.displayName || user.email?.split('@')[0].toUpperCase() || 'MEMBER';
    const fallbackUser = user.email?.split('@')[0] || '';

    async function loadProfile() {
      if (isMock) {
        setProfile({
          display_name: 'PJ LOSEY',
          username: 'pjlosey',
          bio: 'Founder of Gridpass. From Engines to Protons, if it has an engine or motor, I\'m involved.',
          is_supporter: true,
          location: 'Grayslake, IL',
          home_town: 'Grayslake, IL',
          birth_town: 'Chicago, IL',
          birthday: '1990-06-15',
          billing_address: '123 Gridpass Way, Grayslake IL',
          iracing_cust_id: '21596',
          social_instagram: 'pjlosey',
          social_youtube: 'pjlosey',
          social_tiktok: 'pjlosey',
          social_facebook: '',
          social_twitter: ''
        });
        setDisplayName('PJ LOSEY');
        setUsername('pjlosey');
        setBio('Founder of Gridpass. From Engines to Protons, if it has an engine or motor, I\'m involved.');
        setLocation('Grayslake, IL');
        setHomeTown('Grayslake, IL');
        setBirthTown('Chicago, IL');
        setBirthday('1990-06-15');
        setBillingAddress('123 Gridpass Way, Grayslake IL');
        setIracingCustId('21596');
        setInstagram('pjlosey');
        setYoutube('pjlosey');
        setTiktok('pjlosey');
        setLoading(false);
        return;
      }

      try {
        const profileRef = doc(db, 'users', uid);
        const snap = await getDoc(profileRef);
        if (snap.exists()) {
          const data = snap.data() as UserProfile;
          setProfile(data);
          setDisplayName(data.display_name || fallbackName || '');
          setUsername(data.username || fallbackUser || '');
          setBio(data.bio || '');
          setLocation(data.location || '');
          setAvatarUrl(data.avatar_url || '');
          
          setHomeTown(data.home_town || '');
          setBirthTown(data.birth_town || '');
          setBirthday(data.birthday || '');
          setBillingAddress(data.billing_address || '');
          setIracingCustId(data.iracing_cust_id || '');
          setInstagram(data.social_instagram || data.socials?.instagram || '');
          setYoutube(data.social_youtube || data.socials?.youtube || '');
          setTiktok(data.social_tiktok || data.socials?.tiktok || '');
          setFacebook(data.social_facebook || data.socials?.facebook || '');
          setTwitter(data.social_twitter || data.socials?.twitter || '');
        } else {
          setDisplayName(fallbackName);
          setUsername(fallbackUser);
          setLocation('USA');
        }
      } catch (err) {
        console.error("Error fetching profile:", err);
      } finally {
        setLoading(false);
      }
    }

    loadProfile();
  }, [user]);

  // Username validation checking hook
  useEffect(() => {
    if (!user || !username) {
      setUsernameStatus('idle');
      return;
    }

    const cleanUsername = username.trim().toLowerCase();
    
    // Check regex: alphanumeric, underscores, and dashes only, 3-20 chars
    const isValid = /^[a-zA-Z0-9_-]{3,20}$/.test(cleanUsername);
    if (!isValid) {
      setUsernameStatus('invalid');
      return;
    }

    setUsernameStatus('checking');
    const delayDebounce = setTimeout(async () => {
      if (isMock) {
        if (cleanUsername === 'takenusername') {
          setUsernameStatus('taken');
        } else {
          setUsernameStatus('available');
        }
        return;
      }

      try {
        const q = query(collection(db, 'users'), where('username', '==', cleanUsername));
        const snap = await getDocs(q);
        const takenByOther = snap.docs.some(doc => doc.id !== user.uid);
        if (takenByOther) {
          setUsernameStatus('taken');
        } else {
          setUsernameStatus('available');
        }
      } catch (err) {
        console.error("Error checking username:", err);
        setUsernameStatus('idle');
      }
    }, 400);

    return () => clearTimeout(delayDebounce);
  }, [username, user]);

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    setUploadingImage(true);

    // 1. Create a local preview base64 instantly so user sees feedback
    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        setAvatarUrl(event.target.result as string);
      }
    };
    reader.readAsDataURL(file);

    // If mock mode, we are done
    if (isMock) {
      setUploadingImage(false);
      return;
    }

    // 2. Upload to Firebase Storage
    try {
      const storageRef = ref(storage, `avatars/${user.uid}/${Date.now()}_${file.name}`);
      const uploadResult = await uploadBytes(storageRef, file);
      const downloadUrl = await getDownloadURL(uploadResult.ref);
      setAvatarUrl(downloadUrl);

      // Auto-persist avatar_url & photoUrl to Firestore user document
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, {
        avatar_url: downloadUrl,
        photoUrl: downloadUrl,
        updated_at: new Date().toISOString(),
      });
    } catch (err) {
      console.error("Firebase storage upload failed, keeping base64 preview:", err);
    } finally {
      setUploadingImage(false);
    }

  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (usernameStatus === 'taken' || usernameStatus === 'invalid' || usernameStatus === 'checking') return;

    setSaving(true);

    const updatedData = {
      display_name: displayName.trim().toUpperCase(),
      username: username.trim().toLowerCase(),
      bio: bio.trim(),
      location: location.trim(),
      avatar_url: avatarUrl.trim(),
      home_town: homeTown.trim(),
      birth_town: birthTown.trim(),
      birthday: birthday.trim(),
      billing_address: billingAddress.trim(),
      iracing_cust_id: iracingCustId.trim(),
      social_instagram: instagram.trim(),
      social_youtube: youtube.trim(),
      social_tiktok: tiktok.trim(),
      social_facebook: facebook.trim(),
      social_twitter: twitter.trim(),
      socials: {
        instagram: instagram.trim(),
        youtube: youtube.trim(),
        tiktok: tiktok.trim(),
        facebook: facebook.trim(),
        twitter: twitter.trim()
      }
    };

    if (isMock) {
      setSaving(false);
      router.push(redirectUrl);
      return;
    }

    try {
      const profileRef = doc(db, 'users', user.uid);
      await updateDoc(profileRef, updatedData);
      router.push(redirectUrl);
    } catch (err) {
      console.error("Error saving profile:", err);
      setSaving(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="flex-1 bg-white text-neutral-900 flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 text-[#ff3b30] animate-spin" />
      </div>
    );
  }

  const isSupporter = profile?.is_supporter === true;
  const isSaveDisabled = saving || uploadingImage || usernameStatus === 'taken' || usernameStatus === 'invalid' || usernameStatus === 'checking';

  return (
    <div className="flex-1 bg-white text-neutral-900 flex flex-col w-full pb-10">
      
      {/* Container */}
      <div className="w-full max-w-xl mx-auto px-4 py-6 space-y-6">
        
        {/* Header Row */}
        <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
          <Link 
            href={redirectUrl} 
            className="min-h-[44px] min-w-[44px] px-3 text-xs font-bold text-neutral-500 hover:text-neutral-900 uppercase flex items-center justify-center gap-1"
          >
            <ArrowLeft className="w-4 h-4" /> Back
          </Link>
          <h2 className="text-sm font-extrabold uppercase text-neutral-900 tracking-wider">
            Edit Profile
          </h2>
          <div className="w-12"></div> {/* spacer */}
        </div>

        <form onSubmit={handleSave} className="space-y-4 w-full">
          
          {/* Profile Picture Upload Section */}
          <div className="flex flex-col items-center space-y-2">
            <div 
              onClick={() => fileInputRef.current?.click()}
              className={`w-20 h-20 rounded-full cursor-pointer group relative overflow-hidden flex items-center justify-center p-0.5 ${
                isSupporter 
                  ? 'bg-gradient-to-tr from-[#ffe066] via-[#ffb700] to-[#ff9900] gold-glow-ring' 
                  : 'bg-neutral-100 border border-neutral-200'
              }`}
            >
              <div className="w-full h-full rounded-full bg-white flex items-center justify-center overflow-hidden relative">
                {avatarUrl ? (
                  <img src={avatarUrl} alt="Avatar Preview" className="w-full h-full object-cover" />
                ) : (
                  <User className="w-8 h-8 text-neutral-400" />
                )}
                
                {/* Camera Hover Overlay */}
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  {uploadingImage ? (
                    <Loader2 className="w-5 h-5 text-white animate-spin" />
                  ) : (
                    <Camera className="w-5 h-5 text-white" />
                  )}
                </div>
              </div>
            </div>
            <button 
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="text-[9px] font-mono font-bold text-[#ff3b30] uppercase hover:underline"
            >
              {uploadingImage ? 'Uploading...' : 'Upload Photo'}
            </button>
            <input 
              type="file"
              ref={fileInputRef}
              onChange={handleImageChange}
              accept="image/*"
              className="hidden"
            />
          </div>

          {/* Display Name Input */}
          <div className="space-y-0.5">
            <label className="text-[8px] font-mono font-bold text-neutral-400 uppercase">Display Name</label>
            <input 
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="PJ LOSEY"
              className="w-full p-2 bg-neutral-50 border border-neutral-200 rounded-lg text-xs text-neutral-900 focus:outline-none focus:border-[#ff3b30]"
              required
            />
          </div>

          {/* Username/Link Input */}
          <div className="space-y-0.5">
            <label className="text-[8px] font-mono font-bold text-neutral-400 uppercase">Username / Link</label>
            <div className="relative flex items-center">
              <span className="absolute left-3 text-xs text-neutral-400 font-mono">
                gridpass.app/u/
              </span>
              <input 
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, ''))}
                placeholder="pjlosey"
                className="w-full p-2 pl-[108px] bg-neutral-50 border border-neutral-200 rounded-lg text-xs text-neutral-900 focus:outline-none focus:border-[#ff3b30]"
                required
              />
            </div>
            <div className="h-4">
              {usernameStatus === 'checking' && (
                <p className="text-[8px] font-mono font-bold text-neutral-400 uppercase">Checking availability...</p>
              )}
              {usernameStatus === 'available' && (
                <p className="text-[8px] font-mono font-bold text-neutral-900 uppercase">✓ Username is available</p>
              )}
              {usernameStatus === 'taken' && (
                <p className="text-[8px] font-mono font-bold text-[#ff3b30] uppercase">✗ Username is already taken</p>
              )}
              {usernameStatus === 'invalid' && (
                <p className="text-[8px] font-mono font-bold text-[#ff3b30] uppercase">
                  Username must be 3-20 characters (letters, numbers, _ or -)
                </p>
              )}
            </div>
          </div>

          {/* Short Bio TextArea */}
          <div className="space-y-0.5">
            <label className="text-[8px] font-mono font-bold text-neutral-400 uppercase">Short Bio</label>
            <textarea 
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Tell us about yourself..."
              rows={3}
              className="w-full p-2 bg-neutral-50 border border-neutral-200 rounded-lg text-xs text-neutral-900 focus:outline-none focus:border-[#ff3b30] resize-none"
            />
          </div>

          {/* Personal Information Section */}
          <div className="space-y-4 pt-4 border-t border-neutral-100">
            <h4 className="text-[10px] font-extrabold uppercase text-neutral-900 tracking-wider">Profile Details</h4>

            {/* Home Town */}
            <div className="space-y-0.5">
              <label className="text-[8px] font-mono font-bold text-neutral-400 uppercase">Home Town</label>
              <input 
                type="text"
                value={homeTown}
                onChange={(e) => setHomeTown(e.target.value)}
                placeholder="e.g. Grayslake, IL"
                className="w-full p-2 bg-neutral-50 border border-neutral-200 rounded-lg text-xs text-neutral-900 focus:outline-none focus:border-[#ff3b30]"
              />
            </div>

            {/* Birth Town */}
            <div className="space-y-0.5">
              <label className="text-[8px] font-mono font-bold text-neutral-400 uppercase">Birth Town</label>
              <input 
                type="text"
                value={birthTown}
                onChange={(e) => setBirthTown(e.target.value)}
                placeholder="e.g. Chicago, IL"
                className="w-full p-2 bg-neutral-50 border border-neutral-200 rounded-lg text-xs text-neutral-900 focus:outline-none focus:border-[#ff3b30]"
              />
            </div>

            {/* Birthday */}
            <div className="space-y-0.5">
              <label className="text-[8px] font-mono font-bold text-neutral-400 uppercase">Birthday</label>
              <input 
                type="date"
                value={birthday}
                onChange={(e) => setBirthday(e.target.value)}
                className="w-full p-2 bg-neutral-50 border border-neutral-200 rounded-lg text-xs text-neutral-900 focus:outline-none focus:border-[#ff3b30]"
              />
            </div>

            {/* Billing Address */}
            <div className="space-y-0.5">
              <label className="text-[8px] font-mono font-bold text-neutral-400 uppercase">Billing Address</label>
              <input 
                type="text"
                value={billingAddress}
                onChange={(e) => setBillingAddress(e.target.value)}
                placeholder="Street, City, State, ZIP"
                className="w-full p-2 bg-neutral-50 border border-neutral-200 rounded-lg text-xs text-neutral-900 focus:outline-none focus:border-[#ff3b30]"
              />
            </div>

            {/* iRacing Customer ID */}
            <div className="space-y-0.5" data-testid="iracing-cust-id-field">
              <div className="flex items-center justify-between">
                <label className="text-[8px] font-mono font-bold text-neutral-400 uppercase">
                  iRacing Customer ID (5-7 Digits)
                </label>
                {iracingCustId && (
                  <span className="text-[8px] font-mono text-neutral-400">
                    ID: #{iracingCustId}
                  </span>
                )}
              </div>
              <input 
                type="text"
                value={iracingCustId}
                onChange={(e) => setIracingCustId(e.target.value.replace(/[^0-9]/g, ''))}
                placeholder="e.g. 21596"
                className="w-full p-2 bg-neutral-50 border border-neutral-200 rounded-lg text-xs text-neutral-900 focus:outline-none focus:border-[#ff3b30] font-mono"
              />
              <div className="pt-2">
                <a
                  href={`/api/integrations/iracing/auth?redirect=/dash/edit-profile&uid=${user?.uid || ''}`}
                  className="min-h-[44px] w-full inline-flex items-center justify-center gap-2 px-4 py-2 bg-[#ff3b30] hover:bg-[#d63026] text-white text-[10px] font-mono font-bold uppercase rounded-lg transition-colors shadow-sm"
                >
                  <span>🏎️ Connect Official iRacing Account</span>
                </a>
              </div>
            </div>
          </div>

          {/* Career History Section */}
          <div className="space-y-4 pt-4 border-t border-neutral-100" data-testid="career-history-section">
            <div className="flex items-center justify-between">
              <h4 className="text-[10px] font-extrabold uppercase text-neutral-900 tracking-wider">Career History</h4>
              <Link
                href={`/exp/new?redirect=${encodeURIComponent(redirectUrl)}`}
                data-testid="add-experience-btn"
                className="min-h-[44px] px-3.5 py-2 bg-[#ff3b30] hover:bg-[#bd2925] text-white text-[9px] font-mono font-bold uppercase rounded-lg flex items-center justify-center gap-1 transition-colors shadow-sm"
              >
                + Add Experience
              </Link>
            </div>
            <p className="text-[10px] text-neutral-500 font-mono">
              Manage motorsport gigs, roles, and engineering experiences.
            </p>
          </div>

          {/* Social Media Handles Section */}
          <div className="space-y-4 pt-4 border-t border-neutral-100">
            <h4 className="text-[10px] font-extrabold uppercase text-neutral-900 tracking-wider">Social Links</h4>

            {/* Instagram */}
            <div className="space-y-0.5">
              <label className="text-[8px] font-mono font-bold text-neutral-400 uppercase">Instagram</label>
              <input 
                type="text"
                value={instagram}
                onChange={(e) => setInstagram(e.target.value)}
                placeholder="username"
                className="w-full p-2 bg-neutral-50 border border-neutral-200 rounded-lg text-xs text-neutral-900 focus:outline-none focus:border-[#ff3b30]"
              />
            </div>

            {/* YouTube */}
            <div className="space-y-0.5">
              <label className="text-[8px] font-mono font-bold text-neutral-400 uppercase">YouTube</label>
              <input 
                type="text"
                value={youtube}
                onChange={(e) => setYoutube(e.target.value)}
                placeholder="channel or @handle"
                className="w-full p-2 bg-neutral-50 border border-neutral-200 rounded-lg text-xs text-neutral-900 focus:outline-none focus:border-[#ff3b30]"
              />
            </div>

            {/* TikTok */}
            <div className="space-y-0.5">
              <label className="text-[8px] font-mono font-bold text-neutral-400 uppercase">TikTok</label>
              <input 
                type="text"
                value={tiktok}
                onChange={(e) => setTiktok(e.target.value)}
                placeholder="username"
                className="w-full p-2 bg-neutral-50 border border-neutral-200 rounded-lg text-xs text-neutral-900 focus:outline-none focus:border-[#ff3b30]"
              />
            </div>

            {/* Facebook */}
            <div className="space-y-0.5">
              <label className="text-[8px] font-mono font-bold text-neutral-400 uppercase">Facebook</label>
              <input 
                type="text"
                value={facebook}
                onChange={(e) => setFacebook(e.target.value)}
                placeholder="profile name or link"
                className="w-full p-2 bg-neutral-50 border border-neutral-200 rounded-lg text-xs text-neutral-900 focus:outline-none focus:border-[#ff3b30]"
              />
            </div>

            {/* Twitter / X */}
            <div className="space-y-0.5">
              <label className="text-[8px] font-mono font-bold text-neutral-400 uppercase">Twitter / X</label>
              <input 
                type="text"
                value={twitter}
                onChange={(e) => setTwitter(e.target.value)}
                placeholder="username"
                className="w-full p-2 bg-neutral-50 border border-neutral-200 rounded-lg text-xs text-neutral-900 focus:outline-none focus:border-[#ff3b30]"
              />
            </div>
          </div>

          {/* Security / Account Settings Section */}
          <div className="space-y-4 pt-4 border-t border-neutral-100">
            <h4 className="text-[10px] font-extrabold uppercase text-neutral-900 tracking-wider">Security & Account</h4>
            <div className="bg-neutral-50 border border-neutral-200 rounded-lg p-3 space-y-2">
              <span className="text-[8px] font-mono font-bold text-neutral-400 uppercase tracking-wider block">Account Email</span>
              <span className="text-xs font-bold text-neutral-950 block select-all">{user?.email || 'N/A'}</span>
              
              <div className="pt-1 flex items-center justify-between">
                <div>
                  <span className="text-[8px] font-mono font-bold text-neutral-400 uppercase block">Password Credentials</span>
                  <span className="text-[9px] text-neutral-500 block">Manage password security</span>
                </div>
                <button
                  type="button"
                  onClick={handleSendResetEmail}
                  disabled={sendingReset || resetSent}
                  className="min-h-[44px] min-w-[44px] px-3.5 py-2 bg-neutral-900 hover:bg-neutral-800 disabled:bg-neutral-100 text-white disabled:text-neutral-400 text-[8px] font-bold uppercase rounded-lg transition-colors cursor-pointer inline-flex items-center justify-center"
                >
                  {sendingReset ? 'Sending...' : resetSent ? 'Email Sent' : 'Reset Password'}
                </button>
              </div>
              
              {resetSent && (
                <p className="text-[8px] font-mono font-bold text-neutral-900 uppercase pt-1">
                  ✓ Check your inbox for a secure password reset link.
                </p>
              )}
            </div>
          </div>

          {/* Action Button */}
          <div className="pt-2">
            <button 
              type="submit"
              disabled={isSaveDisabled}
              className="w-full min-h-[44px] py-2.5 bg-[#ff3b30] hover:bg-[#bd2925] disabled:bg-neutral-200 text-white text-[10px] font-bold uppercase rounded-lg transition-colors flex items-center justify-center cursor-pointer"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save Profile'}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}

export default function EditProfilePage() {
  return (
    <Suspense fallback={
      <div className="flex-1 bg-white text-neutral-900 flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 text-[#ff3b30] animate-spin" />
      </div>
    }>
      <EditProfileForm />
    </Suspense>
  );
}

