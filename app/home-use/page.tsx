'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { db } from '../firebase';
import { ref, onValue, push, set, update } from 'firebase/database';

interface Product {
    id: string;
    name: string;
    stock: number;
    buyPrice: number;
}

interface HomeUseRecord {
    id: string;
    productName: string;
    qty: number;
    unitBuyPrice: number;
    totalCost: number;
    createdAt: string;
    note?: string;
}

export default function HomeUsePage() {
    const [mounted, setMounted] = useState(false);
    const [products, setProducts] = useState<Product[]>([]);
    const [records, setRecords] = useState<HomeUseRecord[]>([]);

    // Form States
    const [selectedProductId, setSelectedProductId] = useState('');
    const [qty, setQty] = useState('');
    const [note, setNote] = useState('');
    const [search, setSearch] = useState('');

    useEffect(() => {
        setMounted(true);

        // Load Products
        const productsRef = ref(db, 'products');
        const unSubProducts = onValue(productsRef, (snapshot) => {
            const data = snapshot.val();
            if (data) {
                const list: Product[] = Object.keys(data).map((key) => ({
                    id: key,
                    name: data[key].name || 'Unknown',
                    stock: Number(data[key].stock || 0),
                    buyPrice: Number(data[key].buyPrice || data[key].costPrice || 0),
                }));
                setProducts(list);
            }
        });

        // Load Home Use Records
        const homeUseRef = ref(db, 'homeUse');
        const unSubHomeUse = onValue(homeUseRef, (snapshot) => {
            const data = snapshot.val();
            if (data) {
                const list: HomeUseRecord[] = Object.keys(data).map((key) => ({
                    id: key,
                    ...data[key],
                    qty: Number(data[key].qty || 0),
                    totalCost: Number(data[key].totalCost || 0),
                }));
                setRecords(list.reverse());
            } else {
                setRecords([]);
            }
        });

        return () => {
            unSubProducts();
            unSubHomeUse();
        };
    }, []);

    const handleAddHomeUse = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedProductId || !qty) {
            alert('ওষুধ এবং পরিমাণ সঠিকভাবে দিন!');
            return;
        }

        const numQty = Number(qty);
        if (isNaN(numQty) || numQty <= 0) {
            alert('সঠিক পরিমাণ লিখুন!');
            return;
        }

        const prod = products.find((p) => p.id === selectedProductId);
        if (!prod) return;

        if (prod.stock < numQty) {
            alert(`স্টকে পর্যাপ্ত ওষুধ নেই! বর্তমান স্টক: ${prod.stock} Pcs`);
            return;
        }

        const totalCost = prod.buyPrice * numQty;
        const nowIso = new Date().toISOString();

        try {
            const homeUseRef = ref(db, 'homeUse');
            const newRecordRef = push(homeUseRef);
            await set(newRecordRef, {
                productId: prod.id,
                productName: prod.name,
                qty: numQty,
                unitBuyPrice: prod.buyPrice,
                totalCost,
                note: note || 'পারিবারিক প্রয়োজন',
                createdAt: nowIso,
            });

            const newStock = prod.stock - numQty;
            await update(ref(db, `products/${prod.id}`), {
                stock: newStock,
            });

            setSelectedProductId('');
            setQty('');
            setNote('');
            alert(`✅ পারিবারিক খরচে যুক্ত হয়েছে! কেনা দাম খরচ: ৳${totalCost.toFixed(2)}`);
        } catch (err) {
            console.error(err);
            alert('সেভ করতে সমস্যা হয়েছে!');
        }
    };

    const filteredRecords = records.filter((r) =>
        r.productName.toLowerCase().includes(search.toLowerCase())
    );

    const totalHomeCostThisMonth = records.reduce((acc, r) => acc + r.totalCost, 0);

    const formatDate = (isoString: string) => {
        if (!isoString) return '-';
        try {
            const d = new Date(isoString);
            return `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()} ${d.getHours()}:${d.getMinutes().toString().padStart(2, '0')}`;
        } catch {
            return isoString;
        }
    };

    if (!mounted) {
        return (
            <div style={{ padding: '20px', maxWidth: '1000px', margin: '0 auto', fontFamily: 'system-ui, sans-serif' }}>
                <p style={{ color: '#d97706', fontWeight: 'bold' }}>Loading Home Use Module...</p>
            </div>
        );
    }

    return (
        <div style={{ padding: '20px', maxWidth: '1000px', margin: '0 auto', fontFamily: 'system-ui, sans-serif', backgroundColor: '#f8fafc', minHeight: '100vh' }}>

            {/* Navigation Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
                <Link href="/" style={{ textDecoration: 'none', color: '#e11d48', fontWeight: 'bold', fontSize: '15px' }}>
                    ⬅️ Back to Dashboard
                </Link>
                <h2 style={{ margin: 0, color: '#1e293b', fontSize: '20px' }}>🏠 পারিবারিক ব্যবহারের ওষুধ (Home Use)</h2>
                <div style={{ width: '100px' }}></div>
            </div>

            {/* Top Grid: Stats & Form */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px', marginBottom: '25px' }}>

                {/* Total Cost Stat Card */}
                <div style={{ background: '#fff', padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                    <span style={{ fontSize: '14px', color: '#64748b', fontWeight: 'bold' }}>বাড়ির মোট ব্যবহৃত ওষুধের মূল্য (কেনা দামে)</span>
                    <h1 style={{ margin: '10px 0 0 0', color: '#d97706', fontSize: '32px' }}>৳ {totalHomeCostThisMonth.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</h1>
                    <span style={{ marginTop: '8px', fontSize: '12px', color: '#94a3b8' }}>* এই পরিমাণ অর্থ মাস শেষে মোট প্রফিট (Profit) থেকে স্বয়ংক্রিয়ভাবে বিয়োগ হবে।</span>
                </div>

                {/* Add Home Use Form */}
                <div style={{ background: '#fff', padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                    <h3 style={{ margin: '0 0 15px 0', color: '#1e293b', fontSize: '16px' }}>➕ বাড়িতে নেওয়া ওষুধ এন্ট্রি করুন</h3>
                    <form onSubmit={handleAddHomeUse} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>

                        <select
                            value={selectedProductId}
                            onChange={(e) => setSelectedProductId(e.target.value)}
                            required
                            style={{ padding: '9px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                        >
                            <option value="">-- ওষুধ সিলেক্ট করুন --</option>
                            {products.map((p) => (
                                <option key={p.id} value={p.id}>
                                    {p.name} (স্টক: {p.stock} Pcs | কেনা দাম: ৳{p.buyPrice})
                                </option>
                            ))}
                        </select>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                            <input
                                type="number"
                                placeholder="পরিমাণ (Qty Pcs) *"
                                value={qty}
                                onChange={(e) => setQty(e.target.value)}
                                required
                                style={{ padding: '9px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                            />
                            <input
                                type="text"
                                placeholder="নোট (ঐচ্ছিক, e.g. আম্মার জন্য)"
                                value={note}
                                onChange={(e) => setNote(e.target.value)}
                                style={{ padding: '9px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                            />
                        </div>

                        <button
                            type="submit"
                            style={{ padding: '10px', backgroundColor: '#d97706', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', fontSize: '14px', marginTop: '5px' }}
                        >
                            স্টক থেকে বাদ ও সেভ করুন
                        </button>
                    </form>
                </div>

            </div>

            {/* History Table */}
            <div style={{ background: '#fff', padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                    <h3 style={{ margin: 0, color: '#1e293b', fontSize: '16px' }}>📋 বাড়ির খরচের খাতা ({filteredRecords.length})</h3>
                    <input
                        type="text"
                        placeholder="🔍 ওষুধের নাম খুঁজুন..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        style={{ padding: '8px 14px', borderRadius: '20px', border: '1px solid #cbd5e1', width: '220px', fontSize: '13px' }}
                    />
                </div>

                <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', textAlign: 'left' }}>
                        <thead>
                            <tr style={{ backgroundColor: '#f1f5f9', color: '#334155', borderBottom: '2px solid #e2e8f0' }}>
                                <th style={{ padding: '10px' }}>তারিখ ও সময়</th>
                                <th style={{ padding: '10px' }}>ওষুধের নাম</th>
                                <th style={{ padding: '10px' }}>পরিমাণ</th>
                                <th style={{ padding: '10px' }}>একক কেনা দাম</th>
                                <th style={{ padding: '10px', textAlign: 'right' }}>মোট কেনা মূল্য (৳)</th>
                                <th style={{ padding: '10px' }}>নোট</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredRecords.length > 0 ? (
                                filteredRecords.map((r) => (
                                    <tr key={r.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                        <td style={{ padding: '10px', color: '#64748b' }}>{formatDate(r.createdAt)}</td>
                                        <td style={{ padding: '10px', fontWeight: 'bold', color: '#1e293b' }}>{r.productName}</td>
                                        <td style={{ padding: '10px', color: '#334155', fontWeight: 'bold' }}>{r.qty} Pcs</td>
                                        <td style={{ padding: '10px', color: '#64748b' }}>৳ {r.unitBuyPrice}</td>
                                        <td style={{ padding: '10px', textAlign: 'right', fontWeight: 'bold', color: '#d97706' }}>
                                            ৳ {r.totalCost.toFixed(2)}
                                        </td>
                                        <td style={{ padding: '10px', color: '#475569' }}>{r.note || '-'}</td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={6} style={{ textAlign: 'center', padding: '20px', color: '#94a3b8' }}>
                                        কোনো রেকর্ড পাওয়া যায়নি
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