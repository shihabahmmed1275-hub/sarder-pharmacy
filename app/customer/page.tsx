'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { db } from '../firebase';
import { ref, onValue, push, set, update } from 'firebase/database';

interface Customer {
    id: string;
    name: string;
    phone: string;
    address: string;
    dueAmount: number;
    lastUpdated?: string;
}

interface PrintReceiptData {
    customerName: string;
    phone: string;
    previousDue: number;
    paidAmount: number;
    remainingDue: number;
    date: string;
    receiptNo: string;
}

export default function CustomerDuePage() {
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [search, setSearch] = useState('');

    // New Customer Form State
    const [name, setName] = useState('');
    const [phone, setPhone] = useState('');
    const [address, setAddress] = useState('');
    const [initialDue, setInitialDue] = useState('');

    // Payment Collection State
    const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
    const [payAmount, setPayAmount] = useState('');

    // Receipt Print State
    const [receipt, setReceipt] = useState<PrintReceiptData | null>(null);

    useEffect(() => {
        const customerRef = ref(db, 'customers');
        const unsubscribe = onValue(customerRef, (snapshot) => {
            const data = snapshot.val();
            if (data) {
                const list: Customer[] = Object.keys(data).map((key) => ({
                    id: key,
                    ...data[key],
                    dueAmount: Number(data[key].dueAmount || 0),
                }));
                setCustomers(list);
            } else {
                setCustomers([]);
            }
        });

        return () => unsubscribe();
    }, []);

    const handleAddCustomer = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim()) return;

        try {
            const customerRef = ref(db, 'customers');
            const newRef = push(customerRef);
            await set(newRef, {
                name,
                phone,
                address,
                dueAmount: Number(initialDue) || 0,
                createdAt: new Date().toISOString(),
            });

            setName('');
            setPhone('');
            setAddress('');
            setInitialDue('');
            alert('🎉 কাস্টমার সফলভাবে যুক্ত হয়েছে!');
        } catch (err) {
            console.error(err);
            alert('কাস্টমার সেভ করতে সমস্যা হয়েছে!');
        }
    };

    const handleCollectPayment = async () => {
        if (!selectedCustomer || !payAmount) return;
        const amount = Number(payAmount);
        if (isNaN(amount) || amount <= 0) {
            alert('সঠিক টাকার পরিমাণ লিখুন!');
            return;
        }

        const previousDue = selectedCustomer.dueAmount;
        const newDue = Math.max(0, previousDue - amount);
        const receiptNo = 'REC-' + Math.floor(100000 + Math.random() * 900000);
        const todayDate = new Date().toLocaleString('en-GB');

        try {
            const customerItemRef = ref(db, `customers/${selectedCustomer.id}`);
            await update(customerItemRef, {
                dueAmount: newDue,
                lastUpdated: new Date().toISOString(),
            });

            // Receipt Data Prepared for Printing
            const printData: PrintReceiptData = {
                customerName: selectedCustomer.name,
                phone: selectedCustomer.phone || 'N/A',
                previousDue,
                paidAmount: amount,
                remainingDue: newDue,
                date: todayDate,
                receiptNo,
            };

            setReceipt(printData);
            setSelectedCustomer(null);
            setPayAmount('');
        } catch (err) {
            console.error(err);
            alert('টাকা জমা আপডেট করতে সমস্যা হয়েছে!');
        }
    };

    const handlePrint = () => {
        window.print();
    };

    const filteredCustomers = customers.filter(
        (c) =>
            c.name.toLowerCase().includes(search.toLowerCase()) ||
            c.phone.includes(search)
    );

    const totalDueSum = customers.reduce((acc, c) => acc + c.dueAmount, 0);

    return (
        <div style={{ padding: '20px', maxWidth: '1100px', margin: '0 auto', fontFamily: 'system-ui, sans-serif', backgroundColor: '#f8fafc', minHeight: '100vh' }}>

            {/* Print Friendly Styling */}
            <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #printable-receipt, #printable-receipt * {
            visibility: visible;
          }
          #printable-receipt {
            position: absolute;
            left: 0;
            top: 0;
            width: 80mm;
            padding: 10px;
            font-size: 12px;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>

            {/* Header Navigation */}
            <div className="no-print" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
                <Link href="/" style={{ textDecoration: 'none', color: '#e11d48', fontWeight: 'bold', fontSize: '15px' }}>
                    ⬅️ Back to Dashboard
                </Link>
                <h2 style={{ margin: 0, color: '#1e293b', fontSize: '20px' }}>📘 Customer Due Ledger (বাকী খাতা)</h2>
                <div style={{ width: '100px' }}></div>
            </div>

            {/* Summary Card & Add Form Grid */}
            <div className="no-print" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px', marginBottom: '25px' }}>

                {/* Total Due Stats */}
                <div style={{ background: '#fff', padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                    <span style={{ fontSize: '14px', color: '#64748b', fontWeight: 'bold' }}>মোট বকেয়া পরিমাণ (Total Due Amount)</span>
                    <h1 style={{ margin: '10px 0 0 0', color: '#e11d48', fontSize: '32px' }}>৳ {totalDueSum.toLocaleString()}</h1>
                    <span style={{ marginTop: '10px', fontSize: '13px', color: '#475569' }}>মোট বাকী কাস্টমার: <strong>{customers.filter(c => c.dueAmount > 0).length} জন</strong></span>
                </div>

                {/* Add New Customer Form */}
                <div style={{ background: '#fff', padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                    <h3 style={{ margin: '0 0 15px 0', color: '#1e293b', fontSize: '16px' }}>➕ নতুন বাকী কাস্টমার যোগ করুন</h3>
                    <form onSubmit={handleAddCustomer} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                        <input
                            type="text"
                            placeholder="কাস্টমারের নাম *"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            required
                            style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                        />
                        <input
                            type="text"
                            placeholder="মোবাইল নম্বর"
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                        />
                        <input
                            type="text"
                            placeholder="ঠিকানা (গ্রাম/বাজার)"
                            value={address}
                            onChange={(e) => setAddress(e.target.value)}
                            style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                        />
                        <input
                            type="number"
                            placeholder="প্রাথমিক বাকী (৳)"
                            value={initialDue}
                            onChange={(e) => setInitialDue(e.target.value)}
                            style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                        />
                        <button
                            type="submit"
                            style={{ gridColumn: 'span 2', padding: '10px', backgroundColor: '#16a34a', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', fontSize: '14px' }}
                        >
                            সেভ করুন
                        </button>
                    </form>
                </div>

            </div>

            {/* Search & Customer Table */}
            <div className="no-print" style={{ background: '#fff', padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                    <h3 style={{ margin: 0, color: '#1e293b', fontSize: '16px' }}>📋 কাস্টমার তালিকা ({filteredCustomers.length})</h3>
                    <input
                        type="text"
                        placeholder="🔍 নাম বা মোবাইল খুঁজুন..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        style={{ padding: '8px 14px', borderRadius: '20px', border: '1px solid #cbd5e1', width: '220px', fontSize: '13px' }}
                    />
                </div>

                <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', textAlign: 'left' }}>
                        <thead>
                            <tr style={{ backgroundColor: '#f1f5f9', color: '#334155', borderBottom: '2px solid #e2e8f0' }}>
                                <th style={{ padding: '10px' }}>কাস্টমারের নাম</th>
                                <th style={{ padding: '10px' }}>মোবাইল নম্বর</th>
                                <th style={{ padding: '10px' }}>ঠিকানা</th>
                                <th style={{ padding: '10px', textAlign: 'right' }}>বকেয়া পরিমাণ (৳)</th>
                                <th style={{ padding: '10px', textAlign: 'center' }}>একশন</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredCustomers.length > 0 ? (
                                filteredCustomers.map((c) => (
                                    <tr key={c.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                        <td style={{ padding: '10px', fontWeight: 'bold', color: '#1e293b' }}>{c.name}</td>
                                        <td style={{ padding: '10px', color: '#475569' }}>{c.phone || 'N/A'}</td>
                                        <td style={{ padding: '10px', color: '#64748b' }}>{c.address || 'N/A'}</td>
                                        <td style={{ padding: '10px', textAlign: 'right', fontWeight: 'bold', color: c.dueAmount > 0 ? '#e11d48' : '#16a34a' }}>
                                            ৳ {c.dueAmount.toLocaleString()}
                                        </td>
                                        <td style={{ padding: '10px', textAlign: 'center' }}>
                                            <button
                                                onClick={() => setSelectedCustomer(c)}
                                                style={{ padding: '6px 12px', backgroundColor: '#0284c7', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '12px' }}
                                            >
                                                💵 টাকা জমা নিন
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={5} style={{ textAlign: 'center', padding: '20px', color: '#94a3b8' }}>
                                        কোনো কাস্টমার পাওয়া যায়নি
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

            </div>

            {/* Collect Payment Modal Popup */}
            {selectedCustomer && (
                <div className="no-print" style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
                    <div style={{ backgroundColor: '#fff', padding: '25px', borderRadius: '12px', width: '350px', boxShadow: '0 4px 15px rgba(0,0,0,0.2)' }}>
                        <h3 style={{ margin: '0 0 10px 0', color: '#1e293b' }}>💵 টাকা জমা গ্রহন</h3>
                        <p style={{ margin: '0 0 15px 0', fontSize: '13px', color: '#64748b' }}>
                            কাস্টমার: <strong>{selectedCustomer.name}</strong><br />
                            বর্তমান বাকী: <strong style={{ color: '#e11d48' }}>৳ {selectedCustomer.dueAmount}</strong>
                        </p>

                        <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', marginBottom: '5px' }}>জমা দেওয়া টাকার পরিমাণ (৳):</label>
                        <input
                            type="number"
                            placeholder="e.g. 500"
                            value={payAmount}
                            onChange={(e) => setPayAmount(e.target.value)}
                            style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1', marginBottom: '18px', boxSizing: 'border-box' }}
                        />

                        <div style={{ display: 'flex', gap: '10px' }}>
                            <button
                                onClick={handleCollectPayment}
                                style={{ flex: 1, padding: '10px', backgroundColor: '#16a34a', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}
                            >
                                জমা ও রশিদ তৈরি করুন
                            </button>
                            <button
                                onClick={() => setSelectedCustomer(null)}
                                style={{ padding: '10px 15px', backgroundColor: '#94a3b8', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}
                            >
                                বাতিল
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Money Receipt Slip Modal & Printable Area */}
            {receipt && (
                <div className="no-print" style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000 }}>
                    <div style={{ backgroundColor: '#fff', padding: '20px', borderRadius: '12px', width: '320px', boxShadow: '0 4px 20px rgba(0,0,0,0.25)' }}>

                        {/* Printable Receipt Structure */}
                        <div id="printable-receipt" style={{ fontFamily: 'monospace', color: '#000', backgroundColor: '#fff', padding: '10px' }}>
                            <div style={{ textAlign: 'center', borderBottom: '1px dashed #000', paddingBottom: '8px', marginBottom: '8px' }}>
                                <h2 style={{ margin: 0, fontSize: '16px' }}>Sardar Medical Hall</h2>
                                <p style={{ margin: '2px 0', fontSize: '11px' }}>Gopalpur Bazar, Manda</p>
                                <p style={{ margin: 0, fontSize: '11px', fontWeight: 'bold' }}>MONEY RECEIPT (জমা রশিদ)</p>
                            </div>

                            <div style={{ fontSize: '12px', marginBottom: '8px' }}>
                                <div><strong>Receipt No:</strong> {receipt.receiptNo}</div>
                                <div><strong>Date:</strong> {receipt.date}</div>
                                <div><strong>Customer:</strong> {receipt.customerName}</div>
                                <div><strong>Phone:</strong> {receipt.phone}</div>
                            </div>

                            <div style={{ borderTop: '1px dashed #000', borderBottom: '1px dashed #000', padding: '8px 0', margin: '8px 0', fontSize: '12px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <span>পূর্বের মোট বাকী:</span>
                                    <span>৳ {receipt.previousDue.toFixed(2)}</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', color: '#16a34a', margin: '4px 0' }}>
                                    <span>আজকে জমা প্রদান:</span>
                                    <span>৳ {receipt.paidAmount.toFixed(2)}</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', borderTop: '1px dotted #000', paddingTop: '4px' }}>
                                    <span>অবশিষ্ট বাকী (Remaining):</span>
                                    <span>৳ {receipt.remainingDue.toFixed(2)}</span>
                                </div>
                            </div>

                            <div style={{ textAlign: 'center', fontSize: '10px', marginTop: '12px' }}>
                                <p style={{ margin: 0 }}>ধন্যবাদ, আবার আসবেন!</p>
                                <p style={{ margin: '2px 0' }}>Software Developed By: SHIHAB</p>
                            </div>
                        </div>

                        {/* Modal Action Buttons */}
                        <div className="no-print" style={{ display: 'flex', gap: '10px', marginTop: '15px' }}>
                            <button
                                onClick={handlePrint}
                                style={{ flex: 1, padding: '10px', backgroundColor: '#0284c7', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}
                            >
                                🖨️ Print Receipt
                            </button>
                            <button
                                onClick={() => setReceipt(null)}
                                style={{ padding: '10px 15px', backgroundColor: '#64748b', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}
                            >
                                বন্ধ করুন
                            </button>
                        </div>

                    </div>
                </div>
            )}

        </div>
    );
}