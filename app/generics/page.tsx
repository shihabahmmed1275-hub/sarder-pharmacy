'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { db } from '../firebase';
import { ref, onValue } from 'firebase/database';

interface Product {
    id: string;
    name: string;
    company: string;
    generic: string;
    stockPcs: number;
    pcsMrp: number;
}

export default function GenericsPage() {
    const [inventory, setInventory] = useState<Product[]>([]);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        const invRef = ref(db, 'inventory');
        const unsubscribe = onValue(invRef, (snapshot) => {
            const data = snapshot.val();
            if (data) {
                const loaded: Product[] = [];
                Object.entries(data).forEach(([key, val]: [string, any]) => {
                    let pcsMrp = Number(val.sellPricePcs || val.pcsMrp || val.sellPrice || 0);
                    let pcsPerBox = Number(val.boxSize || 10);

                    if (pcsMrp > 30 && pcsPerBox > 1) {
                        pcsMrp = Number((pcsMrp / pcsPerBox).toFixed(2));
                    }

                    loaded.push({
                        id: key,
                        name: val.name || 'Unknown',
                        company: val.company || '',
                        generic: val.generic || 'N/A',
                        stockPcs: Number(val.stock || 0),
                        pcsMrp,
                    });
                });
                setInventory(loaded);
            }
        });

        return () => unsubscribe();
    }, []);

    const filtered = inventory.filter(
        (p) =>
            p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            p.generic.toLowerCase().includes(searchTerm.toLowerCase()) ||
            p.company.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div style={{ backgroundColor: '#f8fafc', minHeight: '100vh', padding: '20px', fontFamily: 'system-ui, sans-serif' }}>

            {/* Container Matching 1st Screenshot */}
            <div style={{ maxWidth: '850px', margin: '0 auto', background: '#fff', borderRadius: '16px', padding: '24px', border: '1px solid #e2e8f0', boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
                    <Link href="/" style={{ textDecoration: 'none', color: '#1e293b', fontWeight: 'bold', fontSize: '18px' }}>⬅️</Link>
                    <h2 style={{ margin: 0, color: '#1e293b', fontSize: '20px', fontWeight: '800' }}>Generics Search</h2>
                    <div style={{ width: '20px' }}></div>
                </div>

                {/* Filter Pills */}
                <div style={{ display: 'flex', gap: '10px', marginBottom: '15px' }}>
                    <span style={{ background: '#ffe4e6', color: '#e11d48', padding: '6px 14px', borderRadius: '20px', fontSize: '13px', fontWeight: 'bold' }}>Owned</span>
                    <span style={{ background: '#f1f5f9', color: '#64748b', padding: '6px 14px', borderRadius: '20px', fontSize: '13px', fontWeight: 'bold' }}>Generic name</span>
                </div>

                {/* Search Input */}
                <div style={{ position: 'relative', marginBottom: '15px' }}>
                    <input
                        type="text"
                        placeholder="Search product or generic..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        style={{ width: '100%', padding: '12px 40px 12px 14px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '14px', boxSizing: 'border-box' }}
                    />
                    {searchTerm && (
                        <button onClick={() => setSearchTerm('')} style={{ position: 'absolute', right: '12px', top: '12px', border: 'none', background: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: '16px' }}>✕</button>
                    )}
                </div>

                <div style={{ textAlign: 'right', fontSize: '13px', color: '#64748b', fontWeight: 'bold', marginBottom: '15px' }}>
                    Total: {filtered.length}
                </div>

                {/* Product Cards List matching 1st Screenshot */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {filtered.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>কোনো জেনেরিক বা ওষুধ পাওয়া যায়নি</div>
                    ) : (
                        filtered.map((item) => (
                            <div key={item.id} style={{ background: '#f8fafc', border: '1px solid #f1f5f9', borderRadius: '12px', padding: '16px' }}>
                                <h4 style={{ margin: '0 0 4px 0', fontSize: '15px', color: '#0f172a' }}>
                                    {item.name} <span style={{ color: '#64748b', fontWeight: 'normal', fontSize: '13px' }}>({item.company})</span>
                                </h4>
                                <div style={{ fontSize: '13px', color: '#475569' }}>
                                    জেনেরিক: <span style={{ fontWeight: '600', color: '#1e293b' }}>{item.generic}</span> | স্টক: <span style={{ color: '#16a34a', fontWeight: 'bold' }}>{item.stockPcs} পিস</span> | MRP: <span style={{ color: '#e11d48', fontWeight: 'bold' }}>৳{item.pcsMrp.toFixed(2)}/পিস</span>
                                </div>
                            </div>
                        ))
                    )}
                </div>

            </div>

        </div>
    );
}