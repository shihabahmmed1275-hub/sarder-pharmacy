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
    salePrice: number;
    generic?: string;
    company?: string;
    type?: string;
}

export default function ShortItemsPage() {
    const [mounted, setMounted] = useState(false);
    const [products, setProducts] = useState<Product[]>([]);
    const [search, setSearch] = useState('');

    // Fixed Limits in Code
    const TABLET_LIMIT = 10;
    const SYRUP_LIMIT = 1;

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
                    salePrice: Number(data[key].salePrice || 0),
                    generic: data[key].generic || '',
                    company: data[key].company || '',
                    type: data[key].type || data[key].form || '',
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
                <p style={{ color: '#ef4444', fontWeight: 'bold' }}>Loading Short Items...</p>
            </div>
        );
    }

    // Automatic limit calculation
    const isShort = (p: Product) => {
        const pName = p.name.toLowerCase();
        const pType = (p.type || '').toLowerCase();

        const isSyrupType =
            pType.includes('syrup') ||
            pType.includes('syp') ||
            pType.includes('liquid') ||
            pType.includes('suspension') ||
            pType.includes('drop') ||
            pName.includes('syrup') ||
            pName.includes('syp');

        if (isSyrupType) {
            return p.stock <= SYRUP_LIMIT;
        }

        return p.stock <= TABLET_LIMIT;
    };

    const shortItems = products.filter(isShort);

    const filteredItems = shortItems.filter(
        (p) =>
            p.name.toLowerCase().includes(search.toLowerCase()) ||
            (p.generic && p.generic.toLowerCase().includes(search.toLowerCase())) ||
            (p.company && p.company.toLowerCase().includes(search.toLowerCase()))
    );

    return (
        <div style={{ padding: '20px', maxWidth: '1100px', margin: '0 auto', fontFamily: 'system-ui, sans-serif', backgroundColor: '#f8fafc', minHeight: '100vh' }}>

            {/* Navigation Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
                <Link href="/" style={{ textDecoration: 'none', color: '#e11d48', fontWeight: 'bold', fontSize: '15px' }}>
                    ⬅️ Back to Dashboard
                </Link>
                <h2 style={{ margin: 0, color: '#1e293b', fontSize: '20px' }}>📦 Low Stock / Short Items (কম স্টক ওষুধ)</h2>
                <div style={{ width: '100px' }}></div>
            </div>

            {/* Clean Stat Card */}
            <div style={{ marginBottom: '20px' }}>
                <div style={{ background: '#fff', padding: '18px 25px', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div>
                        <span style={{ fontSize: '14px', color: '#64748b', fontWeight: 'bold' }}>মোট শর্ট ওষুধ (Short Count)</span>
                        <h1 style={{ margin: '4px 0 0 0', color: '#ef4444', fontSize: '28px' }}>{shortItems.length} টি</h1>
                    </div>
                    <span style={{ fontSize: '12px', color: '#94a3b8', fontStyle: 'italic' }}>* Tablet/Capsule ≤ 10 Pcs | Syrup/Liquid ≤ 1 Bottle</span>
                </div>
            </div>

            {/* Table Section */}
            <div style={{ background: '#fff', padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                    <h3 style={{ margin: 0, color: '#1e293b', fontSize: '16px' }}>📋 শর্ট লিস্ট ({filteredItems.length})</h3>
                    <input
                        type="text"
                        placeholder="🔍 ওষুধের নাম বা কোম্পানি খুঁজুন..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        style={{ padding: '8px 14px', borderRadius: '20px', border: '1px solid #cbd5e1', width: '250px', fontSize: '13px' }}
                    />
                </div>

                <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', textAlign: 'left' }}>
                        <thead>
                            <tr style={{ backgroundColor: '#f1f5f9', color: '#334155', borderBottom: '2px solid #e2e8f0' }}>
                                <th style={{ padding: '10px' }}>ওষুধের নাম</th>
                                <th style={{ padding: '10px' }}>জেনেরিক</th>
                                <th style={{ padding: '10px' }}>কোম্পানি</th>
                                <th style={{ padding: '10px' }}>কেনা দাম</th>
                                <th style={{ padding: '10px' }}>বিক্রি দাম</th>
                                <th style={{ padding: '10px', textAlign: 'center' }}>বর্তমান স্টক</th>
                                <th style={{ padding: '10px', textAlign: 'center' }}>স্ট্যাটাস</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredItems.length > 0 ? (
                                filteredItems.map((item) => (
                                    <tr key={item.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                        <td style={{ padding: '10px', fontWeight: 'bold', color: '#1e293b' }}>{item.name}</td>
                                        <td style={{ padding: '10px', color: '#64748b' }}>{item.generic || 'N/A'}</td>
                                        <td style={{ padding: '10px', color: '#475569' }}>{item.company || 'N/A'}</td>
                                        <td style={{ padding: '10px', color: '#334155' }}>৳ {item.buyPrice}</td>
                                        <td style={{ padding: '10px', color: '#334155' }}>৳ {item.salePrice}</td>
                                        <td style={{ padding: '10px', textAlign: 'center', fontWeight: 'bold', color: item.stock === 0 ? '#dc2626' : '#d97706' }}>
                                            {item.stock} Pcs
                                        </td>
                                        <td style={{ padding: '10px', textAlign: 'center' }}>
                                            <span style={{
                                                backgroundColor: item.stock === 0 ? '#fee2e2' : '#fef3c7',
                                                color: item.stock === 0 ? '#991b1b' : '#b45309',
                                                padding: '4px 10px',
                                                borderRadius: '20px',
                                                fontWeight: 'bold',
                                                fontSize: '11px'
                                            }}>
                                                {item.stock === 0 ? 'Stock Out' : 'Low Stock'}
                                            </span>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={7} style={{ textAlign: 'center', padding: '30px', color: '#94a3b8' }}>
                                        🎉 কোনো শর্ট আইটেম নেই, সমস্ত ওষুধের পর্যাপ্ত স্টক রয়েছে।
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