'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { db } from '../firebase';
import { ref, push, set } from 'firebase/database';

interface PrescriptionItem {
    name: string;
    dosage?: string;
    duration?: string;
    instructions?: string;
}

export default function AiPrescriptionPage() {
    const [imagesBase64, setImagesBase64] = useState<string[]>([]);
    const [specialNote, setSpecialNote] = useState('');
    const [loading, setLoading] = useState(false);
    const [items, setItems] = useState<PrescriptionItem[]>([]);
    const [errorMsg, setErrorMsg] = useState('');
    const [saving, setSaving] = useState(false);
    const [saveSuccess, setSaveSuccess] = useState(false);

    // Image upload handler
    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files) return;

        Array.from(files).forEach((file) => {
            const reader = new FileReader();
            reader.onload = (uploadEvent) => {
                if (uploadEvent.target?.result) {
                    setImagesBase64((prev) => [...prev, uploadEvent.target!.result as string]);
                }
            };
            reader.readAsDataURL(file);
        });
    };

    // Process Prescription using API (Gemini AI)
    const handleProcessScan = async () => {
        if (imagesBase64.length === 0) {
            alert('দয়া করে অন্তত একটি প্রেসক্রিপশনের ছবি আপলোড করুন।');
            return;
        }

        setLoading(true);
        setErrorMsg('');
        setItems([]);
        setSaveSuccess(false);

        try {
            // We can use a dedicated api route or create one for prescriptions
            const res = await fetch('/api/scan-prescription', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ imagesBase64, specialNote }),
            });

            const data = await res.json();

            if (data.success) {
                setItems(data.items);
            } else {
                setErrorMsg(data.message || 'প্রেসক্রিপশন পড়তে সমস্যা হয়েছে।');
            }
        } catch (err: any) {
            setErrorMsg(err.message || 'সার্ভার এরর ঘটেছে।');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ padding: '30px 20px', maxWidth: '1000px', margin: '0 auto', fontFamily: 'system-ui, sans-serif' }}>
            <div style={{ textAlign: 'center', marginBottom: '25px' }}>
                <Link href="/" style={{ textDecoration: 'none', color: '#1e293b', fontWeight: 'bold' }}>
                    ⬅️ Back to Dashboard
                </Link>
                <h2 style={{ marginTop: '10px', color: '#1e293b' }}>AI Prescription Reader</h2>
            </div>

            {/* Upload Box */}
            <div style={{ background: '#fff', padding: '25px', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 2px 8px rgba(0,0,0,0.02)', marginBottom: '20px' }}>
                <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '10px', color: '#1e293b' }}>
                    📷 ডাক্তারের প্রেসক্রিপশনের ছবি আপলোড করুন:
                </label>
                <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handleImageUpload}
                    style={{ marginBottom: '15px', width: '100%', padding: '10px', border: '1px solid #cbd5e1', borderRadius: '8px' }}
                />

                {imagesBase64.length > 0 && (
                    <div style={{ display: 'flex', gap: '10px', overflowX: 'auto', marginBottom: '15px', padding: '5px' }}>
                        {imagesBase64.map((img, idx) => (
                            <img key={idx} src={img} alt="prescription preview" style={{ width: '80px', height: '80px', objectFit: 'cover', borderRadius: '6px', border: '1px solid #cbd5e1' }} />
                        ))}
                    </div>
                )}

                <textarea
                    placeholder="রোগীর বয়স বা বিশেষ কোনো নোট থাকলে এখানে লিখুন (ঐচ্ছিক)..."
                    value={specialNote}
                    onChange={(e) => setSpecialNote(e.target.value)}
                    style={{ width: '100%', padding: '10px', border: '1px solid #cbd5e1', borderRadius: '8px', marginBottom: '15px', boxSizing: 'border-box' }}
                    rows={2}
                />

                <button
                    onClick={handleProcessScan}
                    disabled={loading}
                    style={{ width: '100%', padding: '12px', backgroundColor: loading ? '#94a3b8' : '#2563eb', color: '#fff', fontWeight: 'bold', border: 'none', borderRadius: '8px', cursor: 'pointer' }}
                >
                    {loading ? '⏳ AI প্রেসক্রিপশন বিশ্লেষণ করছে...' : '🚀 Read Prescription (AI Scan)'}
                </button>
            </div>

            {errorMsg && <div style={{ color: 'red', textAlign: 'center', fontWeight: 'bold', marginBottom: '15px' }}>❌ {errorMsg}</div>}

            {/* Results Section */}
            {items.length > 0 && (
                <div style={{ background: '#fff', padding: '25px', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
                    <h3 style={{ marginTop: 0, color: '#1e293b' }}>💊 Prescribed Medicines ({items.length})</h3>
                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', textAlign: 'left' }}>
                            <thead>
                                <tr style={{ backgroundColor: '#f1f5f9', color: '#334155' }}>
                                    <th style={{ padding: '10px' }}>Medicine Name</th>
                                    <th style={{ padding: '10px' }}>Dosage (ডোজ)</th>
                                    <th style={{ padding: '10px' }}>Duration (সময়কাল)</th>
                                    <th style={{ padding: '10px' }}>Instructions (পরামর্শ)</th>
                                </tr>
                            </thead>
                            <tbody>
                                {items.map((it, index) => (
                                    <tr key={index} style={{ borderBottom: '1px solid #e2e8f0' }}>
                                        <td style={{ padding: '10px', fontWeight: 'bold', color: '#1e293b' }}>{it.name}</td>
                                        <td style={{ padding: '10px', color: '#0284c7' }}>{it.dosage}</td>
                                        <td style={{ padding: '10px', color: '#475569' }}>{it.duration}</td>
                                        <td style={{ padding: '10px', color: '#16a34a' }}>{it.instructions}</td>
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