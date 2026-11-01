'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { db } from '../firebase';
import { ref, onValue, push, set, update } from 'firebase/database';

interface Product {
    id: string;
    name: string;
    company: string;
    generic: string;
    stockPcs: number;
    pcsMrp: number;
    pcsBuyPrice: number;
}

interface CartItem {
    id: string;
    name: string;
    qty: number;
    pcsMrp: number;
    total: number;
    pcsBuyPrice: number;
    stockPcs: number;
}

export default function POSPage() {
    const [inventory, setInventory] = useState<Product[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [cart, setCart] = useState<CartItem[]>([]);

    const [invoiceNo, setInvoiceNo] = useState('');
    const [customerName, setCustomerName] = useState('');
    const [customerMobile, setCustomerMobile] = useState('');
    const [discountType, setDiscountType] = useState<'Flat' | 'Percent'>('Flat');
    const [discountVal, setDiscountVal] = useState<number>(0);
    const [paidAmount, setPaidAmount] = useState<number>(0);

    // Thermal Printer Paper Size State ('58mm' or '80mm')
    const [paperSize, setPaperSize] = useState<'58mm' | '80mm'>('58mm');

    const [isSaving, setIsSaving] = useState(false);
    const [currentDate, setCurrentDate] = useState('');
    const [showNotification, setShowNotification] = useState(false);
    const [lastSavedSale, setLastSavedSale] = useState<any>(null);

    // Dynamic Shop Profile State
    const [shopProfile, setShopProfile] = useState({
        shopName: 'Sardar Medical Hall',
        address: 'Gopalpur Bazar, Manda',
        phone: '017XXXXXXXX',
        footerMsg: 'বিক্রিত ওষুধ ফেরত নেওয়া হয় না। ধন্যবাদ!'
    });

    // Quick Calculator States
    const [showCalc, setShowCalc] = useState(false);
    const [calcInput, setCalcInput] = useState('');
    const [calcResult, setCalcResult] = useState<string | number>('');

    const generateInvoiceNo = () => {
        setInvoiceNo(`INV-${Math.floor(100000 + Math.random() * 900000)}`);
    };

    useEffect(() => {
        setCurrentDate(new Date().toLocaleDateString('en-GB'));
        generateInvoiceNo();

        // Fetch Shop Profile from Firebase
        const shopRef = ref(db, 'shopProfile');
        onValue(shopRef, (snapshot) => {
            const data = snapshot.val();
            if (data) {
                setShopProfile({
                    shopName: data.shopName || 'Sardar Medical Hall',
                    address: data.address || 'Gopalpur Bazar, Manda',
                    phone: data.phone || '017XXXXXXXX',
                    footerMsg: data.footerMsg || 'বিক্রিত ওষুধ ফেরত নেওয়া হয় না। ধন্যবাদ!'
                });
            }
        });
    }, []);

    useEffect(() => {
        const invRef = ref(db, 'inventory');
        const unsubscribe = onValue(invRef, (snapshot) => {
            const data = snapshot.val();
            if (data) {
                const loadedProducts: Product[] = [];
                Object.entries(data).forEach(([key, val]: [string, any]) => {
                    let pcsMrp = Number(val.sellPricePcs || val.pcsMrp || val.sellPrice || 0);
                    let pcsBuy = Number(val.buyPricePcs || val.pcsBuyPrice || val.buyPrice || 0);
                    let pcsPerBox = Number(val.boxSize || 10);

                    if (pcsMrp > 30 && pcsPerBox > 1) {
                        pcsMrp = Number((pcsMrp / pcsPerBox).toFixed(2));
                        pcsBuy = Number((pcsBuy / pcsPerBox).toFixed(2));
                    }

                    loadedProducts.push({
                        id: key,
                        name: val.name || 'Unknown',
                        company: val.company || '',
                        generic: val.generic || '',
                        stockPcs: Number(val.stock || 0),
                        pcsMrp,
                        pcsBuyPrice: pcsBuy,
                    });
                });
                setInventory(loadedProducts);
            }
        });

        return () => unsubscribe();
    }, []);

    const filteredProducts = inventory.filter(
        (p) =>
            p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            p.generic.toLowerCase().includes(searchTerm.toLowerCase()) ||
            p.company.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const addToCart = (product: Product) => {
        const existingIndex = cart.findIndex((item) => item.id === product.id);

        if (existingIndex > -1) {
            const updated = [...cart];
            if (updated[existingIndex].qty + 1 > product.stockPcs) {
                alert('⚠️ স্টকে পর্যাপ্ত পিস নেই!');
                return;
            }
            updated[existingIndex].qty += 1;
            updated[existingIndex].total = Number((updated[existingIndex].qty * updated[existingIndex].pcsMrp).toFixed(2));
            setCart(updated);
        } else {
            if (product.stockPcs < 1) {
                alert('⚠️ এই ওষুধটি স্টক আউট!');
                return;
            }
            setCart([
                ...cart,
                {
                    id: product.id,
                    name: product.name,
                    qty: 1,
                    pcsMrp: product.pcsMrp,
                    total: product.pcsMrp,
                    pcsBuyPrice: product.pcsBuyPrice,
                    stockPcs: product.stockPcs,
                },
            ]);
        }
        setSearchTerm('');
        setIsDropdownOpen(false);
    };

    const updateCartQty = (index: number, newQty: number) => {
        if (newQty <= 0) {
            removeCartItem(index);
            return;
        }
        const updated = [...cart];
        if (newQty > updated[index].stockPcs) {
            alert('⚠️ স্টকে পর্যাপ্ত পিস নেই!');
            return;
        }
        updated[index].qty = newQty;
        updated[index].total = Number((newQty * updated[index].pcsMrp).toFixed(2));
        setCart(updated);
    };

    const removeCartItem = (index: number) => {
        setCart(cart.filter((_, i) => i !== index));
    };

    const subTotal = cart.reduce((acc, item) => acc + item.total, 0);
    const calculatedDiscount = discountType === 'Flat' ? discountVal : (subTotal * discountVal) / 100;
    const grandTotal = Math.max(0, Number((subTotal - calculatedDiscount).toFixed(2)));
    const dueAmount = Math.max(0, Number((grandTotal - paidAmount).toFixed(2)));
    const totalBuyCost = cart.reduce((acc, item) => acc + item.pcsBuyPrice * item.qty, 0);
    const totalProfit = Math.max(0, Number((grandTotal - totalBuyCost).toFixed(2)));

    const handleCheckout = async () => {
        if (cart.length === 0) return alert('⚠️ কার্ট খালি!');

        setIsSaving(true);
        try {
            const salesRef = ref(db, 'sales');
            const newSaleRef = push(salesRef);

            const saleData = {
                invoiceNo,
                customerName: customerName || 'সাধারণ কাস্টমার',
                customerMobile: customerMobile || 'N/A',
                items: cart,
                subTotal,
                discount: calculatedDiscount,
                totalAmount: grandTotal,
                totalProfit,
                paidAmount,
                dueAmount,
                status: dueAmount === 0 ? 'PAID' : 'DUE',
                createdAt: new Date().toISOString(),
            };

            await set(newSaleRef, saleData);

            for (const item of cart) {
                const itemRef = ref(db, `inventory/${item.id}`);
                await update(itemRef, { stock: item.stockPcs - item.qty });
            }

            setLastSavedSale(saleData);
            setShowNotification(true);

            // পপআপ উইন্ডো ওপেন করে সরাসরি থার্মাল প্রিন্ট করার লজিক
            const printWindow = window.open('', '_blank', 'width=400,height=600');
            if (printWindow) {
                printWindow.document.write(`
                    <html>
                        <head>
                            <title>Print Invoice - ${invoiceNo}</title>
                            <style>
                                @page {
                                    size: ${paperSize === '58mm' ? '58mm' : '80mm'} auto;
                                    margin: 0;
                                }
                                body {
                                    font-family: monospace;
                                    font-size: ${paperSize === '58mm' ? '10px' : '12px'};
                                    width: ${paperSize === '58mm' ? '48mm' : '72mm'};
                                    margin: 0 auto;
                                    padding: 2mm;
                                    color: #000;
                                }
                                h3 { text-align: center; margin: 0 0 4px 0; font-size: ${paperSize === '58mm' ? '13px' : '16px'}; }
                                .center { text-align: center; }
                                table { width: 100%; border-collapse: collapse; margin-top: 5px; }
                                th { border-bottom: 1px solid #000; text-align: left; padding-bottom: 2px; }
                                td { padding: 2px 0; }
                                hr { border: none; border-top: 1px dashed #000; margin: 5px 0; }
                                .flex { display: flex; justify-content: space-between; }
                                .bold { font-weight: bold; }
                            </style>
                        </head>
                        <body>
                            <h3>${shopProfile.shopName}</h3>
                            <div class="center" style="font-size: ${paperSize === '58mm' ? '9px' : '11px'};">
                                ${shopProfile.address}<br/>Phone: ${shopProfile.phone}
                            </div>
                            <hr/>
                            <div style="font-size: ${paperSize === '58mm' ? '9px' : '11px'};">
                                <strong>Inv:</strong> ${invoiceNo}<br/>
                                <strong>Date:</strong> ${currentDate}<br/>
                                <strong>Cust:</strong> ${customerName || 'সাধারণ কাস্টমার'}
                            </div>
                            <hr/>
                            <table>
                                <thead>
                                    <tr>
                                        <th>Item</th>
                                        <th style="text-align:center;">Qty</th>
                                        <th style="text-align:right;">Total</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${cart.map(i => `
                                        <tr>
                                            <td>${i.name}</td>
                                            <td style="text-align:center;">${i.qty}</td>
                                            <td style="text-align:right;">৳${i.total.toFixed(2)}</td>
                                        </tr>
                                    `).join('')}
                                </tbody>
                            </table>
                            <hr/>
                            <div class="flex"><span>Subtotal:</span> <span>৳${subTotal.toFixed(2)}</span></div>
                            ${calculatedDiscount > 0 ? `<div class="flex"><span>Discount:</span> <span>- ৳${calculatedDiscount.toFixed(2)}</span></div>` : ''}
                            <div class="flex bold" style="font-weight:bold; font-size: ${paperSize === '58mm' ? '11px' : '13px'}; border-top: 1px solid #000; padding-top: 3px; margin-top: 2px;">
                                <span>Grand Total:</span> <span>৳${grandTotal.toFixed(2)}</span>
                            </div>
                            <div class="flex"><span>Paid:</span> <span>৳${paidAmount.toFixed(2)}</span></div>
                            <div class="flex"><span>Due:</span> <span>৳${dueAmount.toFixed(2)}</span></div>
                            <hr/>
                            <div class="center" style="font-style: italic; font-size: ${paperSize === '58mm' ? '8px' : '10px'};">
                                ${shopProfile.footerMsg}
                            </div>
                        </body>
                    </html>
                `);
                printWindow.document.close();
                printWindow.focus();
                setTimeout(() => {
                    printWindow.print();
                    printWindow.close();
                }, 400);
            }

            setCart([]);
            setCustomerName('');
            setCustomerMobile('');
            setDiscountVal(0);
            setPaidAmount(0);
            generateInvoiceNo();
        } catch (err: any) {
            alert('❌ সেভ করতে সমস্যা হয়েছে!');
        } finally {
            setIsSaving(false);
        }
    };

    // Calculator Logic
    const handleCalcBtn = (val: string) => {
        if (val === 'C') {
            setCalcInput('');
            setCalcResult('');
        } else if (val === '=') {
            try {
                setCalcResult(eval(calcInput));
            } catch {
                setCalcResult('Error');
            }
        } else {
            setCalcInput((prev) => prev + val);
        }
    };

    return (
        <div style={{ backgroundColor: '#f8fafc', minHeight: '100vh', padding: '15px', fontFamily: 'system-ui, sans-serif' }}>

            {/* Screen Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '15px', maxWidth: '1000px', margin: '0 auto 15px auto' }}>
                <Link href="/" style={{ textDecoration: 'none', color: '#1e293b', fontWeight: 'bold', fontSize: '18px' }}>⬅️</Link>
                <h2 style={{ margin: 0, color: '#1e293b', fontSize: '20px', fontWeight: '800' }}>স্মার্ট বিলিং (Sale / POS)</h2>

                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                    {/* Paper Size Selector */}
                    <select
                        value={paperSize}
                        onChange={(e) => setPaperSize(e.target.value as '58mm' | '80mm')}
                        style={{ padding: '6px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px', fontWeight: 'bold', backgroundColor: '#fff' }}
                    >
                        <option value="58mm">🖨️ Thermal 58mm</option>
                        <option value="80mm">🖨️ Thermal 80mm</option>
                    </select>

                    <button onClick={() => setShowCalc(!showCalc)} style={{ padding: '6px 12px', background: '#e11d48', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '13px' }}>
                        🧮 ক্যালকুলেটর
                    </button>
                </div>
            </div>

            {/* Calculator Popup Widget */}
            {showCalc && (
                <div style={{ position: 'fixed', top: '70px', right: '30px', background: '#1e293b', color: '#fff', padding: '15px', borderRadius: '12px', zIndex: 9999, width: '220px', boxShadow: '0 10px 25px rgba(0,0,0,0.3)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                        <span style={{ fontSize: '13px', fontWeight: 'bold' }}>ক্যালকুলেটর</span>
                        <button onClick={() => setShowCalc(false)} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer' }}>✕</button>
                    </div>
                    <div style={{ background: '#0f172a', padding: '10px', borderRadius: '6px', textAlign: 'right', marginBottom: '10px', minHeight: '40px' }}>
                        <div style={{ fontSize: '12px', color: '#94a3b8' }}>{calcInput || '0'}</div>
                        <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#38bdf8' }}>{calcResult || ''}</div>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '6px' }}>
                        {['7', '8', '9', '/', '4', '5', '6', '*', '1', '2', '3', '-', 'C', '0', '=', '+'].map((btn) => (
                            <button key={btn} onClick={() => handleCalcBtn(btn)} style={{ padding: '10px', background: btn === '=' ? '#e11d48' : '#334155', color: '#fff', border: 'none', borderRadius: '4px', fontWeight: 'bold', cursor: 'pointer' }}>
                                {btn}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* Main Billing UI */}
            <div style={{ maxWidth: '1000px', margin: '0 auto', background: '#fff', borderRadius: '16px', padding: '20px', border: '1px solid #e2e8f0' }}>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '15px', marginBottom: '15px' }}>
                    <div>
                        <label style={{ fontSize: '12px', fontWeight: 'bold' }}>ইনভয়েস নম্বর</label>
                        <input type="text" value={invoiceNo} readOnly style={{ width: '100%', padding: '8px', background: '#f1f5f9', border: '1px solid #e2e8f0', borderRadius: '6px', fontWeight: 'bold' }} />
                    </div>
                    <div>
                        <label style={{ fontSize: '12px', fontWeight: 'bold' }}>কাস্টমারের নাম</label>
                        <input type="text" placeholder="কাস্টমারের নাম" value={customerName} onChange={(e) => setCustomerName(e.target.value)} style={{ width: '100%', padding: '8px', border: '1px solid #e2e8f0', borderRadius: '6px' }} />
                    </div>
                    <div>
                        <label style={{ fontSize: '12px', fontWeight: 'bold' }}>মোবাইল নম্বর</label>
                        <input type="text" placeholder="017XXXXXXXX" value={customerMobile} onChange={(e) => setCustomerMobile(e.target.value)} style={{ width: '100%', padding: '8px', border: '1px solid #e2e8f0', borderRadius: '6px' }} />
                    </div>
                </div>

                {/* Search */}
                <div style={{ position: 'relative', marginBottom: '20px' }}>
                    <input
                        type="text"
                        placeholder="🔍 ওষুধের নাম লিখে সার্চ করুন..."
                        value={searchTerm}
                        onChange={(e) => {
                            setSearchTerm(e.target.value);
                            setIsDropdownOpen(true);
                        }}
                        onFocus={() => setIsDropdownOpen(true)}
                        style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '14px', boxSizing: 'border-box' }}
                    />

                    {isDropdownOpen && searchTerm.trim().length > 0 && (
                        <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, backgroundColor: '#fff', border: '1px solid #cbd5e1', borderRadius: '8px', marginTop: '4px', maxHeight: '200px', overflowY: 'auto', zIndex: 1000 }}>
                            {filteredProducts.map((product) => (
                                <div
                                    key={product.id}
                                    onClick={() => addToCart(product)}
                                    style={{ padding: '10px 14px', borderBottom: '1px solid #f1f5f9', cursor: 'pointer', display: 'flex', justifyContent: 'space-between' }}
                                >
                                    <span><strong>{product.name}</strong> ({product.company})</span>
                                    <span style={{ color: '#0284c7', fontWeight: 'bold' }}>৳{product.pcsMrp.toFixed(2)}/পিস [স্টক: {product.stockPcs} পিস]</span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Table View */}
                <div style={{ overflowX: 'auto', marginBottom: '20px' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                        <thead>
                            <tr style={{ backgroundColor: '#f8fafc', borderBottom: '2px solid #e2e8f0', color: '#475569', fontSize: '13px' }}>
                                <th style={{ padding: '10px' }}>আইটেম</th>
                                <th style={{ padding: '10px', width: '120px' }}>পরিমাণ</th>
                                <th style={{ padding: '10px', width: '120px' }}>পিস MRP</th>
                                <th style={{ padding: '10px', width: '120px' }}>মোট</th>
                                <th style={{ padding: '10px', width: '80px', textAlign: 'center' }}>অ্যাকশন</th>
                            </tr>
                        </thead>
                        <tbody>
                            {cart.length === 0 ? (
                                <tr>
                                    <td colSpan={5} style={{ textAlign: 'center', padding: '30px', color: '#94a3b8' }}>কোনো ওষুধ সিলেক্ট করা হয়নি</td>
                                </tr>
                            ) : (
                                cart.map((item, index) => (
                                    <tr key={index} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                        <td style={{ padding: '10px', fontWeight: '600' }}>{item.name}</td>
                                        <td style={{ padding: '10px' }}>
                                            <input type="number" value={item.qty} onChange={(e) => updateCartQty(index, Number(e.target.value))} style={{ width: '60px', padding: '6px', textAlign: 'center', border: '1px solid #cbd5e1', borderRadius: '6px' }} />
                                        </td>
                                        <td style={{ padding: '10px', color: '#475569' }}>৳{item.pcsMrp.toFixed(2)}</td>
                                        <td style={{ padding: '10px', fontWeight: 'bold', color: '#1e293b' }}>৳{item.total.toFixed(2)}</td>
                                        <td style={{ padding: '10px', textAlign: 'center' }}>
                                            <button onClick={() => removeCartItem(index)} style={{ backgroundColor: '#dc2626', color: '#fff', border: 'none', borderRadius: '6px', width: '28px', height: '28px', cursor: 'pointer' }}>✕</button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Totals */}
                <div style={{ backgroundColor: '#f8fafc', padding: '16px', borderRadius: '12px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                        <strong>সাব-টোটাল:</strong>
                        <span>৳{subTotal.toFixed(2)}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                        <span>ডিসকাউন্ট:</span>
                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                            <select value={discountType} onChange={(e) => setDiscountType(e.target.value as 'Flat' | 'Percent')} style={{ padding: '6px', borderRadius: '6px', border: '1px solid #cbd5e1' }}>
                                <option value="Flat">Flat (৳)</option>
                                <option value="Percent">% Percent</option>
                            </select>
                            <input type="number" value={discountVal} onChange={(e) => setDiscountVal(Number(e.target.value))} style={{ width: '80px', padding: '6px', textAlign: 'right', border: '1px solid #cbd5e1', borderRadius: '6px' }} />
                        </div>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', backgroundColor: '#fff1f2', padding: '12px', borderRadius: '8px', color: '#e11d48', fontWeight: 'bold', fontSize: '18px', marginBottom: '15px' }}>
                        <span>সর্বমোট বিল:</span>
                        <span>৳{grandTotal.toFixed(2)}</span>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '20px' }}>
                        <div>
                            <label style={{ fontSize: '12px', fontWeight: 'bold' }}>পেইড পরিমাণ (৳)</label>
                            <input type="number" value={paidAmount} onChange={(e) => setPaidAmount(Number(e.target.value))} style={{ width: '100%', padding: '10px', border: '1px solid #cbd5e1', borderRadius: '8px' }} />
                        </div>
                        <div>
                            <label style={{ fontSize: '12px', fontWeight: 'bold' }}>বকেয়া / Due (৳)</label>
                            <input type="text" value={dueAmount.toFixed(2)} readOnly style={{ width: '100%', padding: '10px', background: dueAmount > 0 ? '#fef2f2' : '#f0fdf4', color: dueAmount > 0 ? '#dc2626' : '#166534', border: '1px solid #fecdd3', borderRadius: '8px', fontWeight: 'bold' }} />
                        </div>
                    </div>

                    <button onClick={handleCheckout} disabled={isSaving} style={{ width: '100%', backgroundColor: '#e11d48', color: '#fff', border: 'none', padding: '14px', borderRadius: '8px', fontWeight: 'bold', fontSize: '16px', cursor: 'pointer' }}>
                        {isSaving ? 'Processing...' : 'পেমেণ্ট ও বিল প্রিন্ট করুন'}
                    </button>
                </div>

            </div>

            {showNotification && (
                <div style={{ position: 'fixed', top: '20px', right: '20px', backgroundColor: '#16a34a', color: '#fff', padding: '16px 24px', borderRadius: '10px', zIndex: 9999 }}>
                    🎉 বিল সফলভাবে সম্পন্ন হয়েছে! ({lastSavedSale?.invoiceNo})
                </div>
            )}

        </div>
    );
}