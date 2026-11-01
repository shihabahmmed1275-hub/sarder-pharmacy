'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { db } from '../firebase';
import { ref, get } from 'firebase/database';

export default function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');
    const router = useRouter();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setErrorMsg('');

        try {
            // ১. ফায়ারবেসের users নোড থেকে ডাটা চেক করা
            const usersRef = ref(db, 'users');
            const snapshot = await get(usersRef);

            if (!snapshot.exists()) {
                setErrorMsg('❌ ডাটাবেজে কোনো ইউজার তথ্য পাওয়া যায়নি!');
                setLoading(false);
                return;
            }

            const usersData = snapshot.val();
            let matchedUserKey = null;
            let currentUser = null;

            // ডাটাবেজের সব ইউজারের সাথে ইমেইল ও পাসওয়ার্ড মেলানো
            Object.entries(usersData).forEach(([key, val]: [string, any]) => {
                if (val.email === email && val.password === password) {
                    matchedUserKey = key;
                    currentUser = val;
                }
            });

            if (!currentUser) {
                setErrorMsg('❌ ভুল ইমেইল অথবা পাসওয়ার্ড!');
                setLoading(false);
                return;
            }

            // ২. ১ বছরের সাবস্ক্রিপশন মেয়াদ চেক করা
            const now = new Date();
            const expiryDate = new Date(currentUser.subscriptionExpiry);

            if (now > expiryDate) {
                setErrorMsg('⚠️ আপনার ১ বছরের সাবস্ক্রিপশনের মেয়াদ শেষ হয়ে গেছে! সফটওয়্যার চালু করতে রিনিউ করুন।');
                setLoading(false);
                return;
            }

            // ৩. অ্যাকাউন্ট স্ট্যাটাস চেক করা
            if (currentUser.status !== 'active') {
                setErrorMsg('🚫 আপনার অ্যাকাউন্টটি অ্যাডমিন দ্বারা বন্ধ করা হয়েছে।');
                setLoading(false);
                return;
            }

            // ৪. সফল লগইন হলে লোকাল স্টোরেজে সেশন সেভ করা
            localStorage.setItem('userAuth', JSON.stringify({
                role: currentUser.role,
                name: currentUser.email,
                email: currentUser.email,
                isLoggedIn: true
            }));

            alert('✅ সফলভাবে লগইন হয়েছে!');
            router.push('/');
        } catch (err) {
            console.error(err);
            setErrorMsg('লগইন করতে সার্ভারে সমস্যা হয়েছে!');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{
            backgroundColor: '#0f172a',
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontFamily: 'system-ui, sans-serif',
            padding: '20px'
        }}>
            <div style={{
                backgroundColor: '#ffffff',
                width: '100%',
                maxWidth: '420px',
                padding: '35px 30px',
                borderRadius: '16px',
                boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.3), 0 8px 10px -6px rgba(0, 0, 0, 0.3)'
            }}>

                {/* Header */}
                <div style={{ textAlign: 'center', marginBottom: '28px' }}>
                    <div style={{ fontSize: '40px', marginBottom: '10px' }}>🏥</div>
                    <h2 style={{ margin: '0 0 6px 0', color: '#0f172a', fontSize: '22px', fontWeight: 'bold' }}>
                        Pharmacy Management
                    </h2>
                    <p style={{ margin: 0, color: '#64748b', fontSize: '13px' }}>
                        সিস্টেমে প্রবেশ করতে সাইন ইন করুন
                    </p>
                </div>

                {/* Error Alert Box */}
                {errorMsg && (
                    <div style={{
                        color: '#dc2626',
                        backgroundColor: '#fef2f2',
                        border: '1px solid #fecaca',
                        padding: '10px 14px',
                        borderRadius: '8px',
                        fontSize: '13px',
                        marginBottom: '18px',
                        fontWeight: '600',
                        textAlign: 'center',
                        lineHeight: '1.5'
                    }}>
                        {errorMsg}
                    </div>
                )}

                {/* Form */}
                <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
                    <div>
                        <label style={{ fontSize: '13px', fontWeight: '600', color: '#334155', display: 'block', marginBottom: '6px' }}>
                            ইমেইল অ্যাড্রেস
                        </label>
                        <input
                            type="email"
                            required
                            placeholder="sardarpharmacy1@gmail.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            style={{
                                width: '100%',
                                padding: '12px',
                                borderRadius: '8px',
                                border: '1px solid #cbd5e1',
                                fontSize: '14px',
                                outline: 'none',
                                boxSizing: 'border-box'
                            }}
                        />
                    </div>

                    <div>
                        <label style={{ fontSize: '13px', fontWeight: '600', color: '#334155', display: 'block', marginBottom: '6px' }}>
                            পাসওয়ার্ড
                        </label>
                        <input
                            type="password"
                            required
                            placeholder="••••••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            style={{
                                width: '100%',
                                padding: '12px',
                                borderRadius: '8px',
                                border: '1px solid #cbd5e1',
                                fontSize: '14px',
                                outline: 'none',
                                boxSizing: 'border-box'
                            }}
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        style={{
                            backgroundColor: '#2563eb',
                            color: '#ffffff',
                            border: 'none',
                            padding: '13px',
                            borderRadius: '8px',
                            fontWeight: 'bold',
                            fontSize: '15px',
                            cursor: loading ? 'not-allowed' : 'pointer',
                            marginTop: '6px',
                            transition: 'background 0.2s'
                        }}
                    >
                        {loading ? 'যাচাই করা হচ্ছে...' : '🔒 সাইন ইন (Login)'}
                    </button>
                </form>

                {/* Info Box */}
                <div style={{
                    marginTop: '25px',
                    padding: '12px',
                    backgroundColor: '#f1f5f9',
                    borderRadius: '8px',
                    fontSize: '12px',
                    color: '#475569',
                    lineHeight: '1.6'
                }}>
                    <strong>🔑 ফায়ারবেস ডাটাবেজ একাউন্ট:</strong><br />
                    • <b>Email:</b> sardarpharmacy1@gmail.com<br />
                    • <b>Password:</b> 123456
                </div>

            </div>
        </div>
    );
}