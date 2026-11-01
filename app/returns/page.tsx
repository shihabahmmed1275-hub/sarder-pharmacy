'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { db } from '../firebase';
import { ref, onValue, update } from 'firebase/database';

interface Product {
    id: string;
    name: string;
    stock: number;
}

export default function ReturnsPage() {
    const [mounted, setMounted] = useState(false);
    const [inventory, setInventory] = useState<Product[]>([]);
    const [selectedProductId, setSelectedProductId] = useState('');
    const [returnQty, setReturnQty] = useState<number | ''>('');
    const [returnType, setReturnType] = useState<'SalesReturn' | 'PurchaseReturn'>('SalesReturn');
    const [reason, setReason] = useState('');

    useEffect(() => {
        setMounted(true);
        const invRef = ref(db, 'products');
        const unsubscribe = onValue(invRef, (snapshot) => {
            const data = snapshot.val();
            if (data) {
                const list: Product[] = Object.keys(data).map((key) => ({
                    id: key,
                    name: data[key].name || 'Unknown',
                    stock: Number(data[key].stock || 0),
                }));
                setInventory(list);
            }
        });

        return () => unsubscribe();
    }, []);

    const handleProcessReturn = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedProductId || !returnQty || Number(returnQty) <= 0) {
            alert('Osudh select korun ebong sothik poriman দিন!');
            return;
        }

        const qty = Number(returnQty);
        const product = inventory.find((p) => p.id === selectedProductId);
        if (!product) return;

        try {
            let newStock = product.stock;

            if (returnType === 'SalesReturn') {
                newStock += qty;
            } else {
                if (qty > product.stock) {
                    alert('⚠️ Stock-e porjapto poriman nei!');
                    return;
                }
                newStock -= qty;
            }

            const prodRef = ref(db, `products/${selectedProductId}`);
            await update(prodRef, { stock: newStock });

            alert(`✅ Return successfully processed! Current Stock: ${newStock}`);
            setSelectedProductId('');
            setReturnQty('');
            setReason('');
        } catch (err) {
            console.error(err);
            alert('Return process korte somossa hoyeche!');
        }
    };

    if (!mounted) return null;

    return (
        <div style={{ backgroundColor: '#f8fafc', minHeight: '100vh', padding: '20px', fontFamily: 'system-ui, sans-serif' }}>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '25px', maxWidth: '800px', margin: '0 auto 25px auto' }}>
                <Link href="/" style={{ textDecoration: 'none', color: '#1e293b', fontWeight: 'bold', fontSize: '16px' }}>⬅️ Dashboard</Link>
                <h2 style={{ margin: 0, color: '#0f172a', fontSize: '20px' }}>🔄 Returns & Stock Adjustment</h2>
                <div style={{ width: '80px' }}></div>
            </div>

            <div style={{ maxWidth: '800px', margin: '0 auto', backgroundColor: '#fff', padding: '25px', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}>

                <form onSubmit={handleProcessReturn} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

                    <div>
                        <label style={{ fontSize: '13px', fontWeight: 'bold', display: 'block', marginBottom: '6px' }}>Return Type</label>
                        <select
                            value={returnType}
                            onChange={(e) => setReturnType(e.target.value as any)}
                            style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '14px', backgroundColor: '#f8fafc', fontWeight: 'bold' }}
                        >
                            <option value="SalesReturn">🟢 Sales Return (Customer returned - Stock Increases)</option>
                            <option value="PurchaseReturn">🔴 Purchase Return (Returned to supplier - Stock Decreases)</option>
                        </select>
                    </div>

                    <div>
                        <label style={{ fontSize: '13px', fontWeight: 'bold', display: 'block', marginBottom: '6px' }}>Select Medicine</label>
                        <select
                            value={selectedProductId}
                            onChange={(e) => setSelectedProductId(e.target.value)}
                            style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '14px' }}
                        >
                            <option value="">-- Select Product --</option>
                            {inventory.map((p) => (
                                <option key={p.id} value={p.id}>
                                    {p.name} (Current Stock: {p.stock} pcs)
                                </option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label style={{ fontSize: '13px', fontWeight: 'bold', display: 'block', marginBottom: '6px' }}>Quantity (Pcs)</label>
                        <input
                            type="number"
                            placeholder="e.g. 5"
                            value={returnQty}
                            onChange={(e) => setReturnQty(e.target.value === '' ? '' : Number(e.target.value))}
                            style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '14px', boxSizing: 'border-box' }}
                        />
                    </div>

                    <div>
                        <label style={{ fontSize: '13px', fontWeight: 'bold', display: 'block', marginBottom: '6px' }}>Reason / Note</label>
                        <input
                            type="text"
                            placeholder="e.g. Expired, Wrong item delivered"
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '14px', boxSizing: 'border-box' }}
                        />
                    </div>

                    <button
                        type="submit"
                        style={{ backgroundColor: '#e11d48', color: '#fff', border: 'none', padding: '12px', borderRadius: '8px', fontWeight: 'bold', fontSize: '15px', cursor: 'pointer', marginTop: '10px' }}
                    >
                        🔄 Process Return
                    </button>

                </form>

            </div>

        </div>
    );
}