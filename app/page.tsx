'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import DualSearch from '../components/DualSearch';
import { db } from './firebase';
import { ref, get, set } from 'firebase/database';

export default function Dashboard() {
  const [mounted, setMounted] = useState(false);
  const router = useRouter();

  useEffect(() => {
    setMounted(true);
    const authData = localStorage.getItem('userAuth');
    if (!authData) {
      router.push('/login');
    }
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem('userAuth');
    localStorage.removeItem('userRole');
    router.push('/login');
  };

  const handleBackup = async () => {
    try {
      const dbRef = ref(db);
      const snapshot = await get(dbRef);
      if (snapshot.exists()) {
        const data = snapshot.val();
        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(data, null, 2));
        const downloadAnchor = document.createElement('a');
        downloadAnchor.setAttribute("href", dataStr);
        downloadAnchor.setAttribute("download", `sardar_medical_backup_${new Date().toISOString().split('T')[0]}.json`);
        document.body.appendChild(downloadAnchor);
        downloadAnchor.click();
        downloadAnchor.remove();
        alert('✅ Backup downloaded successfully!');
      } else {
        alert('No data found in database!');
      }
    } catch (err) {
      console.error(err);
      alert('Error downloading backup!');
    }
  };

  const handleRestore = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileReader = new FileReader();
    if (e.target.files && e.target.files[0]) {
      fileReader.readAsText(e.target.files[0], "UTF-8");
      fileReader.onload = async (event) => {
        try {
          const parsedData = JSON.parse(event.target?.result as string);
          if (confirm('⚠️ Warning! Restoring will overwrite existing data. Are you sure?')) {
            await set(ref(db), parsedData);
            alert('✅ Backup restored successfully!');
            window.location.reload();
          }
        } catch (error) {
          console.error(error);
          alert('Please upload a valid JSON backup file!');
        }
      };
    }
  };

  const menuItems = [
    { title: 'POS / Sale', icon: '🛒', href: '/pos' },
    { title: 'Generics', icon: '⏳', href: '/generics' },
    { title: 'Customer', icon: '👥', href: '/customer' },
    { title: 'Suppliers Ledger', icon: '🏭', href: '/suppliers' },
    { title: 'Product List', icon: '📋', href: '/products' },
    { title: 'Purchase', icon: '🛍️', href: '/purchase' },
    { title: 'Purchase Record', icon: '📄', href: '/purchase-record' },
    { title: 'Returns & Refund', icon: '🔄', href: '/returns' },
    { title: 'Barcode Generator', icon: '🏷️', href: '/barcode' },
    { title: 'Sale & Profit', icon: '📈', href: '/analytics' },
    { title: 'Short Items', icon: '📦', href: '/short-items', badge: '0' },
    { title: 'Expired', icon: '📅', href: '/expired', badge: '0' },
    { title: 'Home Use', icon: '🏠', href: '/home-use' },
    { title: 'AI Invoice Scan', icon: '🪄', href: '/ai-scan' },
    { title: 'AI Prescription Reader', icon: '🩺', href: '/ai-prescription', featured: true },
    { title: 'Shop Settings', icon: '⚙️', href: '/settings' },
    { title: 'Staff & Users', icon: '👥', href: '/users' },
  ];

  if (!mounted) return null;

  return (
    <div style={{ backgroundColor: '#f8f9fa', minHeight: '100vh', fontFamily: 'system-ui, -apple-system, sans-serif', padding: '20px 40px', paddingBottom: '60px' }}>

      {/* Top Bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', maxWidth: '1000px', margin: '0 auto 20px auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            backgroundColor: '#ef4444',
            color: '#ffffff',
            width: '42px',
            height: '42px',
            borderRadius: '10px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '22px',
            fontWeight: 'bold'
          }}>
            ➕
          </div>
          <div>
            <h2 style={{ margin: 0, color: '#ef4444', fontSize: '20px', fontWeight: 'bold' }}>
              Sarder Medical Hall
            </h2>
            <span style={{ color: '#6b7280', fontSize: '12px' }}>
              Smart AI Pharmacy Management | Gopalpur Bazar, Manda
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ backgroundColor: '#fef2f2', color: '#ef4444', border: '1px solid #fecdd3', padding: '6px 12px', borderRadius: '20px', fontWeight: 'bold', fontSize: '12px' }}>
            👑 Admin Mode
          </span>
          <button
            onClick={handleLogout}
            style={{ backgroundColor: '#f1f5f9', border: '1px solid #cbd5e1', color: '#475569', padding: '6px 12px', borderRadius: '6px', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer' }}
          >
            🔒 Logout
          </button>
        </div>
      </div>

      {/* Dual Search */}
      <div style={{ maxWidth: '1000px', margin: '0 auto 25px auto' }}>
        <DualSearch />
      </div>

      {/* Grid Layout */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: '20px',
        maxWidth: '1000px',
        margin: '0 auto 25px auto'
      }}>
        {menuItems.map((item, idx) => (
          <Link key={idx} href={item.href} style={{ textDecoration: 'none' }}>
            <div
              style={{
                backgroundColor: item.featured ? '#ef4444' : '#ffffff',
                color: item.featured ? '#ffffff' : '#374151',
                padding: '25px 15px',
                borderRadius: '16px',
                border: item.featured ? 'none' : '1px solid #f3f4f6',
                boxShadow: '0 2px 6px rgba(0,0,0,0.03)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                position: 'relative',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                height: '110px',
                boxSizing: 'border-box'
              }}
            >
              {item.badge && item.badge !== '0' && (
                <span
                  style={{
                    position: 'absolute',
                    top: '12px',
                    right: '12px',
                    backgroundColor: '#ef4444',
                    color: '#fff',
                    borderRadius: '50%',
                    width: '22px',
                    height: '22px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '11px',
                    fontWeight: 'bold',
                  }}
                >
                  {item.badge}
                </span>
              )}

              <span style={{ fontSize: '28px', marginBottom: '8px' }}>
                {item.icon}
              </span>

              <span style={{ fontWeight: '600', fontSize: '13px', color: item.featured ? '#ffffff' : '#1f2937' }}>
                {item.title}
              </span>
            </div>
          </Link>
        ))}
      </div>

      {/* Backup & Restore Section */}
      <div style={{
        backgroundColor: '#ffffff',
        borderRadius: '16px',
        padding: '20px',
        maxWidth: '1000px',
        margin: '0 auto',
        textAlign: 'center',
        border: '1px solid #f3f4f6',
        boxShadow: '0 2px 6px rgba(0,0,0,0.03)'
      }}>
        <h4 style={{ margin: '0 0 15px 0', color: '#1f2937', fontSize: '15px', fontWeight: 'bold' }}>
          🗄️ Data Backup & Restore
        </h4>
        <div style={{ display: 'flex', justifyContent: 'center', gap: '15px' }}>
          <button
            onClick={handleBackup}
            style={{
              backgroundColor: '#0284c7',
              color: '#ffffff',
              border: 'none',
              padding: '10px 20px',
              borderRadius: '8px',
              fontWeight: 'bold',
              fontSize: '13px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            📥 Download Backup
          </button>

          <label style={{
            backgroundColor: '#16a34a',
            color: '#ffffff',
            border: 'none',
            padding: '10px 20px',
            borderRadius: '8px',
            fontWeight: 'bold',
            fontSize: '13px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}>
            📤 Restore Data
            <input
              type="file"
              accept=".json"
              onChange={handleRestore}
              style={{ display: 'none' }}
            />
          </label>
        </div>
      </div>

    </div>
  );
}
