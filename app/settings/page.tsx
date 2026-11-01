'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { db } from '../firebase';
import { ref, onValue, set } from 'firebase/database';

export default function SettingsPage() {
    const [mounted, setMounted] = useState(false);
    const [shopName, setShopName] = useState('');
    const [address, setAddress] = useState('');
    const [phone, setPhone] = useState('');
    const [footerMsg, setFooterMsg] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        setMounted(true);
        const shopRef = ref(db, 'shopProfile');
        onValue(shopRef, (snapshot) => {
            const data = snapshot.val();
            if (data) {
                setShopName(data.shopName || '');
                setAddress(data.address || '');
                setPhone(data.phone || '');
                setFooterMsg(data.footerMsg || '');
            }
        });
    }, []);

    const handleSaveSettings = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            await set(ref(db, 'shopProfile'), {
                shopName,
                address,
                phone,
                footerMsg,
                updatedAt: new Date().toISOString()
            });
            alert('✅ ফার্মেসি প্রোফাইল সফলভাবে আপডেট হয়েছে!');
        } catch (err) {
            console.error(err);
            alert('❌ সেভ করতে সমস্যা হয়েছে!');
        } finally {
            setLoading(false);
        }
    };

    if (!mounted) return null;

    return (
        <div style={{ backgroundColor: '#f8fafc', minHeight: '100vh', padding: '20px', fontFamily: 'system-ui, sans-serif' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '25px', maxWidth: '700px', margin: '0 auto 25px auto' }}>
                <Link href="/" style={{ textDecoration: 'none', color: '#1e293b', fontWeight: 'bold', fontSize: '16px' }}>⬅️ Dashboard</Link>
                <h2 style={{ margin: 0, color: '#0f172a', fontSize: '20px' }}>⚙️ Shop Settings Profile</h2>
                <div style={{ width: '80px' }}></div>
            </div>

            <div style={{ maxWidth: '700px', margin: '0 auto', backgroundColor: '#fff', padding: '30px', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}>
                <form onSubmit={handleSaveSettings} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
                    <div>
                        <label style={{ fontSize: '14px', fontWeight: 'bold', display: 'block', marginBottom: '6px' }}>ফার্মেসির নাম (Shop Name)</label>
                        <input
                            type="text"
                            required
                            placeholder="e.g. Sardar Medical Hall"
                            value={shopName}
                            onChange={(e) => setShopName(e.target.value)}
                            style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '14px', boxSizing: 'border-box' }}
                        />
                    </div>

                    <div>
                        <label style={{ fontSize: '14px', fontWeight: 'bold', display: 'block', marginBottom: '6px' }}>ঠিকানা (Address)</label>
                        <input
                            type="text"
                            placeholder="e.g. Gopalpur Bazar, Manda"
                            value={address}
                            onChange={(e) => setAddress(e.target.value)}
                            style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '14px', boxSizing: 'border-box' }}
                        />
                    </div>

                    <div>
                        <label style={{ fontSize: '14px', fontWeight: 'bold', display: 'block', marginBottom: '6px' }}>মোবাইল নম্বর (Phone Number)</label>
                        <input
                            type="text"
                            placeholder="e.g. 017XXXXXXXX"
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '14px', boxSizing: 'border-box' }}
                        />
                    </div>

                    <div>
                        <label style={{ fontSize: '14px', fontWeight: 'bold', display: 'block', marginBottom: '6px' }}>মেমোর নিচের বার্তা (Invoice Footer Message)</label>
                        <input
                            type="text"
                            placeholder="e.g. বিক্রিত ওষুধ ফেরত নেওয়া হয় না। ধন্যবাদ!"
                            value={footerMsg}
                            onChange={(e) => setFooterMsg(e.target.value)}
                            style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '14px', boxSizing: 'border-box' }}
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        style={{ backgroundColor: '#2563eb', color: '#fff', border: 'none', padding: '14px', borderRadius: '8px', fontWeight: 'bold', fontSize: '15px', cursor: 'pointer', marginTop: '10px' }}
                    >
                        {loading ? 'Saving...' : '💾 Save Shop Profile'}
                    </button>
                </form>
            </div>
        </div>
    );
}