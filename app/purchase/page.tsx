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
    salePrice: number;
    expiryDate?: string;
}

export default function PurchasePage() {
    const [mounted, setMounted] = useState(false);
    const [products, setProducts] = useState<Product[]>([]);

    // Purchase Form
    const [selectedProductId, setSelectedProductId] = useState('');
    const [qty, setQty] = useState('');
    const [buyPrice, setBuyPrice] = useState('');
    const [salePrice, setSalePrice] = useState('');
    const [expiryDate, setExpiryDate] = useState('');
    const [supplier, setSupplier] = useState('');

    useEffect(() => {
        setMounted(true);
        const productsRef = ref(db, 'products');
        const unsubscribe = onValue(productsRef, (snapshot) => {
            const data = snapshot.val();
            if (data) {
                const list: Product[] = Object.keys(data).map((key) => ({
                    id: key,
                    name: data[key].name || '',
                    stock: Number(data[key].stock || 0),
                    buyPrice: Number(data[key].buyPrice || 0),
                    salePrice: Number(data[key].salePrice || 0),
                    expiryDate: data[key].expiryDate || '',
                }));
                setProducts(list);
            }
        });

        return () => unsubscribe();
    }, []);

    const handleProductSelect = (id: string) => {
        setSelectedProductId(id);
        const prod = products.find((p) => p.id === id);
        if (prod) {
            setBuyPrice(prod.buyPrice.toString());
            setSalePrice(prod.salePrice.toString());
            setExpiryDate(prod.expiryDate || '');
        }
    };

    const handleAddPurchase = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedProductId || !qty || !buyPrice) {
            alert('ওষুধ, পরিমাণ এবং কেনা দাম সঠিকভাবে দিন!');
            return;
        }

        const prod = products.find((p) => p.id === selectedProductId);
        if (!prod) return;

        const addedQty = Number(qty);
        const newStock = prod.stock + addedQty;
        const totalAmount = addedQty * Number(buyPrice);

        try {
            // 1. Save Purchase History
            const purchaseRef = push(ref(db, 'purchases'));
            await set(purchaseRef, {
                productId: prod.id,
                productName: prod.name,
                qty: addedQty,
                unitBuyPrice: Number(buyPrice),
                unitSalePrice: Number(salePrice || prod.salePrice),
                totalAmount,
                supplier: supplier || 'সাধারণ সাপ্লাইয়ার',
                createdAt: new Date().toISOString(),
            });

            // 2. Update Product Stock & Details
            await update(ref(db, `products/${prod.id}`), {
                stock: newStock,
                buyPrice: Number(buyPrice),
                salePrice: Number(salePrice || prod.salePrice),
                expiryDate: expiryDate || prod.expiryDate || '',
            });

            alert(`✅ ক্রয় সফল হয়েছে! স্টকে ${addedQty} Pcs যোগ করা হয়েছে। নতুন স্টক: ${newStock} Pcs`);

            setSelectedProductId('');
            setQty('');
            setBuyPrice('');
            setSalePrice('');
            setExpiryDate('');
            setSupplier('');
        } catch (err) {
            console.error(err);
            alert('ক্রয় রেকর্ড করতে সমস্যা হয়েছে!');
        }
    };

    if (!mounted) {
        return (
            <div style={{ padding: '20px', fontFamily: 'system-ui, sans-serif' }}>
                <p style={{ color: '#ef4444', fontWeight: 'bold' }}>Loading Purchase Entry...</p>
            </div>
        );
    }

    return (
        <div style={{ padding: '20px', maxWidth: '900px', margin: '0 auto', fontFamily: 'system-ui, sans-serif', backgroundColor: '#f8fafc', minHeight: '100vh' }}>

            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
                <Link href="/" style={{ textDecoration: 'none', color: '#e11d48', fontWeight: 'bold', fontSize: '15px' }}>
                    ⬅️ Back to Dashboard
                </Link>
                <h2 style={{ margin: 0, color: '#1e293b', fontSize: '20px' }}>🛍️ New Purchase / স্টক ক্রয়</h2>
                <div style={{ width: '100px' }}></div>
            </div>

            {/* Form Card */}
            <div style={{ background: '#fff', padding: '25px', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                <form onSubmit={handleAddPurchase} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>

                    <div>
                        <label style={{ fontSize: '13px', fontWeight: 'bold', color: '#1e293b' }}>ওষুধ সিলেক্ট করুন *</label>
                        <select
                            value={selectedProductId}
                            onChange={(e) => handleProductSelect(e.target.value)}
                            required
                            style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '14px', marginTop: '5px' }}
                        >
                            <option value="">-- ওষুধ বাছাই করুন --</option>
                            {products.map((p) => (
                                <option key={p.id} value={p.id}>
                                    {p.name} (বর্তমান স্টক: {p.stock} Pcs)
                                </option>
                            ))}
                        </select>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                        <div>
                            <label style={{ fontSize: '13px', fontWeight: 'bold', color: '#1e293b' }}>ক্রয়ের পরিমাণ (Qty Pcs) *</label>
                            <input
                                type="number"
                                placeholder="0"
                                value={qty}
                                onChange={(e) => setQty(e.target.value)}
                                required
                                style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '14px', marginTop: '5px', boxSizing: 'border-box' }}
                            />
                        </div>

                        <div>
                            <label style={{ fontSize: '13px', fontWeight: 'bold', color: '#1e293b' }}>একক কেনা দাম (৳) *</label>
                            <input
                                type="number"
                                step="0.01"
                                placeholder="0.00"
                                value={buyPrice}
                                onChange={(e) => setBuyPrice(e.target.value)}
                                required
                                style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '14px', marginTop: '5px', boxSizing: 'border-box' }}
                            />
                        </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                        <div>
                            <label style={{ fontSize: '13px', fontWeight: 'bold', color: '#1e293b' }}>নতুন বিক্রয় মূল্য (৳)</label>
                            <input
                                type="number"
                                step="0.01"
                                placeholder="0.00"
                                value={salePrice}
                                onChange={(e) => setSalePrice(e.target.value)}
                                style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '14px', marginTop: '5px', boxSizing: 'border-box' }}
                            />
                        </div>

                        <div>
                            <label style={{ fontSize: '13px', fontWeight: 'bold', color: '#1e293b' }}>নতুন মেয়াদের তারিখ (Exp Date)</label>
                            <input
                                type="date"
                                value={expiryDate}
                                onChange={(e) => setExpiryDate(e.target.value)}
                                style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '14px', marginTop: '5px', boxSizing: 'border-box' }}
                            />
                        </div>
                    </div>

                    <div>
                        <label style={{ fontSize: '13px', fontWeight: 'bold', color: '#1e293b' }}>সাপ্লাইয়ার / কোম্পানির নাম</label>
                        <input
                            type="text"
                            placeholder="e.g. Square Pharma Rep"
                            value={supplier}
                            onChange={(e) => setSupplier(e.target.value)}
                            style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '14px', marginTop: '5px', boxSizing: 'border-box' }}
                        />
                    </div>

                    <button
                        type="submit"
                        style={{ backgroundColor: '#06b6d4', color: '#fff', border: 'none', padding: '12px', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', fontSize: '15px', marginTop: '10px' }}
                    >
                        📥 ক্রয় সম্পন্ন করুন ও স্টকে যোগ করুন
                    </button>

                </form>
            </div>

        </div>
    );
}