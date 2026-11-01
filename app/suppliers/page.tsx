'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { db } from '../firebase';
import { ref, onValue, push, set } from 'firebase/database';

interface Supplier {
    id: string;
    name: string;
    company: string;
    phone: string;
    dueAmount: number;
}

export default function SuppliersPage() {
    const [mounted, setMounted] = useState(false);
    const [suppliers, setSuppliers] = useState<Supplier[]>([]);
    const [name, setName] = useState('');
    const [company, setCompany] = useState('');
    const [phone, setPhone] = useState('');
    const [openingDue, setOpeningDue] = useState<number | ''>('');

    // Payment Modal State
    const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);
    const [payAmount, setPayAmount] = useState<number | ''>('');

    useEffect(() => {
        setMounted(true);
        const supRef = ref(db, 'suppliers');
        const unsubscribe = onValue(supRef, (snapshot) => {
            const data = snapshot.val();
            if (data) {
                const list: Supplier[] = Object.keys(data).map((key) => ({
                    id: key,
                    name: data[key].name || '',
                    company: data[key].company || '',
                    phone: data[key].phone || '',
                    dueAmount: Number(data[key].dueAmount || 0),
                }));
                setSuppliers(list);
            } else {
                setSuppliers([]);
            }
        });

        return () => unsubscribe();
    }, []);

    const handleAddSupplier = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim()) {
            alert('সাপ্লাইয়ারের নাম লিখুন!');
            return;
        }

        try {
            const supRef = ref(db, 'suppliers');
            const newRef = push(supRef);
            await set(newRef, {
                name,
                company,
                phone,
                dueAmount: Number(openingDue || 0),
                createdAt: new Date().toISOString(),
            });

            setName('');
            setCompany('');
            setPhone('');
            setOpeningDue('');
            alert('✅ নতুন সাপ্লাইয়ার সফলভাবে যুক্ত হয়েছে!');
        } catch (err) {
            alert('সাপ্লাইয়ার যুক্ত করতে সমস্যা হয়েছে!');
        }
    };

    const handleMakePayment = async () => {
        if (!selectedSupplier || !payAmount || Number(payAmount) <= 0) {
            alert('সঠিক পরিশোধের পরিমাণ লিখুন!');
            return;
        }

        const pay = Number(payAmount);
        if (pay > selectedSupplier.dueAmount) {
            alert('বকেয়া টাকার চেয়ে বেশি পরিশোধ করা সম্ভব নয়!');
            return;
        }

        try {
            const newDue = selectedSupplier.dueAmount - pay;
            const supRef = ref(db, `suppliers/${selectedSupplier.id}`);
            await set(supRef, {
                ...selectedSupplier,
                dueAmount: newDue,
            });

            alert(`✅ সফলভাবে ৳${pay} পরিশোধ করা হয়েছে!`);
            setSelectedSupplier(null);
            setPayAmount('');
        } catch (err) {
            alert('পেমেন্ট আপডেট করতে সমস্যা হয়েছে!');
        }
    };

    if (!mounted) return null;

    return (
        <div style={{ backgroundColor: '#f8fafc', minHeight: '100vh', padding: '20px', fontFamily: 'system-ui, sans-serif' }}>

            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '25px', maxWidth: '1000px', margin: '0 auto 25px auto' }}>
                <Link href="/" style={{ textDecoration: 'none', color: '#1e293b', fontWeight: 'bold', fontSize: '16px' }}>⬅️ ড্যাশবোর্ড</Link>
                <h2 style={{ margin: 0, color: '#0f172a', fontSize: '20px' }}>🏭 Suppliers Ledger (সাপ্লাইয়ার ও বাকি খাতা)</h2>
                <div style={{ width: '80px' }}></div>
            </div>

            <div style={{ maxWidth: '1000px', margin: '0 auto', display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '20px' }}>

                {/* Left: Add Supplier Form */}
                <div style={{ backgroundColor: '#fff', padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0', height: 'fit-content' }}>
                    <h3 style={{ margin: '0 0 15px 0', fontSize: '16px', color: '#1e293b' }}>➕ নতুন সাপ্লাইয়ার যোগ করুন</h3>
                    <form onSubmit={handleAddSupplier} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        <div>
                            <label style={{ fontSize: '12px', fontWeight: 'bold' }}>সাপ্লাইয়ার প্রতিনিধি নাম</label>
                            <input type="text" placeholder="যেমন: রহিম ভাই" value={name} onChange={(e) => setName(e.target.value)} style={{ width: '100%', padding: '8px', border: '1px solid #cbd5e1', borderRadius: '6px' }} />
                        </div>
                        <div>
                            <label style={{ fontSize: '12px', fontWeight: 'bold' }}>কোম্পানি নাম</label>
                            <input type="text" placeholder="যেমন: Square / Beximco" value={company} onChange={(e) => setCompany(e.target.value)} style={{ width: '100%', padding: '8px', border: '1px solid #cbd5e1', borderRadius: '6px' }} />
                        </div>
                        <div>
                            <label style={{ fontSize: '12px', fontWeight: 'bold' }}>মোবাইল নম্বর</label>
                            <input type="text" placeholder="017XXXXXXXX" value={phone} onChange={(e) => setPhone(e.target.value)} style={{ width: '100%', padding: '8px', border: '1px solid #cbd5e1', borderRadius: '6px' }} />
                        </div>
                        <div>
                            <label style={{ fontSize: '12px', fontWeight: 'bold' }}>প্রারম্ভিক বকেয়া (Opening Due)</label>
                            <input type="number" placeholder="0" value={openingDue} onChange={(e) => setOpeningDue(e.target.value === '' ? '' : Number(e.target.value))} style={{ width: '100%', padding: '8px', border: '1px solid #cbd5e1', borderRadius: '6px' }} />
                        </div>
                        <button type="submit" style={{ backgroundColor: '#0284c7', color: '#fff', border: 'none', padding: '10px', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', marginTop: '5px' }}>
                            সাপ্লাইয়ার সংরক্ষণ করুন
                        </button>
                    </form>
                </div>

                {/* Right: Supplier List Table */}
                <div style={{ backgroundColor: '#fff', padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                    <h3 style={{ margin: '0 0 15px 0', fontSize: '16px', color: '#1e293b' }}>📋 সাপ্লাইয়ার তালিকা ও বকেয়া খাতা</h3>

                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
                            <thead>
                                <tr style={{ backgroundColor: '#f1f5f9', borderBottom: '2px solid #e2e8f0', color: '#475569' }}>
                                    <th style={{ padding: '10px' }}>নাম ও কোম্পানি</th>
                                    <th style={{ padding: '10px' }}>মোবাইল</th>
                                    <th style={{ padding: '10px' }}>বকেয়া (Due)</th>
                                    <th style={{ padding: '10px', textAlign: 'center' }}>পেমেন্ট</th>
                                </tr>
                            </thead>
                            <tbody>
                                {suppliers.length > 0 ? (
                                    suppliers.map((s) => (
                                        <tr key={s.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                            <td style={{ padding: '10px' }}>
                                                <strong>{s.name}</strong>
                                                <div style={{ fontSize: '11px', color: '#0284c7' }}>{s.company}</div>
                                            </td>
                                            <td style={{ padding: '10px', color: '#475569' }}>{s.phone || 'N/A'}</td>
                                            <td style={{ padding: '10px', fontWeight: 'bold', color: s.dueAmount > 0 ? '#dc2626' : '#16a34a' }}>
                                                ৳ {s.dueAmount}
                                            </td>
                                            <td style={{ padding: '10px', textAlign: 'center' }}>
                                                <button
                                                    onClick={() => setSelectedSupplier(s)}
                                                    style={{ backgroundColor: '#16a34a', color: '#fff', border: 'none', padding: '6px 12px', borderRadius: '6px', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer' }}
                                                >
                                                    পরিশোধ
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={4} style={{ textAlign: 'center', padding: '30px', color: '#94a3b8' }}>কোনো সাপ্লাইয়ার পাওয়া যায়নি</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

            </div>

            {/* Payment Modal */}
            {selectedSupplier && (
                <div style={{ position: 'fixed', inset: '0', backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
                    <div style={{ backgroundColor: '#fff', padding: '25px', borderRadius: '12px', width: '350px', boxShadow: '0 10px 25px rgba(0,0,0,0.2)' }}>
                        <h3 style={{ margin: '0 0 10px 0', color: '#0f172a' }}>💰 পেমেন্ট পরিশোধ</h3>
                        <p style={{ fontSize: '13px', color: '#475569', marginBottom: '15px' }}>
                            সাপ্লাইয়ার: <strong>{selectedSupplier.name}</strong> ({selectedSupplier.company})<br />
                            বর্তমান বকেয়া: <strong style={{ color: '#dc2626' }}>৳ {selectedSupplier.dueAmount}</strong>
                        </p>

                        <div style={{ marginBottom: '15px' }}>
                            <label style={{ fontSize: '12px', fontWeight: 'bold' }}>পরিশোধের পরিমাণ (৳)</label>
                            <input
                                type="number"
                                placeholder="0"
                                value={payAmount}
                                onChange={(e) => setPayAmount(e.target.value === '' ? '' : Number(e.target.value))}
                                style={{ width: '100%', padding: '10px', border: '1px solid #cbd5e1', borderRadius: '6px', marginTop: '5px' }}
                            />
                        </div>

                        <div style={{ display: 'flex', gap: '10px' }}>
                            <button
                                onClick={handleMakePayment}
                                style={{ flex: 1, backgroundColor: '#16a34a', color: '#fff', border: 'none', padding: '10px', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}
                            >
                                নিশ্চিত করুন
                            </button>
                            <button
                                onClick={() => setSelectedSupplier(null)}
                                style={{ flex: 1, backgroundColor: '#e2e8f0', color: '#334155', border: 'none', padding: '10px', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}
                            >
                                বাতিল
                            </button>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
}