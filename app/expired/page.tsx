'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { db } from '../firebase';
import { ref, onValue } from 'firebase/database';

interface Product {
    id: string;
    name: string;
    stock: number;
    buyPrice: number;
    expiryDate?: string; // Format: YYYY-MM or YYYY-MM-DD
    company?: string;
    generic?: string;
}

export default function ExpiredPage() {
    const [mounted, setMounted] = useState(false);
    const [products, setProducts] = useState<Product[]>([]);
    const [search, setSearch] = useState('');
    const [filterType, setFilterType] = useState<'all' | 'expired' | 'near'>('all');

    useEffect(() => {
        setMounted(true);
        const productsRef = ref(db, 'products');
        const unsubscribe = onValue(productsRef, (snapshot) => {
            const data = snapshot.val();
            if (data) {
                const list: Product[] = Object.keys(data).map((key) => ({
                    id: key,
                    name: data[key].name || 'Unknown',
                    stock: Number(data[key].stock || 0),
                    buyPrice: Number(data[key].buyPrice || data[key].costPrice || 0),
                    expiryDate: data[key].expiryDate || data[key].expiry || '',
                    company: data[key].company || '',
                    generic: data[key].generic || '',
                }));
                setProducts(list);
            } else {
                setProducts([]);
            }
        });

        return () => unsubscribe();
    }, []);

    if (!mounted) {
        return (
            <div style={{ padding: '20px', fontFamily: 'system-ui, sans-serif' }}>
                <p style={{ color: '#ef4444', fontWeight: 'bold' }}>Loading Expired Medicine Tracker...</p>
            </div>
        );
    }

    const today = new Date();

    // Helper to categorize expiry status
    const getExpiryStatus = (expStr?: string) => {
        if (!expStr) return 'unknown';
        const expDate = new Date(expStr);

        // Check if date is invalid
        if (isNaN(expDate.getTime())) return 'unknown';

        // Difference in days
        const diffTime = expDate.getTime() - today.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays <= 0) return 'expired';
        if (diffDays <= 60) return 'near'; // Within 60 days
        return 'ok';
    };

    const expiredList = products.filter((p) => getExpiryStatus(p.expiryDate) === 'expired' && p.stock > 0);
    const nearExpiryList = products.filter((p) => getExpiryStatus(p.expiryDate) === 'near' && p.stock > 0);

    // Total Cost Loss Calculation for Expired Items
    const totalExpiredLoss = expiredList.reduce((acc, p) => acc + p.stock * p.buyPrice, 0);

    // Display List Filter
    const displayProducts = products.filter((p) => {
        const status = getExpiryStatus(p.expiryDate);
        if (p.stock <= 0) return false;

        const matchesSearch =
            p.name.toLowerCase().includes(search.toLowerCase()) ||
            (p.company && p.company.toLowerCase().includes(search.toLowerCase()));

        if (!matchesSearch) return false;

        if (filterType === 'expired') return status === 'expired';
        if (filterType === 'near') return status === 'near';
        return status === 'expired' || status === 'near';
    });

    return (
        <div style={{ padding: '20px', maxWidth: '1100px', margin: '0 auto', fontFamily: 'system-ui, sans-serif', backgroundColor: '#f8fafc', minHeight: '100vh' }}>

            {/* Navigation Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
                <Link href="/" style={{ textDecoration: 'none', color: '#e11d48', fontWeight: 'bold', fontSize: '15px' }}>
                    ⬅️ Back to Dashboard
                </Link>
                <h2 style={{ margin: 0, color: '#1e293b', fontSize: '20px' }}>📅 Expired & Near Expiry Medicines</h2>
                <div style={{ width: '100px' }}></div>
            </div>

            {/* Stats Summary Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px', marginBottom: '25px' }}>

                {/* Expired Count Card */}
                <div style={{ background: '#fff', padding: '20px', borderRadius: '12px', border: '1px solid #fee2e2', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                    <span style={{ fontSize: '13px', color: '#dc2626', fontWeight: 'bold' }}>⚠️ মেয়াদ শেষ হওয়া ওষুধ (Expired)</span>
                    <h1 style={{ margin: '8px 0 0 0', color: '#dc2626', fontSize: '32px' }}>{expiredList.length} টি</h1>
                    <span style={{ fontSize: '12px', color: '#991b1b', marginTop: '4px', display: 'block' }}>
                        মোট ক্ষতি (কেনা দামে): ৳ {totalExpiredLoss.toFixed(2)}
                    </span>
                </div>

                {/* Near Expiry Count Card */}
                <div style={{ background: '#fff', padding: '20px', borderRadius: '12px', border: '1px solid #fef3c7', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                    <span style={{ fontSize: '13px', color: '#d97706', fontWeight: 'bold' }}>⏳ দ্রুত মেয়াদ শেষ হবে (আগামী ২ মাস)</span>
                    <h1 style={{ margin: '8px 0 0 0', color: '#d97706', fontSize: '32px' }}>{nearExpiryList.length} টি</h1>
                    <span style={{ fontSize: '12px', color: '#b45309', marginTop: '4px', display: 'block' }}>
                        * দ্রুত বিক্রির চেষ্টা করুন বা কোম্পানিতে ফেরত দিন
                    </span>
                </div>

            </div>

            {/* Table Section */}
            <div style={{ background: '#fff', padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>

                {/* Controls Bar */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px', flexWrap: 'wrap', gap: '10px' }}>

                    {/* Tab Filters */}
                    <div style={{ display: 'flex', gap: '8px' }}>
                        <button
                            onClick={() => setFilterType('all')}
                            style={{
                                padding: '6px 14px',
                                borderRadius: '20px',
                                border: 'none',
                                fontWeight: 'bold',
                                fontSize: '12px',
                                cursor: 'pointer',
                                backgroundColor: filterType === 'all' ? '#1e293b' : '#f1f5f9',
                                color: filterType === 'all' ? '#fff' : '#475569',
                            }}
                        >
                            সব দেখান ({expiredList.length + nearExpiryList.length})
                        </button>
                        <button
                            onClick={() => setFilterType('expired')}
                            style={{
                                padding: '6px 14px',
                                borderRadius: '20px',
                                border: 'none',
                                fontWeight: 'bold',
                                fontSize: '12px',
                                cursor: 'pointer',
                                backgroundColor: filterType === 'expired' ? '#dc2626' : '#fee2e2',
                                color: filterType === 'expired' ? '#fff' : '#991b1b',
                            }}
                        >
                            মেয়াদ শেষ ({expiredList.length})
                        </button>
                        <button
                            onClick={() => setFilterType('near')}
                            style={{
                                padding: '6px 14px',
                                borderRadius: '20px',
                                border: 'none',
                                fontWeight: 'bold',
                                fontSize: '12px',
                                cursor: 'pointer',
                                backgroundColor: filterType === 'near' ? '#d97706' : '#fef3c7',
                                color: filterType === 'near' ? '#fff' : '#b45309',
                            }}
                        >
                            মেয়াদ কাছাকাছি ({nearExpiryList.length})
                        </button>
                    </div>

                    <input
                        type="text"
                        placeholder="🔍 ওষুধের নাম বা কোম্পানি খুঁজুন..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        style={{ padding: '8px 14px', borderRadius: '20px', border: '1px solid #cbd5e1', width: '230px', fontSize: '13px' }}
                    />
                </div>

                {/* Table */}
                <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', textAlign: 'left' }}>
                        <thead>
                            <tr style={{ backgroundColor: '#f1f5f9', color: '#334155', borderBottom: '2px solid #e2e8f0' }}>
                                <th style={{ padding: '10px' }}>ওষুধের নাম</th>
                                <th style={{ padding: '10px' }}>কোম্পানি</th>
                                <th style={{ padding: '10px', textAlign: 'center' }}>বর্তমান স্টক</th>
                                <th style={{ padding: '10px' }}>একক কেনা দাম</th>
                                <th style={{ padding: '10px' }}>মেয়াদ শেষ তারিখ</th>
                                <th style={{ padding: '10px', textAlign: 'center' }}>অবস্থা (Status)</th>
                            </tr>
                        </thead>
                        <tbody>
                            {displayProducts.length > 0 ? (
                                displayProducts.map((item) => {
                                    const status = getExpiryStatus(item.expiryDate);
                                    return (
                                        <tr key={item.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                            <td style={{ padding: '10px', fontWeight: 'bold', color: '#1e293b' }}>{item.name}</td>
                                            <td style={{ padding: '10px', color: '#475569' }}>{item.company || 'N/A'}</td>
                                            <td style={{ padding: '10px', textAlign: 'center', fontWeight: 'bold', color: '#1e293b' }}>
                                                {item.stock} Pcs
                                            </td>
                                            <td style={{ padding: '10px', color: '#334155' }}>৳ {item.buyPrice}</td>
                                            <td style={{ padding: '10px', fontWeight: 'bold', color: status === 'expired' ? '#dc2626' : '#d97706' }}>
                                                {item.expiryDate || 'তারিখ দেওয়া নেই'}
                                            </td>
                                            <td style={{ padding: '10px', textAlign: 'center' }}>
                                                <span
                                                    style={{
                                                        backgroundColor: status === 'expired' ? '#fee2e2' : '#fef3c7',
                                                        color: status === 'expired' ? '#991b1b' : '#b45309',
                                                        padding: '4px 10px',
                                                        borderRadius: '20px',
                                                        fontWeight: 'bold',
                                                        fontSize: '11px',
                                                    }}
                                                >
                                                    {status === 'expired' ? '⛔ Expired' : '⚠️ Near Expiry'}
                                                </span>
                                            </td>
                                        </tr>
                                    );
                                })
                            ) : (
                                <tr>
                                    <td colSpan={6} style={{ textAlign: 'center', padding: '30px', color: '#94a3b8' }}>
                                        🎉 কোনো মেয়াদোত্তীর্ণ বা ঝুঁকিপূর্ণ ওষুধ পাওয়া যায়নি!
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

            </div>

        </div>
    );
}