'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { db } from '../firebase';
import { ref, onValue, set, push, remove } from 'firebase/database';

export default function UsersManagementPage() {
    const [mounted, setMounted] = useState(false);
    const [usersList, setUsersList] = useState<any[]>([]);
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [role, setRole] = useState<'Admin' | 'Cashier'>('Cashier');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        setMounted(true);
        const usersRef = ref(db, 'shopUsers');
        onValue(usersRef, (snapshot) => {
            const data = snapshot.val();
            if (data) {
                const list = Object.keys(data).map((key) => ({
                    id: key,
                    ...data[key],
                }));
                setUsersList(list);
            } else {
                setUsersList([]);
            }
        });
    }, []);

    const handleAddUser = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const usersRef = ref(db, 'shopUsers');
            const newUserRef = push(usersRef);
            await set(newUserRef, {
                name,
                email,
                password,
                role,
                createdAt: new Date().toISOString()
            });
            alert('✅ নতুন স্টাফ সফলভাবে যুক্ত হয়েছে!');
            setName('');
            setEmail('');
            setPassword('');
            setRole('Cashier');
        } catch (err) {
            console.error(err);
            alert('❌ স্টাফ যুক্ত করতে সমস্যা হয়েছে!');
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteUser = async (id: string) => {
        if (confirm('⚠️ আপনি কি নিশ্চিতভাবে এই ইউজারকে ডিলিট করতে চান?')) {
            try {
                await remove(ref(db, `shopUsers/${id}`));
                alert('✅ ইউজার ডিলিট করা হয়েছে!');
            } catch (err) {
                console.error(err);
                alert('❌ ডিলিট করতে সমস্যা হয়েছে!');
            }
        }
    };

    if (!mounted) return null;

    return (
        <div style={{ backgroundColor: '#f8fafc', minHeight: '100vh', padding: '20px', fontFamily: 'system-ui, sans-serif' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '25px', maxWidth: '800px', margin: '0 auto 25px auto' }}>
                <Link href="/" style={{ textDecoration: 'none', color: '#1e293b', fontWeight: 'bold', fontSize: '16px' }}>⬅️ Dashboard</Link>
                <h2 style={{ margin: 0, color: '#0f172a', fontSize: '20px' }}>👥 Staff & User Management</h2>
                <div style={{ width: '80px' }}></div>
            </div>

            <div style={{ maxWidth: '800px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '20px' }}>

                {/* ফর্ম: নতুন ইউজার যোগ করার জন্য */}
                <div style={{ backgroundColor: '#fff', padding: '25px', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}>
                    <h3 style={{ margin: '0 0 15px 0', fontSize: '16px', color: '#1e293b' }}>➕ নতুন ক্যাশিয়ার বা স্টাফ যুক্ত করুন</h3>
                    <form onSubmit={handleAddUser} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                        <div>
                            <label style={{ fontSize: '13px', fontWeight: 'bold', display: 'block', marginBottom: '5px' }}>স্টাফের নাম (Name)</label>
                            <input
                                type="text"
                                required
                                placeholder="e.g. Rahim Ahmed"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '14px', boxSizing: 'border-box' }}
                            />
                        </div>

                        <div>
                            <label style={{ fontSize: '13px', fontWeight: 'bold', display: 'block', marginBottom: '5px' }}>ইমেইল / আইডি (Email/ID)</label>
                            <input
                                type="email"
                                required
                                placeholder="e.g. rahim@shop.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '14px', boxSizing: 'border-box' }}
                            />
                        </div>

                        <div>
                            <label style={{ fontSize: '13px', fontWeight: 'bold', display: 'block', marginBottom: '5px' }}>পাসওয়ার্ড (Password)</label>
                            <input
                                type="text"
                                required
                                placeholder="e.g. 123456"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '14px', boxSizing: 'border-box' }}
                            />
                        </div>

                        <div>
                            <label style={{ fontSize: '13px', fontWeight: 'bold', display: 'block', marginBottom: '5px' }}>রোল (Role)</label>
                            <select
                                value={role}
                                onChange={(e) => setRole(e.target.value as any)}
                                style={{ width: '100%', padding: '11px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '14px', backgroundColor: '#fff', fontWeight: 'bold' }}
                            >
                                <option value="Cashier">🛒 Cashier (POS Only)</option>
                                <option value="Admin">🔑 Admin (Full Access)</option>
                            </select>
                        </div>

                        <div style={{ gridColumn: 'span 2' }}>
                            <button
                                type="submit"
                                disabled={loading}
                                style={{ width: '100%', backgroundColor: '#2563eb', color: '#fff', border: 'none', padding: '12px', borderRadius: '8px', fontWeight: 'bold', fontSize: '14px', cursor: 'pointer' }}
                            >
                                {loading ? 'Adding...' : '💾 Save Staff Account'}
                            </button>
                        </div>
                    </form>
                </div>

                {/* ইউজার লিস্ট টেবিল */}
                <div style={{ backgroundColor: '#fff', padding: '25px', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}>
                    <h3 style={{ margin: '0 0 15px 0', fontSize: '16px', color: '#1e293b' }}>📋 বর্তমান স্টাফ তালিকা ({usersList.length})</h3>
                    {usersList.length === 0 ? (
                        <p style={{ color: '#64748b', fontSize: '13px', textAlign: 'center', margin: '20px 0' }}>কোনো স্টাফ অ্যাকাউন্ট পাওয়া যায়নি। উপরে ফর্ম থেকে নতুন স্টাফ যুক্ত করুন।</p>
                    ) : (
                        <div style={{ overflowX: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
                                <thead>
                                    <tr style={{ backgroundColor: '#f1f5f9', color: '#334155' }}>
                                        <th style={{ padding: '10px', borderBottom: '2px solid #e2e8f0' }}>নাম</th>
                                        <th style={{ padding: '10px', borderBottom: '2px solid #e2e8f0' }}>ইমেইল</th>
                                        <th style={{ padding: '10px', borderBottom: '2px solid #e2e8f0' }}>রোল</th>
                                        <th style={{ padding: '10px', borderBottom: '2px solid #e2e8f0', textAlign: 'center' }}>অ্যাকশন</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {usersList.map((u) => (
                                        <tr key={u.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                            <td style={{ padding: '10px', fontWeight: 'bold', color: '#0f172a' }}>{u.name}</td>
                                            <td style={{ padding: '10px', color: '#64748b' }}>{u.email}</td>
                                            <td style={{ padding: '10px' }}>
                                                <span style={{ backgroundColor: u.role === 'Admin' ? '#fef2f2' : '#f0f9ff', color: u.role === 'Admin' ? '#ef4444' : '#0284c7', padding: '3px 8px', borderRadius: '12px', fontSize: '11px', fontWeight: 'bold' }}>
                                                    {u.role}
                                                </span>
                                            </td>
                                            <td style={{ padding: '10px', textAlign: 'center' }}>
                                                <button
                                                    onClick={() => handleDeleteUser(u.id)}
                                                    style={{ backgroundColor: '#ef4444', color: '#fff', border: 'none', padding: '6px 10px', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold' }}
                                                >
                                                    🗑️ Delete
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

            </div>
        </div>
    );
}