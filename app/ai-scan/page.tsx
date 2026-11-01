'use client';

import { useState } from 'react';
import { db } from '../firebase';
import { ref, push, set } from 'firebase/database';
import Link from 'next/link';

interface ScannedItem {
    name: string;
    company: string;
    generic: string;
    boxSize: number;
    boxBuyPrice: number;
    boxSellPrice: number;
    buyPricePcs: number;
    sellPricePcs: number;
    stockBox: number;
    stockPcs: number;
    barcode: string;
    expiryDate: string; // Added Expiry Date
}

export default function InvoiceScanPage() {
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [specialNote, setSpecialNote] = useState('');
    const [items, setItems] = useState<ScannedItem[]>([]);
    const [errorMsg, setErrorMsg] = useState('');
    const [saveSuccess, setSaveSuccess] = useState(false);

    const fileToBase64 = (file: File): Promise<string> => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = (error) => reject(error);
        });
    };

    const handleFormSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setLoading(true);
        setErrorMsg('');
        setItems([]);
        setSaveSuccess(false);

        const form = e.currentTarget;
        const fileInput = form.elements.namedItem('files') as HTMLInputElement;

        if (!fileInput || !fileInput.files || fileInput.files.length === 0) {
            setErrorMsg('অনুগ্রহ করে অন্তত ১টি ছবি সিলেক্ট করুন!');
            setLoading(false);
            return;
        }

        try {
            const base64Promises = Array.from(fileInput.files).map((file) => fileToBase64(file));
            const imagesBase64 = await Promise.all(base64Promises);

            const res = await fetch('/api/scan-invoice', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ imagesBase64, specialNote }),
            });

            const data = await res.json();

            if (data.success && data.items) {
                const formattedItems = data.items.map((it: any) => {
                    const bSize = Number(it.boxSize || 10);
                    const bSell = Number(it.boxSellPrice || it.sellPrice || 100);
                    const bBuy = Number(it.boxBuyPrice || it.buyPrice || 80);
                    const bStock = Number(it.stockBox || it.stock || 1);

                    return {
                        name: it.name || '',
                        company: it.company || '',
                        generic: it.generic || '',
                        boxSize: bSize,
                        boxBuyPrice: bBuy,
                        boxSellPrice: bSell,
                        buyPricePcs: Number((bBuy / bSize).toFixed(2)),
                        sellPricePcs: Number((bSell / bSize).toFixed(2)),
                        stockBox: bStock,
                        stockPcs: bStock * bSize,
                        barcode: it.barcode || '',
                        expiryDate: it.expiryDate || '', // Captured from AI backend scan
                    };
                });
                setItems(formattedItems);
            } else {
                setErrorMsg(data.message || 'স্ক্যান করতে সমস্যা হয়েছে!');
            }
        } catch (err: any) {
            console.error(err);
            setErrorMsg('সার্ভার রিকোয়েস্ট ব্যর্থ হয়েছে!');
        } finally {
            setLoading(false);
        }
    };

    const handleItemChange = (index: number, field: keyof ScannedItem, value: any) => {
        const updated = [...items];
        const item = { ...updated[index], [field]: value };

        if (field === 'boxSize' || field === 'boxBuyPrice' || field === 'boxSellPrice' || field === 'stockBox') {
            const bSize = Number(item.boxSize) || 1;
            const bBuy = Number(item.boxBuyPrice) || 0;
            const bSell = Number(item.boxSellPrice) || 0;
            const bStock = Number(item.stockBox) || 0;

            item.buyPricePcs = Number((bBuy / bSize).toFixed(2));
            item.sellPricePcs = Number((bSell / bSize).toFixed(2));
            item.stockPcs = bStock * bSize;
        }

        updated[index] = item;
        setItems(updated);
    };

    const handleSaveToDatabase = async () => {
        if (items.length === 0) return;
        setSaving(true);
        setSaveSuccess(false);

        try {
            const productsRef = ref(db, 'products');
            for (const item of items) {
                const newItemRef = push(productsRef);
                await set(newItemRef, {
                    name: item.name,
                    company: item.company,
                    generic: item.generic || 'General',
                    boxSize: item.boxSize,
                    boxBuyPrice: item.boxBuyPrice,
                    boxSellPrice: item.boxSellPrice,
                    buyPricePcs: item.buyPricePcs,
                    sellPricePcs: item.sellPricePcs,
                    buyPrice: item.buyPricePcs, // Compatibility fallback
                    salePrice: item.sellPricePcs, // Compatibility fallback
                    stock: item.stockPcs,
                    barcode: item.barcode,
                    expiryDate: item.expiryDate || '', // Saved to Firebase
                    createdAt: new Date().toISOString(),
                });
            }
            setSaveSuccess(true);
            alert('🎉 সকল ওষুধ এবং এক্সপায়ার ডেট সফলভাবে স্টক ও জেনেরিক লিস্টে যুক্ত হয়েছে!');
        } catch (err: any) {
            console.error(err);
            setErrorMsg('ডাটাবেজে সেভ করতে সমস্যা হয়েছে!');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div style={{ padding: '30px 20px', maxWidth: '1350px', margin: '0 auto', fontFamily: 'system-ui, sans-serif', backgroundColor: '#fff', minHeight: '100vh' }}>

            <div style={{ textAlign: 'center', marginBottom: '25px' }}>
                <Link href="/" style={{ textDecoration: 'none', color: '#1e293b', fontWeight: 'bold', fontSize: '15px', display: 'inline-block', marginBottom: '10px' }}>
                    ⬅️ Sardar Medical Hall
                </Link>
                <h2 style={{ margin: 0, color: '#475569', fontSize: '18px', fontWeight: '600' }}>
                    AI Invoice Scanner & Stock Entry System
                </h2>
            </div>

            <div style={{ maxWidth: '500px', margin: '0 auto', background: '#f8fafc', padding: '25px', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
                <form onSubmit={handleFormSubmit}>

                    <div style={{ marginBottom: '18px' }}>
                        <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '8px', color: '#1e293b', fontSize: '14px' }}>
                            📷 Invoice / Memo Image Choose Korun:
                        </label>
                        <input
                            type="file"
                            name="files"
                            multiple
                            accept="image/*"
                            required
                            style={{ width: '100%', padding: '10px', background: '#fff', border: '1px solid #cbd5e1', borderRadius: '8px', boxSizing: 'border-box' }}
                        />
                    </div>

                    <div style={{ marginBottom: '20px' }}>
                        <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '8px', color: '#1e293b', fontSize: '14px' }}>
                            📝 Special Note / Discount (Optional):
                        </label>
                        <input
                            type="text"
                            placeholder="e.g. 110 tk special discount"
                            value={specialNote}
                            onChange={(e) => setSpecialNote(e.target.value)}
                            style={{ width: '100%', padding: '10px 12px', background: '#fff', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '14px', boxSizing: 'border-box' }}
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        style={{ width: '100%', padding: '14px', backgroundColor: loading ? '#94a3b8' : '#e11d48', color: '#fff', fontWeight: 'bold', border: 'none', borderRadius: '8px', fontSize: '15px', cursor: 'pointer' }}
                    >
                        {loading ? '⏳ AI Processing Scan...' : '🚀 Process Korun (AI Scan)'}
                    </button>

                </form>
            </div>

            {errorMsg && <div style={{ color: 'red', marginTop: '20px', textAlign: 'center', fontWeight: 'bold' }}>❌ {errorMsg}</div>}
            {saveSuccess && <div style={{ color: '#16a34a', marginTop: '20px', textAlign: 'center', fontWeight: 'bold' }}>🎉 সকল ওষুধ সেভ হয়েছে!</div>}

            {items.length > 0 && (
                <div style={{ marginTop: '35px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                        <h3 style={{ margin: 0, color: '#1e293b' }}>📦 Scanned Items ({items.length})</h3>
                        <button onClick={handleSaveToDatabase} disabled={saving} style={{ padding: '10px 20px', backgroundColor: '#16a34a', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>
                            {saving ? 'Saving...' : '💾 Save to Inventory'}
                        </button>
                    </div>

                    <div style={{ overflowX: 'auto', background: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '10px' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', textAlign: 'left' }}>
                            <thead>
                                <tr style={{ backgroundColor: '#1e293b', color: '#fff' }}>
                                    <th style={{ padding: '8px' }}>Medicine Name</th>
                                    <th style={{ padding: '8px' }}>Company</th>
                                    <th style={{ padding: '8px', backgroundColor: '#b91c1c' }}>Generic Name</th>
                                    <th style={{ padding: '8px', width: '60px' }}>Pcs/Box</th>
                                    <th style={{ padding: '8px', width: '70px', backgroundColor: '#0369a1' }}>Box Buy Price</th>
                                    <th style={{ padding: '8px', width: '70px', backgroundColor: '#0284c7' }}>Pcs Buy Price</th>
                                    <th style={{ padding: '8px', width: '70px' }}>Box MRP</th>
                                    <th style={{ padding: '8px', width: '70px' }}>Pcs MRP</th>
                                    <th style={{ padding: '8px', width: '60px' }}>Box Qty</th>
                                    <th style={{ padding: '8px', width: '70px' }}>Total Pcs</th>
                                    <th style={{ padding: '8px', width: '110px', backgroundColor: '#dc2626' }}>Expiry Date</th>
                                </tr>
                            </thead>
                            <tbody>
                                {items.map((item, idx) => (
                                    <tr key={idx} style={{ borderBottom: '1px solid #e2e8f0' }}>
                                        <td style={{ padding: '6px' }}>
                                            <input type="text" value={item.name} onChange={(e) => handleItemChange(idx, 'name', e.target.value)} style={{ width: '100%', padding: '4px', border: '1px solid #cbd5e1', borderRadius: '4px' }} />
                                        </td>
                                        <td style={{ padding: '6px' }}>
                                            <input type="text" value={item.company} onChange={(e) => handleItemChange(idx, 'company', e.target.value)} style={{ width: '100%', padding: '4px', border: '1px solid #cbd5e1', borderRadius: '4px' }} />
                                        </td>
                                        <td style={{ padding: '6px', backgroundColor: '#fef3c7' }}>
                                            <input type="text" value={item.generic} onChange={(e) => handleItemChange(idx, 'generic', e.target.value)} placeholder="e.g. Paracetamol" style={{ width: '100%', padding: '4px', border: '1px solid #f59e0b', borderRadius: '4px', fontWeight: 'bold' }} />
                                        </td>
                                        <td style={{ padding: '6px' }}>
                                            <input type="number" value={item.boxSize} onChange={(e) => handleItemChange(idx, 'boxSize', Number(e.target.value))} style={{ width: '100%', padding: '4px', textAlign: 'center', border: '1px solid #cbd5e1', borderRadius: '4px' }} />
                                        </td>
                                        <td style={{ padding: '6px', backgroundColor: '#f0f9ff' }}>
                                            <input type="number" value={item.boxBuyPrice} onChange={(e) => handleItemChange(idx, 'boxBuyPrice', Number(e.target.value))} style={{ width: '100%', padding: '4px', textAlign: 'right', border: '1px solid #0284c7', borderRadius: '4px', fontWeight: 'bold' }} />
                                        </td>
                                        <td style={{ padding: '6px', fontWeight: 'bold', color: '#0369a1', textAlign: 'right' }}>
                                            ৳{item.buyPricePcs.toFixed(2)}
                                        </td>
                                        <td style={{ padding: '6px' }}>
                                            <input type="number" value={item.boxSellPrice} onChange={(e) => handleItemChange(idx, 'boxSellPrice', Number(e.target.value))} style={{ width: '100%', padding: '4px', textAlign: 'right', border: '1px solid #cbd5e1', borderRadius: '4px' }} />
                                        </td>
                                        <td style={{ padding: '6px', fontWeight: 'bold', color: '#16a34a', textAlign: 'right' }}>
                                            ৳{item.sellPricePcs.toFixed(2)}
                                        </td>
                                        <td style={{ padding: '6px' }}>
                                            <input type="number" value={item.stockBox} onChange={(e) => handleItemChange(idx, 'stockBox', Number(e.target.value))} style={{ width: '100%', padding: '4px', textAlign: 'center', border: '1px solid #cbd5e1', borderRadius: '4px' }} />
                                        </td>
                                        <td style={{ padding: '6px', fontWeight: 'bold', color: '#16a34a', textAlign: 'center' }}>
                                            {item.stockPcs} পিস
                                        </td>
                                        {/* Expiry Date Column with Input */}
                                        <td style={{ padding: '6px', backgroundColor: '#fef2f2' }}>
                                            <input
                                                type="date"
                                                value={item.expiryDate}
                                                onChange={(e) => handleItemChange(idx, 'expiryDate', e.target.value)}
                                                style={{ width: '100%', padding: '4px', border: '1px solid #ef4444', borderRadius: '4px', fontSize: '11px', backgroundColor: '#fff' }}
                                            />
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

        </div>
    );
}