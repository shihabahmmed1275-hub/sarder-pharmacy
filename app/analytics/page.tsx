'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { db } from '../firebase';
import { ref, onValue } from 'firebase/database';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';

export default function AnalyticsPage() {
    const [salesSummary, setSalesSummary] = useState({
        todaySales: 0,
        todayProfit: 0,
        monthlySales: 0,
        monthlyProfit: 0,
        todayHomeCost: 0,
        monthlyHomeCost: 0,
    });

    const [topProducts, setTopProducts] = useState<any[]>([]);
    const [chartData, setChartData] = useState<any[]>([]);

    useEffect(() => {
        const salesRef = ref(db, 'sales');
        const homeUseRef = ref(db, 'homeUse');

        let salesData: any = null;
        let homeData: any = null;

        const calculateAnalytics = () => {
            let tSale = 0;
            let tProfit = 0;
            let mSale = 0;
            let mProfit = 0;

            let tHome = 0;
            let mHome = 0;

            const productMap: { [key: string]: { count: number; name: string } } = {};
            const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
            const weeklyMap: { [key: string]: number } = {
                Sat: 0, Sun: 0, Mon: 0, Tue: 0, Wed: 0, Thu: 0, Fri: 0
            };

            const now = new Date();
            const todayStr = now.toISOString().split('T')[0];
            const currentMonth = now.getMonth();
            const currentYear = now.getFullYear();

            // Calculate Sales
            if (salesData) {
                Object.values(salesData).forEach((sale: any) => {
                    const saleDate = new Date(sale.createdAt || Date.now());
                    const saleDateStr = sale.createdAt ? sale.createdAt.split('T')[0] : '';

                    const isToday = saleDateStr === todayStr;
                    const isThisMonth = saleDate.getMonth() === currentMonth && saleDate.getFullYear() === currentYear;

                    const amount = Number(sale.totalAmount || 0);
                    const profit = Number(sale.totalProfit || 0);

                    if (isToday) {
                        tSale += amount;
                        tProfit += profit;
                    }

                    if (isThisMonth) {
                        mSale += amount;
                        mProfit += profit;
                    }

                    const dayName = daysOfWeek[saleDate.getDay()];
                    if (weeklyMap[dayName] !== undefined) {
                        weeklyMap[dayName] += amount;
                    }

                    if (sale.items && Array.isArray(sale.items)) {
                        sale.items.forEach((item: any) => {
                            if (!productMap[item.name]) {
                                productMap[item.name] = { count: 0, name: item.name };
                            }
                            productMap[item.name].count += Number(item.qty || 1);
                        });
                    }
                });
            }

            // Calculate Home Use Deductions
            if (homeData) {
                Object.values(homeData).forEach((home: any) => {
                    const hDate = new Date(home.createdAt || Date.now());
                    const hDateStr = home.createdAt ? home.createdAt.split('T')[0] : '';

                    const isToday = hDateStr === todayStr;
                    const isThisMonth = hDate.getMonth() === currentMonth && hDate.getFullYear() === currentYear;

                    const cost = Number(home.totalCost || 0);

                    if (isToday) tHome += cost;
                    if (isThisMonth) mHome += cost;
                });
            }

            setSalesSummary({
                todaySales: tSale,
                todayProfit: Math.max(0, tProfit - tHome), // Deduct Home Cost
                monthlySales: mSale,
                monthlyProfit: Math.max(0, mProfit - mHome), // Deduct Home Cost
                todayHomeCost: tHome,
                monthlyHomeCost: mHome,
            });

            const formattedChartData = [
                { day: 'Sat', sale: weeklyMap['Sat'] },
                { day: 'Sun', sale: weeklyMap['Sun'] },
                { day: 'Mon', sale: weeklyMap['Mon'] },
                { day: 'Tue', sale: weeklyMap['Tue'] },
                { day: 'Wed', sale: weeklyMap['Wed'] },
                { day: 'Thu', sale: weeklyMap['Thu'] },
                { day: 'Fri', sale: weeklyMap['Fri'] },
            ];
            setChartData(formattedChartData);

            const sorted = Object.values(productMap)
                .sort((a, b) => b.count - a.count)
                .slice(0, 5);
            setTopProducts(sorted);
        };

        const unSubSales = onValue(salesRef, (snapshot) => {
            salesData = snapshot.val();
            calculateAnalytics();
        });

        const unSubHome = onValue(homeUseRef, (snapshot) => {
            homeData = snapshot.val();
            calculateAnalytics();
        });

        return () => {
            unSubSales();
            unSubHome();
        };
    }, []);

    return (
        <div style={{ padding: '20px', maxWidth: '1000px', margin: '0 auto', fontFamily: 'system-ui, sans-serif', backgroundColor: '#f8fafc', minHeight: '100vh' }}>

            {/* Navigation Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
                <Link href="/" style={{ textDecoration: 'none', color: '#e11d48', fontWeight: 'bold', fontSize: '15px' }}>
                    ⬅️ Back to Dashboard
                </Link>
                <h2 style={{ margin: 0, color: '#1e293b', fontSize: '20px' }}>📊 Sale & Profit Analytics</h2>
                <div style={{ width: '100px' }}></div>
            </div>

            {/* Summary Stat Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '15px', marginBottom: '25px' }}>

                <div style={{ background: '#fff', padding: '18px', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                    <span style={{ fontSize: '13px', color: '#64748b', fontWeight: 'bold' }}>আজকের বিক্রি (Today Sales)</span>
                    <h2 style={{ margin: '8px 0 0 0', color: '#0284c7', fontSize: '24px' }}>৳ {salesSummary.todaySales.toLocaleString()}</h2>
                </div>

                <div style={{ background: '#fff', padding: '18px', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                    <span style={{ fontSize: '13px', color: '#64748b', fontWeight: 'bold' }}>আজকের নিট লাভ (Home Cost বাদ দিয়ে)</span>
                    <h2 style={{ margin: '8px 0 0 0', color: '#16a34a', fontSize: '24px' }}>৳ {salesSummary.todayProfit.toLocaleString()}</h2>
                    {salesSummary.todayHomeCost > 0 && (
                        <span style={{ fontSize: '11px', color: '#d97706' }}>* বাড়ির খরচ বাদ: ৳{salesSummary.todayHomeCost}</span>
                    )}
                </div>

                <div style={{ background: '#fff', padding: '18px', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                    <span style={{ fontSize: '13px', color: '#64748b', fontWeight: 'bold' }}>চলতি মাসের বিক্রি (Monthly Sale)</span>
                    <h2 style={{ margin: '8px 0 0 0', color: '#e11d48', fontSize: '24px' }}>৳ {salesSummary.monthlySales.toLocaleString()}</h2>
                </div>

                <div style={{ background: '#fff', padding: '18px', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                    <span style={{ fontSize: '13px', color: '#64748b', fontWeight: 'bold' }}>চলতি মাসের নিট লাভ (Net Profit)</span>
                    <h2 style={{ margin: '8px 0 0 0', color: '#059669', fontSize: '24px' }}>৳ {salesSummary.monthlyProfit.toLocaleString()}</h2>
                    {salesSummary.monthlyHomeCost > 0 && (
                        <span style={{ fontSize: '11px', color: '#d97706' }}>* মোট বাড়ির খরচ বাদ: ৳{salesSummary.monthlyHomeCost}</span>
                    )}
                </div>

            </div>

            {/* Main Grid: Chart & Top Selling Products */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>

                {/* Weekly Sales Graph */}
                <div style={{ background: '#fff', padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                    <h3 style={{ margin: '0 0 15px 0', color: '#1e293b', fontSize: '16px' }}>📈 সাপ্তাহিক বিক্রির চিত্র (Weekly Trend)</h3>
                    <div style={{ width: '100%', height: '240px' }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={chartData}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                <XAxis dataKey="day" />
                                <YAxis />
                                <Tooltip formatter={(value: any) => [`৳ ${value}`, 'বিক্রি']} />
                                <Bar dataKey="sale" fill="#e11d48" radius={[6, 6, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Top Selling Medicines */}
                <div style={{ background: '#fff', padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                    <h3 style={{ margin: '0 0 15px 0', color: '#1e293b', fontSize: '16px' }}>🏆 সেরা বিক্রি হওয়া ওষুধ (Top Selling Products)</h3>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        {topProducts.length > 0 ? (
                            topProducts.map((prod, idx) => (
                                <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px', background: '#f8fafc', borderRadius: '8px', border: '1px solid #f1f5f9' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                        <span style={{ fontWeight: 'bold', color: '#94a3b8', fontSize: '14px' }}>#{idx + 1}</span>
                                        <span style={{ fontWeight: '600', color: '#334155', fontSize: '14px' }}>{prod.name}</span>
                                    </div>
                                    <span style={{ backgroundColor: '#ffe4e6', color: '#e11d48', padding: '4px 10px', borderRadius: '20px', fontWeight: 'bold', fontSize: '12px' }}>
                                        {prod.count} Pcs
                                    </span>
                                </div>
                            ))
                        ) : (
                            <div style={{ color: '#94a3b8', textAlign: 'center', padding: '20px' }}>এখনো কোনো বিক্রির তথ্য পাওয়া যায়নি</div>
                        )}
                    </div>
                </div>

            </div>

        </div>
    );
}