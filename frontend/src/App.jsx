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
  ChevronUp
} from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_URL || '';

const SAMPLE_LISTINGS = [
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

export default function App() {
  const [listings, setListings] = useState([]);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [viewMode, setViewMode] = useState('table'); // Default to table for data-dense productivity
  const [filterText, setFilterText] = useState('');
  const [inputText, setInputText] = useState('');
  const [expandedRows, setExpandedRows] = useState({});

  const loadSamples = async () => {
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/api/sample`);
      if (res.ok) {
        const data = await res.json();
        setListings(data);
      } else {
        setListings(SAMPLE_LISTINGS);
      }
    } catch {
      setListings(SAMPLE_LISTINGS);
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
    const withBeds = results.filter((r) => typeof r.bedrooms === 'number');
    const avg = withBeds.length > 0
      ? (withBeds.reduce((acc, curr) => acc + (curr.bedrooms || 0), 0) / withBeds.length).toFixed(1)
      : 'N/A';
    const locs = new Set(results.map((r) => r.location).filter(Boolean)).size;
    return {
      total: results.length,
      avgBeds: avg,
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
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '24px 20px' }}>
      {/* Top Header */}
      <header style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'baseline',
        flexWrap: 'wrap',
        gap: '16px',
        paddingBottom: '16px',
        borderBottom: '1px solid var(--border-subtle)',
        marginBottom: '24px'
      }}>
        <div>
          <h1 style={{ fontSize: '1.25rem', fontWeight: 600, color: 'var(--text-primary)', letterSpacing: '-0.01em' }}>
            Listing Summarizer
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: '2px' }}>
            Parse unstructured real estate descriptions into structured records.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            onClick={loadSamples}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 12px',
              borderRadius: '6px',
              border: '1px solid var(--border-subtle)',
              background: 'var(--bg-surface)',
              color: 'var(--text-primary)',
              cursor: 'pointer',
              fontSize: '0.82rem'
            }}
          >
            <FileText size={14} />
            Load sample data
          </button>

          <label style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            padding: '6px 12px',
            borderRadius: '6px',
            border: '1px solid var(--border-subtle)',
            background: 'var(--bg-surface)',
            color: 'var(--text-primary)',
            cursor: 'pointer',
            fontSize: '0.82rem'
          }}>
            <Upload size={14} />
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
                padding: '6px 10px',
                borderRadius: '6px',
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
        borderRadius: '8px',
        padding: '16px',
        marginBottom: '24px'
      }}>
        <form onSubmit={addManualListing} style={{ display: 'flex', gap: '8px', marginBottom: '14px' }}>
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Paste a single listing description..."
            style={{
              flex: 1,
              padding: '8px 12px',
              background: 'var(--bg-page)',
              border: '1px solid var(--border-subtle)',
              borderRadius: '6px',
              color: 'var(--text-primary)',
              fontSize: '0.84rem',
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
              padding: '8px 14px',
              borderRadius: '6px',
              border: 'none',
              background: inputText.trim() ? 'var(--text-primary)' : 'var(--bg-subtle)',
              color: inputText.trim() ? 'var(--bg-page)' : 'var(--text-tertiary)',
              cursor: inputText.trim() ? 'pointer' : 'not-allowed',
              fontWeight: 500,
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
              <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                {listings.length} {listings.length === 1 ? 'listing' : 'listings'} queued
              </span>
              <button
                onClick={processListings}
                disabled={loading}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '7px 16px',
                  borderRadius: '6px',
                  border: 'none',
                  background: 'var(--accent)',
                  color: '#fff',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  fontWeight: 500,
                  fontSize: '0.84rem',
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
              borderRadius: '6px',
              background: 'var(--bg-page)',
              border: '1px solid var(--border-subtle)',
              padding: '6px 10px'
            }}>
              {listings.map((item) => (
                <div key={item.id} style={{
                  padding: '5px 0',
                  borderBottom: '1px solid var(--border-subtle)',
                  fontSize: '0.8rem',
                  display: 'flex',
                  gap: '8px'
                }}>
                  <span style={{ color: 'var(--text-tertiary)', minWidth: '24px' }}>#{item.id}</span>
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
            fontSize: '0.82rem'
          }}>
            No listings loaded. Click "Load sample data" or upload a CSV file.
          </div>
        )}

        {error && (
          <div style={{
            marginTop: '12px',
            padding: '10px 12px',
            borderRadius: '6px',
            background: 'rgba(239, 68, 68, 0.08)',
            border: '1px solid rgba(239, 68, 68, 0.2)',
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

      {/* Results View */}
      {results.length > 0 && (
        <section>
          {stats && (
            <div style={{
              display: 'flex',
              gap: '12px',
              marginBottom: '16px',
              flexWrap: 'wrap'
            }}>
              <div style={{
                background: 'var(--bg-surface)',
                border: '1px solid var(--border-subtle)',
                borderRadius: '6px',
                padding: '10px 16px',
                flex: '1 1 120px'
              }}>
                <div style={{ color: 'var(--text-tertiary)', fontSize: '0.75rem' }}>Listings</div>
                <div style={{ fontSize: '1.2rem', fontWeight: 600, color: 'var(--text-primary)', marginTop: '2px' }}>
                  {stats.total}
                </div>
              </div>

              <div style={{
                background: 'var(--bg-surface)',
                border: '1px solid var(--border-subtle)',
                borderRadius: '6px',
                padding: '10px 16px',
                flex: '1 1 120px'
              }}>
                <div style={{ color: 'var(--text-tertiary)', fontSize: '0.75rem' }}>Avg. bedrooms</div>
                <div style={{ fontSize: '1.2rem', fontWeight: 600, color: 'var(--text-primary)', marginTop: '2px' }}>
                  {stats.avgBeds} <span style={{ fontSize: '0.78rem', fontWeight: 400, color: 'var(--text-tertiary)' }}>BHK</span>
                </div>
              </div>

              <div style={{
                background: 'var(--bg-surface)',
                border: '1px solid var(--border-subtle)',
                borderRadius: '6px',
                padding: '10px 16px',
                flex: '1 1 120px'
              }}>
                <div style={{ color: 'var(--text-tertiary)', fontSize: '0.75rem' }}>Locations</div>
                <div style={{ fontSize: '1.2rem', fontWeight: 600, color: 'var(--text-primary)', marginTop: '2px' }}>
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
            marginBottom: '12px',
            flexWrap: 'wrap',
            gap: '10px'
          }}>
            <div style={{ display: 'flex', gap: '4px' }}>
              <button
                onClick={() => setViewMode('table')}
                style={{
                  padding: '5px 12px',
                  borderRadius: '5px',
                  border: '1px solid var(--border-subtle)',
                  background: viewMode === 'table' ? 'var(--bg-hover)' : 'transparent',
                  color: viewMode === 'table' ? 'var(--text-primary)' : 'var(--text-secondary)',
                  cursor: 'pointer',
                  fontSize: '0.8rem'
                }}
              >
                Table
              </button>
              <button
                onClick={() => setViewMode('cards')}
                style={{
                  padding: '5px 12px',
                  borderRadius: '5px',
                  border: '1px solid var(--border-subtle)',
                  background: viewMode === 'cards' ? 'var(--bg-hover)' : 'transparent',
                  color: viewMode === 'cards' ? 'var(--text-primary)' : 'var(--text-secondary)',
                  cursor: 'pointer',
                  fontSize: '0.8rem'
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
                  padding: '5px 12px',
                  borderRadius: '5px',
                  border: '1px solid var(--border-subtle)',
                  background: viewMode === 'json' ? 'var(--bg-hover)' : 'transparent',
                  color: viewMode === 'json' ? 'var(--text-primary)' : 'var(--text-secondary)',
                  cursor: 'pointer',
                  fontSize: '0.8rem'
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
                  padding: '6px 10px',
                  background: 'var(--bg-surface)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: '5px',
                  color: 'var(--text-primary)',
                  fontSize: '0.8rem',
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
                  padding: '6px 12px',
                  borderRadius: '5px',
                  border: '1px solid var(--border-subtle)',
                  background: 'var(--bg-surface)',
                  color: 'var(--text-primary)',
                  cursor: 'pointer',
                  fontSize: '0.8rem'
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
              borderRadius: '6px',
              overflowX: 'auto'
            }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.82rem' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border-subtle)', color: 'var(--text-tertiary)' }}>
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
                    <tr key={item.id} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                      <td style={{ padding: '10px 14px', color: 'var(--text-tertiary)' }}>{item.id}</td>
                      <td style={{ padding: '10px 14px', fontWeight: 500, color: 'var(--text-primary)' }}>{item.location}</td>
                      <td style={{ padding: '10px 14px', color: 'var(--text-secondary)' }}>
                        {item.bedrooms ? `${item.bedrooms} BHK` : 'Studio'}
                      </td>
                      <td style={{ padding: '10px 14px', color: 'var(--text-primary)' }}>{item.price}</td>
                      <td style={{ padding: '10px 14px' }}>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                          {item.key_features?.map((f, i) => (
                            <span key={i} style={{
                              fontSize: '0.74rem',
                              padding: '1px 6px',
                              background: 'var(--bg-subtle)',
                              borderRadius: '3px',
                              color: 'var(--text-secondary)'
                            }}>
                              {f}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td style={{ padding: '10px 14px', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
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
              gap: '12px'
            }}>
              {filteredResults.map((item) => (
                <div key={item.id} style={{
                  background: 'var(--bg-surface)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: '6px',
                  padding: '14px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between'
                }}>
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '6px' }}>
                      <span style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.88rem' }}>
                        {item.location}
                      </span>
                      <span style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.88rem' }}>
                        {item.price}
                      </span>
                    </div>

                    <div style={{ color: 'var(--text-tertiary)', fontSize: '0.78rem', marginBottom: '8px' }}>
                      {item.bedrooms ? `${item.bedrooms} BHK` : 'Studio'} · #{item.id}
                    </div>

                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.82rem', lineHeight: '1.45', marginBottom: '10px' }}>
                      {item.summary}
                    </p>

                    {item.key_features && item.key_features.length > 0 && (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginBottom: '8px' }}>
                        {item.key_features.map((feat, fIdx) => (
                          <span key={fIdx} style={{
                            fontSize: '0.72rem',
                            padding: '1px 6px',
                            background: 'var(--bg-subtle)',
                            borderRadius: '3px',
                            color: 'var(--text-secondary)'
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
                        fontSize: '0.74rem',
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
                        padding: '6px 8px',
                        background: 'var(--bg-page)',
                        borderRadius: '4px',
                        fontSize: '0.74rem',
                        color: 'var(--text-tertiary)',
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
              borderRadius: '6px',
              padding: '14px'
            }}>
              <pre style={{
                maxHeight: '400px',
                overflowY: 'auto',
                fontSize: '0.78rem',
                color: 'var(--text-secondary)',
                lineHeight: 1.4
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
