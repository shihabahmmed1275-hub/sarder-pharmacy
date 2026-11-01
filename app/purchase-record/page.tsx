'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { db } from '../firebase';
import { ref, onValue } from 'firebase/database';

interface PurchaseItem {
    id: string;
    productId: string;
    productName: string;
    qty: number;
    unitBuyPrice: number;
    unitSalePrice: number;
    totalAmount: number;
    supplier: string;
    createdAt: string;
}

export default function PurchaseRecordPage() {
    const [mounted, setMounted] = useState(false);
    const [purchases, setPurchases] = useState<PurchaseItem[]>([]);
    const [search, setSearch] = useState('');

    useEffect(() => {
        setMounted(true);
        const purchaseRef = ref(db, 'purchases');
        const unsubscribe = onValue(purchaseRef, (snapshot) => {
            const data = snapshot.val();
            if (data) {
                const list: PurchaseItem[] = Object.keys(data).map((key) => ({
                    id: key,
                    productId: data[key].productId || '',
                    productName: data[key].productName || 'অজানা ওষুধ',
                    qty: Number(data[key].qty || 0),
                    unitBuyPrice: Number(data[key].unitBuyPrice || 0),
                    unitSalePrice: Number(data[key].unitSalePrice || 0),
                    totalAmount: Number(data[key].totalAmount || 0),
                    supplier: data[key].supplier || 'সাধারণ সাপ্লাইয়ার',
                    createdAt: data[key].createdAt || '',
                }));
                setPurchases(list.reverse());
            } else {
                setPurchases([]);
            }
        });

        return () => unsubscribe();
    }, []);

    const filteredPurchases = purchases.filter(
        (p) =>
            p.productName.toLowerCase().includes(search.toLowerCase()) ||
            p.supplier.toLowerCase().includes(search.toLowerCase())
    );

    const totalSpent = filteredPurchases.reduce((sum, item) => sum + item.totalAmount, 0);

    if (!mounted) {
        return (
            <div style={{ padding: '20px', fontFamily: 'system-ui, sans-serif' }}>
                <p style={{ color: '#0284c7', fontWeight: 'bold' }}>Loading Purchase Records...</p>
            </div>
        );
    }

    return (
        <div style={{ padding: '20px', maxWidth: '1100px', margin: '0 auto', fontFamily: 'system-ui, sans-serif', backgroundColor: '#f8fafc', minHeight: '100vh' }}>

            {/* Header Bar */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
                <Link href="/" style={{ textDecoration: 'none', color: '#e11d48', fontWeight: 'bold', fontSize: '15px' }}>
                    ⬅️ Back to Dashboard
                </Link>
                <h2 style={{ margin: 0, color: '#1e293b', fontSize: '20px' }}>📄 Purchase Record (ক্রয় হিসেব ও রেকর্ড)</h2>
                <div style={{ width: '100px' }}></div>
            </div>

            {/* Summary Card & Search */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
                <div style={{ backgroundColor: '#0284c7', color: '#fff', padding: '20px', borderRadius: '12px', boxShadow: '0 2px 6px rgba(0,0,0,0.06)' }}>
                    <span style={{ fontSize: '13px', opacity: 0.9, textTransform: 'uppercase', letterSpacing: '0.5px' }}>মোট ক্রয় ব্যয় (Total Spent)</span>
                    <h1 style={{ margin: '6px 0 0 0', fontSize: '28px', fontWeight: 'bold' }}>৳ {totalSpent.toFixed(2)}</h1>
                    <span style={{ fontSize: '12px', opacity: 0.8 }}>মোট {filteredPurchases.length} টি ক্রয়ের এন্ট্রি পাওয়া গেছে</span>
                </div>

                <div style={{ backgroundColor: '#fff', padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center' }}>
                    <input
                        type="text"
                        placeholder="🔍 ওষুধের নাম বা সাপ্লাইয়ার দিয়ে খুঁজুন..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        style={{ width: '100%', padding: '12px 16px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '14px', outline: 'none' }}
                    />
                </div>
            </div>

            {/* Purchase Table */}
            <div style={{ background: '#fff', padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', textAlign: 'left' }}>
                        <thead>
                            <tr style={{ backgroundColor: '#f1f5f9', color: '#334155', borderBottom: '2px solid #e2e8f0' }}>
                                <th style={{ padding: '12px' }}>তারিখ ও সময়</th>
                                <th style={{ padding: '12px' }}>ওষুধের নাম</th>
                                <th style={{ padding: '12px' }}>সাপ্লাইয়ার / কোম্পানি</th>
                                <th style={{ padding: '12px', textAlign: 'center' }}>পরিমাণ (Qty)</th>
                                <th style={{ padding: '12px' }}>একক কেনা দাম</th>
                                <th style={{ padding: '12px' }}>মোট বিল</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredPurchases.length > 0 ? (
                                filteredPurchases.map((item) => (
                                    <tr key={item.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                        <td style={{ padding: '12px', color: '#64748b', fontSize: '12px' }}>
                                            {item.createdAt ? new Date(item.createdAt).toLocaleString('bn-BD') : 'N/A'}
                                        </td>
                                        <td style={{ padding: '12px', fontWeight: 'bold', color: '#0f172a' }}>
                                            {item.productName}
                                        </td>
                                        <td style={{ padding: '12px', color: '#475569' }}>
                                            {item.supplier}
                                        </td>
                                        <td style={{ padding: '12px', textAlign: 'center', fontWeight: 'bold', color: '#0284c7' }}>
                                            {item.qty} Pcs
                                        </td>
                                        <td style={{ padding: '12px', color: '#334155' }}>
                                            ৳ {item.unitBuyPrice}
                                        </td>
                                        <td style={{ padding: '12px', fontWeight: 'bold', color: '#16a34a' }}>
                                            ৳ {item.totalAmount}
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={6} style={{ textAlign: 'center', padding: '30px', color: '#94a3b8' }}>
                                        কোনো ক্রয়ের রেকর্ড পাওয়া যায়নি
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