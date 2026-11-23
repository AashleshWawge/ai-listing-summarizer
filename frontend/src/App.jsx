import React, { useState, useMemo } from 'react';
import {
  Download,
  Upload,
  FileText,
  AlertCircle,
  Loader2,
  Code2,
  RotateCcw,
  Plus,
  ChevronDown,
  ChevronUp,
  MapPin,
  Home
} from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_URL || '';

const PUNE_SAMPLES = [
  {
    id: 1,
    description: "Spacious 3 BHK in Baner, near Balewadi High Street. 1650 sq ft built-up, top floor with scenic hill view, modular kitchen, 2 covered car parkings. Expected price 1.45 Cr (slightly negotiable). Amenities: club house, swimming pool, power backup. Contact immediately brokers excuse."
  },
  {
    id: 2,
    description: "URGENT SALE. Koregaon Park lane 7 prime location. Luxury 4BHK duplex penthouse with private terrace garden & servant quarter. Fully furnished Italian marble finish. Quoting 3.8 Crores all incl. 24x7 security, gym, children play area."
  },
  {
    id: 3,
    description: "Compact 1bhk flat available for rent/lease in Wakad near Hinjewadi phase 1 flyover. Monthly rent 22,000 / month + deposit 50k. Semi-furnished with geyser, wardrobes, piped gas. Ideal for IT bachelors or small family."
  },
  {
    id: 4,
    description: "Kothrud near Dahanukar colony: Old traditional 2 BHK apartment on 2nd floor, no lift, peaceful neighborhood. Carpet 820 sqft. Demanding 92 Lacs. Walkable to metro station and city pride. Clean title, loan possible."
  },
  {
    id: 5,
    description: "Cozy studio apartment / bachelor pad in Hinjewadi Phase 3 near Megapolis Circle. Furnished with bed, AC, WiFi enabled society. Price: 38 Lakhs only. High rental yield for tech park employees. Gated community with clubhouse."
  },
  {
    id: 6,
    description: "Viman Nagar brand new ready-to-move 3BHK flat in upscale tower opposite Phoenix Marketcity. Area: 1420 sqft carpet, 3 attached washrooms, large balcony. Price ₹2.10 Cr + taxes. Rooftop infinity pool, EV charging bay."
  },
  {
    id: 7,
    description: "Kharadi EON IT park walkable distance: 2.5 BHK (2 bedroom + study room) in Gera World of Joy. 1050 sqft. East facing, vastu compliant. Price 1.15 Cr negotiable. Smart home automation, child centric amenities."
  },
  {
    id: 8,
    description: "Kalyani Nagar riverfront view 4 BHK super luxury apartment. 3200 sqft, private lift lobby, VRV air conditioning, servant room with separate entrance. Price on request. High profile gated enclave."
  }
];

const MUMBAI_SAMPLES = [
  {
    id: 1,
    description: "Bandra West Pali Hill luxury 3BHK flat on mid floor, sea view from master bedroom. Carpet 1380 sq ft, 2 stilt parking, oc received. Quoting 8.25 Cr negotiable. Verified clean title. Serious buyers only no heavy negotiation."
  },
  {
    id: 2,
    description: "Andheri East near Chakala metro: compact 1 RK / studio flat for bachelor or working couple. 340 sqft carpet, semi-furnished with ac, geyser and modular kitchen. Asking rent 28k/month + 80k deposit. Available from 1st of next month."
  },
  {
    id: 3,
    description: "Powai Hiranandani Gardens 2.5 BHK in heritage tower. 1150 sqft carpet, fully furnished luxury interiors, Lake view, modular fittings, 1 covered parking. Demanding 3.10 Crores all inclusive. Amenities include clubhouse, tennis court."
  },
  {
    id: 4,
    description: "Worli seaface facing ultra luxury 4 BHK sea view apartment. 2800 sq ft carpet, wrap around sundeck, Italian marble flooring, 3 car parkings. Price on request for qualified HNIs. 24x7 concierge and valet service."
  },
  {
    id: 5,
    description: "Dadar West near Shivaji Park: 2 BHK old building flat, 3rd floor without lift, high ceiling, cross ventilation. Carpet 740 sqft. 1.85 Cr final. Reputed society, walkable to western & central railway stations."
  },
  {
    id: 6,
    description: "Thane West Ghodbunder Road: 2 BHK flat in Hiranandani Estate. 720 sq ft carpet. Ready to move, garden facing, piped gas, clubhouse access. Price: 95 Lakhs slightly negotiable. Bank loan approved from all major banks."
  },
  {
    id: 7,
    description: "Juhu Gulmohar Road: 3 BHK penthouse with private 600 sqft open terrace, 1600 sqft carpet inside. Fully vastu compliant, north-east facing. Expected 6.50 Cr. Very close to Juhu beach and international schools."
  },
  {
    id: 8,
    description: "Malad West near Inorbit Mall: Brand new 1 BHK high rise apartment on 28th floor, unobstructed city view. 465 sqft carpet. Expected price 78 Lakhs + registration. Possession in 2 months with OC."
  }
];

