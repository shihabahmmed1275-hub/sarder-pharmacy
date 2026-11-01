'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { db } from '../firebase';
import { ref, onValue, push, set, update, remove } from 'firebase/database';

interface Product {
    id: string;
    name: string;
    generic?: string;
    company?: string;
    type?: string;
    stock: number;
    buyPrice: number;
    salePrice: number;
    expiryDate?: string;
    boxSize?: number;
}

export default function ProductsPage() {
    const [mounted, setMounted] = useState(false);
    const [products, setProducts] = useState<Product[]>([]);
    const [search, setSearch] = useState('');

    // Form States
    const [editId, setEditId] = useState<string | null>(null);
    const [name, setName] = useState('');
    const [generic, setGeneric] = useState('');
    const [company, setCompany] = useState('');
    const [type, setType] = useState('Tablet');
    const [stock, setStock] = useState('');
    const [buyPrice, setBuyPrice] = useState('');
    const [salePrice, setSalePrice] = useState('');
    const [expiryDate, setExpiryDate] = useState('');
    const [boxSize, setBoxSize] = useState('10');

    useEffect(() => {
        setMounted(true);
        const productsRef = ref(db, 'products');
        const unsubscribe = onValue(productsRef, (snapshot) => {
            const data = snapshot.val();
            if (data) {
                const list: Product[] = Object.keys(data).map((key) => {
                    const item = data[key];

                    // Added buyPricePcs and sellPricePcs to match your database structure exactly
                    const extractedBuyPrice = Number(
                        item.buyPricePcs ?? item.buyPrice ?? item.costPrice ?? item.purchasePrice ?? item.tp ?? item.rate ?? item.unitPrice ?? item.price ?? 0
                    );
                    const extractedSalePrice = Number(
                        item.sellPricePcs ?? item.salePrice ?? item.mrp ?? item.sellingPrice ?? item.retailPrice ?? item.pricePerUnit ?? item.price ?? 0
                    );

                    return {
                        id: key,
                        name: item.name || item.productName || item.title || '',
                        generic: item.generic || item.genericName || '',
                        company: item.company || item.manufacturer || '',
                        type: item.type || item.form || 'Tablet',
                        stock: Number(item.stock || item.quantity || item.qty || item.count || 0),
                        buyPrice: extractedBuyPrice,
                        salePrice: extractedSalePrice,
                        expiryDate: item.expiryDate || item.expDate || item.expiry || '',
                        boxSize: Number(item.boxSize || item.packSize || 10),
                    };
                });
                setProducts(list.reverse());
            } else {
                setProducts([]);
            }
        });

        return () => unsubscribe();
    }, []);

    const handleSaveProduct = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name || !buyPrice || !salePrice) {
            alert('Oushodher nam, kena dam ebong bikroy mullyo obosshoi dite hobe!');
            return;
        }

        const payload = {
            name,
            generic,
            company,
            type,
            stock: Number(stock || 0),
            buyPrice: Number(buyPrice),
            salePrice: Number(salePrice),
            buyPricePcs: Number(buyPrice), // Saving with both formats for maximum compatibility
            sellPricePcs: Number(salePrice),
            costPrice: Number(buyPrice),
            mrp: Number(salePrice),
            expiryDate: expiryDate || '',
            boxSize: Number(boxSize || 1),
            updatedAt: new Date().toISOString(),
        };

        try {
            if (editId) {
                await update(ref(db, `products/${editId}`), payload);
                alert('✅ Oushodh ebong expiry date safolvabe update hoyeche!');
            } else {
                const newRef = push(ref(db, 'products'));
                await set(newRef, {
                    ...payload,
                    createdAt: new Date().toISOString(),
                });
                alert('✅ Notun oushodh jukto hoyeche!');
            }

            resetForm();
        } catch (err) {
            console.error(err);
            alert('Save korte somossa hoyeche!');
        }
    };

    const handleEdit = (p: Product) => {
        setEditId(p.id);
        setName(p.name);
        setGeneric(p.generic || '');
        setCompany(p.company || '');
        setType(p.type || 'Tablet');
        setStock(p.stock.toString());
        setBuyPrice(p.buyPrice > 0 ? p.buyPrice.toString() : '');
        setSalePrice(p.salePrice > 0 ? p.salePrice.toString() : '');
        setExpiryDate(p.expiryDate || '');
        setBoxSize((p.boxSize || 10).toString());
    };

    const handleDelete = async (id: string, prodName: string) => {
        if (confirm(`Apni ki sotti "${prodName}" oushodh-ti muche felte chacchen?`)) {
            try {
                await remove(ref(db, `products/${id}`));
                alert('🗑️ Safolvabe delete kora hoyeche!');
            } catch (err) {
                console.error(err);
                alert('Delete korte somossa hoyeche!');
            }
        }
    };

    const handleDeleteAllProducts = async () => {
        if (products.length === 0) {
            alert('Database-e kono product nei!');
            return;
        }
        if (confirm('⚠️ Apni ki nischit bhabe database-er sob products delete kore dite chacchen? Eta ar firiye ana jabe na!')) {
            try {
                await remove(ref(db, 'products'));
                alert('🗑️ Database-er sob products safolvabe muche fela hoyeche!');
            } catch (err) {
                console.error(err);
                alert('Data muche felte somossa hoyeche!');
            }
        }
    };

    const resetForm = () => {
        setEditId(null);
        setName('');
        setGeneric('');
        setCompany('');
        setType('Tablet');
        setStock('');
        setBuyPrice('');
        setSalePrice('');
        setExpiryDate('');
        setBoxSize('10');
    };

    const filteredProducts = products.filter(
        (p) =>
            p.name.toLowerCase().includes(search.toLowerCase()) ||
            (p.generic && p.generic.toLowerCase().includes(search.toLowerCase())) ||
            (p.company && p.company.toLowerCase().includes(search.toLowerCase()))
    );

    if (!mounted) {
        return (
            <div style={{ padding: '20px', fontFamily: 'system-ui, sans-serif' }}>
                <p style={{ color: '#ef4444', fontWeight: 'bold' }}>Loading Products...</p>
            </div>
        );
    }

    return (
        <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto', fontFamily: 'system-ui, sans-serif', backgroundColor: '#f8fafc', minHeight: '100vh' }}>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
                <Link href="/" style={{ textDecoration: 'none', color: '#e11d48', fontWeight: 'bold', fontSize: '15px' }}>
                    ⬅️ Back to Dashboard
                </Link>
                <h2 style={{ margin: 0, color: '#1e293b', fontSize: '20px' }}>📋 Product & Expiry Management (Oushodh o Meyad Babosthapona)</h2>
                <div style={{ width: '100px' }}></div>
            </div>

            <div style={{ background: '#fff', padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', marginBottom: '25px' }}>
                <h3 style={{ margin: '0 0 15px 0', color: '#1e293b', fontSize: '16px' }}>
                    {editId ? '✏️ Oushodh Edit Korun' : '➕ Notun Oushodh o Meyad Jukto Korun'}
                </h3>

                <form onSubmit={handleSaveProduct} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px' }}>

                    <div>
                        <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#475569' }}>Oushodher Nam *</label>
                        <input
                            type="text"
                            placeholder="e.g. Napa 500mg"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            required
                            style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px', marginTop: '4px', boxSizing: 'border-box' }}
                        />
                    </div>

                    <div>
                        <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#475569' }}>Generic Nam</label>
                        <input
                            type="text"
                            placeholder="e.g. Paracetamol"
                            value={generic}
                            onChange={(e) => setGeneric(e.target.value)}
                            style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px', marginTop: '4px', boxSizing: 'border-box' }}
                        />
                    </div>

                    <div>
                        <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#475569' }}>Company</label>
                        <input
                            type="text"
                            placeholder="e.g. Beximco"
                            value={company}
                            onChange={(e) => setCompany(e.target.value)}
                            style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px', marginTop: '4px', boxSizing: 'border-box' }}
                        />
                    </div>

                    <div>
                        <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#475569' }}>Type</label>
                        <select
                            value={type}
                            onChange={(e) => setType(e.target.value)}
                            style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px', marginTop: '4px', boxSizing: 'border-box' }}
                        >
                            <option value="Tablet">Tablet</option>
                            <option value="Capsule">Capsule</option>
                            <option value="Syrup">Syrup</option>
                            <option value="Suspension">Suspension</option>
                            <option value="Injection">Injection</option>
                            <option value="Drop">Drop</option>
                            <option value="Ointment">Ointment</option>
                        </select>
                    </div>

                    <div>
                        <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#475569' }}>Stock (Pcs)</label>
                        <input
                            type="number"
                            placeholder="0"
                            value={stock}
                            onChange={(e) => setStock(e.target.value)}
                            style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px', marginTop: '4px', boxSizing: 'border-box' }}
                        />
                    </div>

                    <div>
                        <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#475569' }}>Ekok Kena Dam (৳) *</label>
                        <input
                            type="number"
                            step="0.01"
                            placeholder="0.00"
                            value={buyPrice}
                            onChange={(e) => setBuyPrice(e.target.value)}
                            required
                            style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px', marginTop: '4px', boxSizing: 'border-box' }}
                        />
                    </div>

                    <div>
                        <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#475569' }}>Ekok Bikri Dam (৳) *</label>
                        <input
                            type="number"
                            step="0.01"
                            placeholder="0.00"
                            value={salePrice}
                            onChange={(e) => setSalePrice(e.target.value)}
                            required
                            style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px', marginTop: '4px', boxSizing: 'border-box' }}
                        />
                    </div>

                    <div>
                        <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#dc2626' }}>Meyad Shes Tarikh (Exp Date)</label>
                        <input
                            type="date"
                            value={expiryDate}
                            onChange={(e) => setExpiryDate(e.target.value)}
                            style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #ef4444', fontSize: '13px', marginTop: '4px', boxSizing: 'border-box', backgroundColor: '#fef2f2' }}
                        />
                    </div>

                    <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-end' }}>
                        <button
                            type="submit"
                            style={{ flex: 1, backgroundColor: editId ? '#0284c7' : '#16a34a', color: '#fff', border: 'none', padding: '9px', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', fontSize: '13px' }}
                        >
                            {editId ? 'Update Korun' : 'Save Korun'}
                        </button>
                        {editId && (
                            <button
                                type="button"
                                onClick={resetForm}
                                style={{ backgroundColor: '#64748b', color: '#fff', border: 'none', padding: '9px 12px', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', fontSize: '13px' }}
                            >
                                Batil
                            </button>
                        )}
                    </div>

                </form>
            </div>

            <div style={{ background: '#fff', padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px', flexWrap: 'wrap', gap: '10px' }}>
                    <h3 style={{ margin: 0, color: '#1e293b', fontSize: '16px' }}>📦 Shob Oushodh ({filteredProducts.length})</h3>

                    <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                        <input
                            type="text"
                            placeholder="🔍 Oushodher nam, generic ba company khujun..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            style={{ padding: '8px 14px', borderRadius: '20px', border: '1px solid #cbd5e1', width: '250px', fontSize: '13px' }}
                        />

                        <button
                            onClick={handleDeleteAllProducts}
                            style={{ backgroundColor: '#dc2626', color: '#fff', border: 'none', padding: '8px 14px', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', fontSize: '12px' }}
                        >
                            ⚠️ Sob Oushodh Delete Korun
                        </button>
                    </div>
                </div>

                <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', textAlign: 'left' }}>
                        <thead>
                            <tr style={{ backgroundColor: '#f1f5f9', color: '#334155', borderBottom: '2px solid #e2e8f0' }}>
                                <th style={{ padding: '10px' }}>Oushodher Nam</th>
                                <th style={{ padding: '10px' }}>Generic / Company</th>
                                <th style={{ padding: '10px' }}>Type</th>
                                <th style={{ padding: '10px', textAlign: 'center' }}>Stock</th>
                                <th style={{ padding: '10px' }}>KenaDam</th>
                                <th style={{ padding: '10px' }}>BikriDam</th>
                                <th style={{ padding: '10px' }}>Meyad (Exp Date)</th>
                                <th style={{ padding: '10px', textAlign: 'center' }}>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredProducts.length > 0 ? (
                                filteredProducts.map((p) => {
                                    const isExpired = p.expiryDate ? new Date(p.expiryDate) < new Date() : false;
                                    return (
                                        <tr key={p.id} style={{ borderBottom: '1px solid #f1f5f9', backgroundColor: isExpired ? '#fff1f2' : 'transparent' }}>
                                            <td style={{ padding: '10px', fontWeight: 'bold', color: '#1e293b' }}>
                                                {p.name}
                                                {isExpired && <span style={{ marginLeft: '6px', fontSize: '10px', backgroundColor: '#dc2626', color: '#fff', padding: '2px 5px', borderRadius: '4px' }}>Expired</span>}
                                            </td>
                                            <td style={{ padding: '10px', color: '#64748b' }}>
                                                {p.generic || '-'}<br />
                                                <span style={{ fontSize: '11px', color: '#94a3b8' }}>{p.company}</span>
                                            </td>
                                            <td style={{ padding: '10px', color: '#475569' }}>{p.type}</td>
                                            <td style={{ padding: '10px', textAlign: 'center', fontWeight: 'bold', color: p.stock === 0 ? '#dc2626' : '#1e293b' }}>
                                                {p.stock} Pcs
                                            </td>
                                            <td style={{ padding: '10px', color: '#334155' }}>৳ {p.buyPrice}</td>
                                            <td style={{ padding: '10px', fontWeight: 'bold', color: '#16a34a' }}>৳ {p.salePrice}</td>
                                            <td style={{ padding: '10px', fontWeight: isExpired ? 'bold' : 'normal', color: isExpired ? '#dc2626' : '#64748b' }}>
                                                {p.expiryDate || '-'}
                                            </td>
                                            <td style={{ padding: '10px', textAlign: 'center' }}>
                                                <button
                                                    onClick={() => handleEdit(p)}
                                                    style={{ backgroundColor: '#e0f2fe', color: '#0284c7', border: 'none', padding: '5px 10px', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', marginRight: '6px', fontSize: '12px' }}
                                                >
                                                    Edit
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(p.id, p.name)}
                                                    style={{ backgroundColor: '#fee2e2', color: '#dc2626', border: 'none', padding: '5px 10px', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', fontSize: '12px' }}
                                                >
                                                    Delete
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })
                            ) : (
                                <tr>
                                    <td colSpan={8} style={{ textAlign: 'center', padding: '30px', color: '#94a3b8' }}>
                                        Kono product paoa jayni
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