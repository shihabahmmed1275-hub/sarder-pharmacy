'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { db } from '../firebase';
import { ref, onValue } from 'firebase/database';

interface Product {
    id: string;
    name: string;
    company: string;
    salePrice: number;
}

export default function BarcodePage() {
    const [mounted, setMounted] = useState(false);
    const [products, setProducts] = useState<Product[]>([]);
    const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
    const [printQty, setPrintQty] = useState<number>(1);
    const [printAllMode, setPrintAllMode] = useState(false);

    useEffect(() => {
        setMounted(true);
        const prodRef = ref(db, 'products');
        const unsubscribe = onValue(prodRef, (snapshot) => {
            const data = snapshot.val();
            if (data) {
                const list: Product[] = Object.keys(data).map((key) => ({
                    id: key,
                    name: data[key].name || 'Unknown',
                    company: data[key].company || 'General',
                    salePrice: Number(data[key].sellPricePcs || data[key].salePrice || 0),
                }));
                setProducts(list);
            }
        });

        return () => unsubscribe();
    }, []);

    const handlePrint = () => {
        window.print();
    };

    if (!mounted) return null;

    return (
        <div style={{ backgroundColor: '#f8fafc', minHeight: '100vh', padding: '20px', fontFamily: 'system-ui, sans-serif' }}>

            <style>{`
                @media print {
                    body * {
                        visibility: hidden;
                    }
                    #thermal-print-area, #thermal-print-area * {
                        visibility: visible;
                        -webkit-print-color-adjust: exact !important;
                        print-color-adjust: exact !important;
                    }
                    #thermal-print-area {
                        position: absolute;
                        left: 0;
                        top: 0;
                        width: 58mm;
                        margin: 0;
                        padding: 0;
                    }
                    .no-print {
                        display: none !important;
                    }
                    @page {
                        size: 58mm auto;
                        margin: 0;
                    }
                }
            `}</style>

            {/* Header */}
            <div className="no-print" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '25px', maxWidth: '800px', margin: '0 auto 25px auto' }}>
                <Link href="/" style={{ textDecoration: 'none', color: '#1e293b', fontWeight: 'bold', fontSize: '16px' }}>⬅️ Dashboard</Link>
                <h2 style={{ margin: 0, color: '#0f172a', fontSize: '18px' }}>🏷️ Thermal Barcode & Label Printer</h2>
                <div style={{ width: '80px' }}></div>
            </div>

            {/* Control Panel */}
            <div className="no-print" style={{ maxWidth: '800px', margin: '0 auto', backgroundColor: '#fff', padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0', marginBottom: '25px' }}>
                <div style={{ display: 'flex', gap: '15px', alignItems: 'end', flexWrap: 'wrap' }}>
                    <div style={{ flex: 2, minWidth: '220px' }}>
                        <label style={{ fontSize: '12px', fontWeight: 'bold', display: 'block', marginBottom: '6px' }}>Select Medicine (Single)</label>
                        <select
                            onChange={(e) => {
                                setPrintAllMode(false);
                                const prod = products.find((p) => p.id === e.target.value);
                                setSelectedProduct(prod || null);
                            }}
                            style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '14px' }}
                        >
                            <option value="">-- Select Product --</option>
                            {products.map((p) => (
                                <option key={p.id} value={p.id}>{p.name} - ৳{p.salePrice}</option>
                            ))}
                        </select>
                    </div>

                    <div style={{ width: '100px' }}>
                        <label style={{ fontSize: '12px', fontWeight: 'bold', display: 'block', marginBottom: '6px' }}>Quantity</label>
                        <input
                            type="number"
                            value={printQty}
                            onChange={(e) => setPrintQty(Number(e.target.value))}
                            style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '14px', boxSizing: 'border-box' }}
                        />
                    </div>

                    <button
                        onClick={handlePrint}
                        disabled={!selectedProduct && !printAllMode}
                        style={{ backgroundColor: (selectedProduct || printAllMode) ? '#16a34a' : '#cbd5e1', color: '#fff', border: 'none', padding: '10px 16px', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}
                    >
                        🖨️ Print Sticker
                    </button>

                    <button
                        onClick={() => {
                            setPrintAllMode(true);
                            setSelectedProduct(null);
                        }}
                        style={{ backgroundColor: '#0284c7', color: '#fff', border: 'none', padding: '10px 16px', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}
                    >
                        📦 Print All Products ({products.length})
                    </button>
                </div>
            </div>

            {/* Thermal Printer Preview Area */}
            {(selectedProduct || printAllMode) && (
                <div style={{ maxWidth: '400px', margin: '0 auto' }}>
                    <h4 className="no-print" style={{ margin: '0 0 10px 0', color: '#64748b', fontSize: '14px' }}>
                        {printAllMode ? `All Products Barcodes Preview (${products.length} items):` : 'Thermal Sticker Preview (58mm):'}
                    </h4>

                    <div
                        id="thermal-print-area"
                        style={{
                            backgroundColor: '#fff',
                            padding: '10px',
                            borderRadius: '8px',
                            border: '1px solid #cbd5e1',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '10px',
                            alignItems: 'center'
                        }}
                    >
                        {printAllMode ? (
                            products.map((p) => (
                                <div
                                    key={p.id}
                                    style={{
                                        width: '50mm',
                                        border: '1px dashed #94a3b8',
                                        padding: '6px',
                                        borderRadius: '4px',
                                        textAlign: 'center',
                                        backgroundColor: '#fff',
                                        fontFamily: 'monospace',
                                        boxSizing: 'border-box',
                                        marginBottom: '6px'
                                    }}
                                >
                                    <div style={{ fontSize: '9px', fontWeight: 'bold', textTransform: 'uppercase' }}>Sardar Medical Hall</div>
                                    <div style={{ fontSize: '11px', fontWeight: 'bold', margin: '2px 0', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                        {p.name}
                                    </div>
                                    <div style={{ fontSize: '13px', fontWeight: 'bold', color: '#000' }}>৳ {p.salePrice}</div>

                                    <div style={{ height: '24px', backgroundColor: '#000', margin: '4px auto', width: '90%', display: 'flex', justifyContent: 'space-between', padding: '1px', WebkitPrintColorAdjust: 'exact' }}>
                                        {Array.from({ length: 18 }).map((_, i) => (
                                            <div key={i} style={{ width: i % 2 === 0 ? '2px' : '1px', backgroundColor: '#fff', height: '100%', WebkitPrintColorAdjust: 'exact' }}></div>
                                        ))}
                                    </div>
                                    <div style={{ fontSize: '8px', letterSpacing: '1px' }}>*{p.id.slice(-6).toUpperCase()}*</div>
                                </div>
                            ))
                        ) : (
                            selectedProduct && Array.from({ length: printQty }).map((_, idx) => (
                                <div
                                    key={idx}
                                    style={{
                                        width: '50mm',
                                        border: '1px dashed #94a3b8',
                                        padding: '6px',
                                        borderRadius: '4px',
                                        textAlign: 'center',
                                        backgroundColor: '#fff',
                                        fontFamily: 'monospace',
                                        boxSizing: 'border-box',
                                    }}
                                >
                                    <div style={{ fontSize: '9px', fontWeight: 'bold', textTransform: 'uppercase' }}>Sardar Medical Hall</div>
                                    <div style={{ fontSize: '11px', fontWeight: 'bold', margin: '2px 0', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                        {selectedProduct.name}
                                    </div>
                                    <div style={{ fontSize: '13px', fontWeight: 'bold', color: '#000' }}>৳ {selectedProduct.salePrice}</div>

                                    <div style={{ height: '24px', backgroundColor: '#000', margin: '4px auto', width: '90%', display: 'flex', justifyContent: 'space-between', padding: '1px', WebkitPrintColorAdjust: 'exact' }}>
                                        {Array.from({ length: 18 }).map((_, i) => (
                                            <div key={i} style={{ width: i % 2 === 0 ? '2px' : '1px', backgroundColor: '#fff', height: '100%', WebkitPrintColorAdjust: 'exact' }}></div>
                                        ))}
                                    </div>
                                    <div style={{ fontSize: '8px', letterSpacing: '1px' }}>*{selectedProduct.id.slice(-6).toUpperCase()}*</div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}

        </div>
    );
}