function parsePriceToLakhs(priceStr) {
  if (!priceStr || typeof priceStr !== 'string') return null;
  const clean = priceStr.toLowerCase().replace(/,/g, '').trim();

  if (clean.includes('/ month') || clean.includes('/month') || clean.includes('month') || clean.includes('request') || clean.includes('n/a')) {
    return null;
  }

  const crMatch = clean.match(/([\d.]+)\s*(?:cr|crore|crores)/);
  if (crMatch) {
    const val = parseFloat(crMatch[1]);
    if (!isNaN(val)) return val * 100;
  }

  const lakhMatch = clean.match(/([\d.]+)\s*(?:lakh|lakhs|lac|lacs)/);
  if (lakhMatch) {
    const val = parseFloat(lakhMatch[1]);
    if (!isNaN(val)) return val;
  }

  const numMatch = clean.match(/(?:₹|rs\.?)?\s*([\d.]+)/);
  if (numMatch) {
    const val = parseFloat(numMatch[1]);
    if (!isNaN(val) && val >= 100000) {
      return val / 100000;
    }
  }

  return null;
}

export default function App() {
  const [listings, setListings] = useState([]);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [viewMode, setViewMode] = useState('table');
  const [filterText, setFilterText] = useState('');
  const [inputText, setInputText] = useState('');
  const [expandedRows, setExpandedRows] = useState({});

  const loadSamples = async (city = 'pune') => {
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/api/sample?city=${city}`);
      if (res.ok) {
        const data = await res.json();
        setListings(data);
      } else {
        setListings(city === 'mumbai' ? MUMBAI_SAMPLES : PUNE_SAMPLES);
      }
    } catch {
      setListings(city === 'mumbai' ? MUMBAI_SAMPLES : PUNE_SAMPLES);
    }
  };

  const addManualListing = (e) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    const nextId = listings.length > 0 ? Math.max(...listings.map((l) => l.id)) + 1 : 1;
    setListings([...listings, { id: nextId, description: inputText.trim() }]);
    setInputText('');
  };

  const handleFileUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setError(null);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch(`${API_BASE}/api/upload-csv`, {
        method: 'POST',
        body: formData,
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({ detail: 'Failed to upload CSV' }));
        throw new Error(errData.detail || 'Upload failed');
      }
      const data = await res.json();
      setListings(data);
    } catch {
      const reader = new FileReader();
      reader.onload = (e) => {
        const text = e.target?.result;
        if (typeof text === 'string') {
          const lines = text.split('\n').map((l) => l.trim()).filter(Boolean);
          const parsed = lines.slice(1).map((line, idx) => ({
            id: idx + 1,
            description: line.replace(/^"|"$/g, ''),
          }));
          setListings(parsed);
        }
      };
      reader.readAsText(file);
    }
  };

  const processListings = async () => {
    if (listings.length === 0) return;
    setLoading(true);
    setError(null);
    setResults([]);

    try {
      const res = await fetch(`${API_BASE}/api/summarize`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(listings),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({ detail: 'Processing request failed' }));
        throw new Error(errData.detail || 'Request failed');
      }

      const data = await res.json();
      setResults(data);
    } catch (err) {
      setError(err.message || 'Unable to connect to parser service.');
    } finally {
      setLoading(false);
    }
  };

  const downloadJson = () => {
    if (results.length === 0) return;
    const jsonStr = JSON.stringify(results, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `listings_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const clearQueue = () => {
    setListings([]);
    setResults([]);
    setError(null);
    setFilterText('');
  };

  const toggleRow = (id) => {
    setExpandedRows((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const stats = useMemo(() => {
    if (results.length === 0) return null;
    const pricesInLakhs = results
      .map((r) => parsePriceToLakhs(r.price))
      .filter((v) => typeof v === 'number');

    let formattedPrice = 'N/A';
    if (pricesInLakhs.length > 0) {
      const avgLakhs = pricesInLakhs.reduce((a, b) => a + b, 0) / pricesInLakhs.length;
      if (avgLakhs >= 100) {
        formattedPrice = `₹${(avgLakhs / 100).toFixed(2)} Cr`;
      } else {
        formattedPrice = `₹${avgLakhs.toFixed(1)} L`;
      }
    }

    const locs = new Set(results.map((r) => r.location).filter(Boolean)).size;
    return {
      total: results.length,
      avgPrice: formattedPrice,
      locations: locs,
    };
  }, [results]);

  const filteredResults = useMemo(() => {
    if (!filterText.trim()) return results;
    const q = filterText.toLowerCase();
    return results.filter(
      (r) =>
        r.location?.toLowerCase().includes(q) ||
        r.summary?.toLowerCase().includes(q) ||
        r.price?.toLowerCase().includes(q) ||
        (r.bedrooms && `${r.bedrooms} bhk`.includes(q))
    );
  }, [results, filterText]);

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '32px 20px' }}>
      {/* Top Header with Nextburb Brand Colors */}
      <header style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '16px',
        paddingBottom: '20px',
        borderBottom: '1px solid var(--border-subtle)',
        marginBottom: '28px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          {/* Nextburb signature coral house icon */}
          <div style={{
            background: 'var(--accent)',
            width: '42px',
            height: '42px',
            borderRadius: '10px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            boxShadow: '0 2px 8px rgba(255, 75, 110, 0.25)'
          }}>
            <Home size={22} strokeWidth={2.4} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
              <span style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--navy)', letterSpacing: '-0.02em' }}>
                nextburb
              </span>
              <span style={{ fontSize: '1.15rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                Listing Summarizer
              </span>
            </div>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.84rem', marginTop: '2px' }}>
              Extract structured property data from messy real estate descriptions into JSON.
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <button
            onClick={() => loadSamples('pune')}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '7px 13px',
              borderRadius: '7px',
              border: '1px solid var(--border-subtle)',
              background: 'var(--bg-surface)',
              color: 'var(--navy)',
              cursor: 'pointer',
              fontWeight: 500,
              fontSize: '0.82rem',
              transition: 'all 0.15s ease'
            }}
          >
            <FileText size={14} color="var(--accent)" />
            Pune sample
          </button>

          <button
            onClick={() => loadSamples('mumbai')}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '7px 13px',
              borderRadius: '7px',
              border: '1px solid var(--border-subtle)',
              background: 'var(--bg-surface)',
              color: 'var(--navy)',
              cursor: 'pointer',
              fontWeight: 500,
              fontSize: '0.82rem',
              transition: 'all 0.15s ease'
            }}
          >
            <FileText size={14} color="var(--accent)" />
            Mumbai sample
          </button>

          <label style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            padding: '7px 13px',
            borderRadius: '7px',
            border: '1px solid var(--border-subtle)',
            background: 'var(--bg-surface)',
            color: 'var(--navy)',
            cursor: 'pointer',
            fontWeight: 500,
            fontSize: '0.82rem'
          }}>
            <Upload size={14} color="var(--text-secondary)" />
            Upload CSV
            <input
              type="file"
              accept=".csv"
              onChange={handleFileUpload}
              style={{ display: 'none' }}
            />
          </label>

          {(listings.length > 0 || results.length > 0) && (
            <button
              onClick={clearQueue}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                padding: '7px 11px',
                borderRadius: '7px',
                border: '1px solid var(--border-subtle)',
                background: 'transparent',
                color: 'var(--text-secondary)',
                cursor: 'pointer',
                fontSize: '0.82rem'
              }}
            >
              <RotateCcw size={13} />
              Reset
            </button>
          )}
        </div>
      </header>

      {/* Input Form & Queue */}
      <section style={{
        background: 'var(--bg-surface)',
        border: '1px solid var(--border-subtle)',
        borderRadius: '10px',
        padding: '18px 20px',
        marginBottom: '24px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.03)'
      }}>
        <form onSubmit={addManualListing} style={{ display: 'flex', gap: '8px', marginBottom: '14px' }}>
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Paste a single listing description (e.g. '3 BHK in Baner for 1.45 Cr with terrace')..."
            style={{
              flex: 1,
              padding: '9px 13px',
              background: 'var(--bg-page)',
              border: '1px solid var(--border-subtle)',
              borderRadius: '7px',
              color: 'var(--text-primary)',
              fontSize: '0.85rem',
              outline: 'none'
            }}
          />
          <button
            type="submit"
            disabled={!inputText.trim()}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              padding: '9px 16px',
              borderRadius: '7px',
              border: 'none',
              background: inputText.trim() ? 'var(--navy)' : 'var(--bg-subtle)',
              color: inputText.trim() ? '#fff' : 'var(--text-tertiary)',
              cursor: inputText.trim() ? 'pointer' : 'not-allowed',
              fontWeight: 600,
              fontSize: '0.82rem'
            }}
          >
            <Plus size={14} />
            Add
          </button>
        </form>

        {listings.length > 0 ? (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
              <span style={{ fontSize: '0.83rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                {listings.length} {listings.length === 1 ? 'listing' : 'listings'} queued
              </span>
              <button
                onClick={processListings}
                disabled={loading}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '8px 18px',
                  borderRadius: '7px',
                  border: 'none',
                  background: 'var(--accent)',
                  color: '#fff',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  fontWeight: 600,
                  fontSize: '0.85rem',
                  boxShadow: '0 2px 6px rgba(255, 75, 110, 0.25)',
                  opacity: loading ? 0.75 : 1
                }}
              >
                {loading ? (
                  <>
                    <Loader2 size={14} className="animate-spin" />
                    Parsing listings...
                  </>
                ) : (
                  `Parse ${listings.length} listings`
                )}
              </button>
            </div>

            <div style={{
              maxHeight: '140px',
              overflowY: 'auto',
              borderRadius: '7px',
              background: 'var(--bg-page)',
              border: '1px solid var(--border-subtle)',
              padding: '6px 12px'
            }}>
              {listings.map((item) => (
                <div key={item.id} style={{
                  padding: '6px 0',
                  borderBottom: '1px solid var(--border-subtle)',
                  fontSize: '0.82rem',
                  display: 'flex',
                  gap: '10px'
                }}>
                  <span style={{ color: 'var(--accent)', fontWeight: 600, minWidth: '24px' }}>#{item.id}</span>
                  <span style={{ color: 'var(--text-secondary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {item.description}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div style={{
            textAlign: 'center',
            padding: '24px 12px',
            color: 'var(--text-tertiary)',
            fontSize: '0.83rem'
          }}>
            No listings loaded. Click "Pune sample", "Mumbai sample", or upload a CSV file.
          </div>
        )}

        {error && (
          <div style={{
            marginTop: '12px',
            padding: '10px 14px',
            borderRadius: '7px',
            background: 'var(--danger-bg)',
            border: '1px solid #fecdd3',
            color: 'var(--danger-text)',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '0.82rem'
          }}>
            <AlertCircle size={15} />
            <span>{error}</span>
          </div>
        )}
      </section>

      {/* Loading Skeleton Animation View during AI Processing */}
      {loading && (
        <section style={{
          background: 'var(--bg-surface)',
          border: '1px solid var(--border-subtle)',
          borderRadius: '10px',
          padding: '20px',
          marginBottom: '24px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.03)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', fontWeight: 600, color: 'var(--navy)' }}>
              <Loader2 size={16} className="animate-spin" color="var(--accent)" />
              <span>Extracting attributes for {listings.length} listings...</span>
            </div>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-tertiary)' }}>
              Validating JSON schema
            </span>
          </div>

          <div style={{
            width: '100%',
            height: '3px',
            background: 'var(--bg-subtle)',
            borderRadius: '2px',
            overflow: 'hidden',
            marginBottom: '20px'
          }}>
            <div style={{
              height: '100%',
              background: 'var(--accent)',
              animation: 'progressPulse 1.8s ease-in-out infinite'
            }} />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {Array.from({ length: Math.min(listings.length || 5, 5) }).map((_, idx) => (
              <div key={idx} style={{
                display: 'grid',
                gridTemplateColumns: '40px 130px 80px 110px 200px 1fr',
                gap: '12px',
                padding: '10px 12px',
                background: 'var(--bg-page)',
                border: '1px solid var(--border-subtle)',
                borderRadius: '6px',
                alignItems: 'center'
              }}>
                <div className="skeleton" style={{ height: '14px', width: '20px' }} />
                <div className="skeleton" style={{ height: '14px', width: '90px' }} />
                <div className="skeleton" style={{ height: '14px', width: '50px' }} />
                <div className="skeleton" style={{ height: '14px', width: '75px' }} />
                <div style={{ display: 'flex', gap: '4px' }}>
                  <div className="skeleton" style={{ height: '14px', width: '55px' }} />
                  <div className="skeleton" style={{ height: '14px', width: '65px' }} />
                </div>
                <div className="skeleton" style={{ height: '14px', width: '85%' }} />
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Results View */}
      {!loading && results.length > 0 && (
        <section>
          {stats && (
            <div style={{
              display: 'flex',
              gap: '14px',
              marginBottom: '18px',
              flexWrap: 'wrap'
            }}>
              <div style={{
                background: 'var(--bg-surface)',
                border: '1px solid var(--border-subtle)',
                borderRadius: '8px',
                padding: '12px 18px',
                flex: '1 1 120px',
                boxShadow: '0 1px 3px rgba(0,0,0,0.02)'
              }}>
                <div style={{ color: 'var(--text-tertiary)', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase' }}>Listings</div>
                <div style={{ fontSize: '1.3rem', fontWeight: 700, color: 'var(--navy)', marginTop: '2px' }}>
                  {stats.total}
                </div>
              </div>

              <div style={{
                background: 'var(--bg-surface)',
                border: '1px solid var(--border-subtle)',
                borderRadius: '8px',
                padding: '12px 18px',
                flex: '1 1 120px',
                boxShadow: '0 1px 3px rgba(0,0,0,0.02)'
              }}>
                <div style={{ color: 'var(--text-tertiary)', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase' }}>Avg. price</div>
                <div style={{ fontSize: '1.3rem', fontWeight: 700, color: 'var(--accent)', marginTop: '2px' }}>
                  {stats.avgPrice}
                </div>
              </div>

              <div style={{
                background: 'var(--bg-surface)',
                border: '1px solid var(--border-subtle)',
                borderRadius: '8px',
                padding: '12px 18px',
                flex: '1 1 120px',
                boxShadow: '0 1px 3px rgba(0,0,0,0.02)'
              }}>
                <div style={{ color: 'var(--text-tertiary)', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase' }}>Locations</div>
                <div style={{ fontSize: '1.3rem', fontWeight: 700, color: 'var(--navy)', marginTop: '2px' }}>
                  {stats.locations}
                </div>
              </div>
            </div>
          )}

          {/* Results Toolbar */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '14px',
            flexWrap: 'wrap',
            gap: '10px'
          }}>
            <div style={{ display: 'flex', gap: '4px' }}>
              <button
                onClick={() => setViewMode('table')}
                style={{
                  padding: '6px 14px',
                  borderRadius: '6px',
                  border: '1px solid var(--border-subtle)',
                  background: viewMode === 'table' ? 'var(--navy)' : 'var(--bg-surface)',
                  color: viewMode === 'table' ? '#fff' : 'var(--text-secondary)',
                  cursor: 'pointer',
                  fontWeight: 500,
                  fontSize: '0.82rem'
                }}
              >
                Table
              </button>
              <button
                onClick={() => setViewMode('cards')}
                style={{
                  padding: '6px 14px',
                  borderRadius: '6px',
                  border: '1px solid var(--border-subtle)',
                  background: viewMode === 'cards' ? 'var(--navy)' : 'var(--bg-surface)',
                  color: viewMode === 'cards' ? '#fff' : 'var(--text-secondary)',
                  cursor: 'pointer',
                  fontWeight: 500,
                  fontSize: '0.82rem'
                }}
              >
                Cards
              </button>
              <button
                onClick={() => setViewMode('json')}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  padding: '6px 14px',
                  borderRadius: '6px',
                  border: '1px solid var(--border-subtle)',
                  background: viewMode === 'json' ? 'var(--navy)' : 'var(--bg-surface)',
                  color: viewMode === 'json' ? '#fff' : 'var(--text-secondary)',
                  cursor: 'pointer',
                  fontWeight: 500,
                  fontSize: '0.82rem'
                }}
              >
                <Code2 size={13} />
                JSON
              </button>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <input
                type="text"
                placeholder="Filter results..."
                value={filterText}
                onChange={(e) => setFilterText(e.target.value)}
                style={{
                  padding: '6px 12px',
                  background: 'var(--bg-surface)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: '6px',
                  color: 'var(--text-primary)',
                  fontSize: '0.82rem',
                  outline: 'none',
                  width: '180px'
                }}
              />

              <button
                onClick={downloadJson}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '5px',
                  padding: '6px 13px',
                  borderRadius: '6px',
                  border: 'none',
                  background: 'var(--navy)',
                  color: '#fff',
                  cursor: 'pointer',
                  fontWeight: 500,
                  fontSize: '0.82rem'
                }}
              >
                <Download size={13} />
                Download JSON
              </button>
            </div>
          </div>

          {/* Table View */}
          {viewMode === 'table' && (
            <div style={{
              background: 'var(--bg-surface)',
              border: '1px solid var(--border-subtle)',
              borderRadius: '8px',
              overflowX: 'auto',
              boxShadow: '0 1px 3px rgba(0,0,0,0.03)'
            }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.83rem' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border-subtle)', color: 'var(--text-tertiary)', background: 'var(--bg-page)' }}>
                    <th style={{ padding: '10px 14px', width: '40px' }}>#</th>
                    <th style={{ padding: '10px 14px', width: '130px' }}>Location</th>
                    <th style={{ padding: '10px 14px', width: '90px' }}>Beds</th>
                    <th style={{ padding: '10px 14px', width: '120px' }}>Price</th>
                    <th style={{ padding: '10px 14px', width: '240px' }}>Features</th>
                    <th style={{ padding: '10px 14px' }}>Summary</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredResults.map((item) => (
                    <tr key={item.id} style={{ borderBottom: '1px solid var(--border-subtle)', transition: 'background 0.15s ease' }}>
                      <td style={{ padding: '10px 14px', color: 'var(--text-tertiary)', fontWeight: 500 }}>{item.id}</td>
                      <td style={{ padding: '10px 14px', fontWeight: 600, color: 'var(--navy)' }}>{item.location}</td>
                      <td style={{ padding: '10px 14px', color: 'var(--text-secondary)' }}>
                        {item.bedrooms ? `${item.bedrooms} BHK` : 'Studio'}
                      </td>
                      <td style={{ padding: '10px 14px', fontWeight: 600, color: 'var(--accent)' }}>{item.price}</td>
                      <td style={{ padding: '10px 14px' }}>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                          {item.key_features?.map((f, i) => (
                            <span key={i} style={{
                              fontSize: '0.73rem',
                              padding: '2px 7px',
                              background: 'var(--accent-soft)',
                              border: '1px solid var(--accent-soft-border)',
                              borderRadius: '4px',
                              color: 'var(--accent)',
                              fontWeight: 500
                            }}>
                              {f}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td style={{ padding: '10px 14px', color: 'var(--text-secondary)', lineHeight: 1.45 }}>
                        {item.summary}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Cards View */}
          {viewMode === 'cards' && (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
              gap: '14px'
            }}>
              {filteredResults.map((item) => (
                <div key={item.id} style={{
                  background: 'var(--bg-surface)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: '8px',
                  padding: '16px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.03)'
                }}>
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '6px' }}>
                      <span style={{ fontWeight: 700, color: 'var(--navy)', fontSize: '0.92rem' }}>
                        {item.location}
                      </span>
                      <span style={{ fontWeight: 700, color: 'var(--accent)', fontSize: '0.92rem' }}>
                        {item.price}
                      </span>
                    </div>

                    <div style={{ color: 'var(--text-tertiary)', fontSize: '0.78rem', marginBottom: '8px', fontWeight: 500 }}>
                      {item.bedrooms ? `${item.bedrooms} BHK` : 'Studio'} · #{item.id}
                    </div>

                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.83rem', lineHeight: '1.45', marginBottom: '12px' }}>
                      {item.summary}
                    </p>

                    {item.key_features && item.key_features.length > 0 && (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginBottom: '8px' }}>
                        {item.key_features.map((feat, fIdx) => (
                          <span key={fIdx} style={{
                            fontSize: '0.73rem',
                            padding: '2px 7px',
                            background: 'var(--accent-soft)',
                            border: '1px solid var(--accent-soft-border)',
                            borderRadius: '4px',
                            color: 'var(--accent)',
                            fontWeight: 500
                          }}>
                            {feat}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '8px', marginTop: '6px' }}>
                    <button
                      onClick={() => toggleRow(item.id)}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: 'var(--text-tertiary)',
                        cursor: 'pointer',
                        fontSize: '0.75rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '3px',
                        padding: 0
                      }}
                    >
                      {expandedRows[item.id] ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                      {expandedRows[item.id] ? 'Hide raw description' : 'Show raw description'}
                    </button>
                    {expandedRows[item.id] && (
                      <div style={{
                        marginTop: '6px',
                        padding: '8px 10px',
                        background: 'var(--bg-page)',
                        borderRadius: '5px',
                        fontSize: '0.75rem',
                        color: 'var(--text-secondary)',
                        lineHeight: 1.4
                      }}>
                        {item.raw_description}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* JSON View */}
          {viewMode === 'json' && (
            <div style={{
              background: 'var(--bg-surface)',
              border: '1px solid var(--border-subtle)',
              borderRadius: '8px',
              padding: '16px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.03)'
            }}>
              <pre style={{
                maxHeight: '400px',
                overflowY: 'auto',
                fontSize: '0.8rem',
                color: 'var(--navy)',
                lineHeight: 1.45
              }}>
                {JSON.stringify(results, null, 2)}
              </pre>
            </div>
          )}
        </section>
      )}
    </div>
  );
}
