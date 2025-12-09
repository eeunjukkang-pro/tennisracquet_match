import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import Papa from 'papaparse';
import Plot from 'react-plotly.js';
import './App.css';

// New Multi-Brand Selector Component
const MultiBrandSelector = ({ brands, selectedBrands, onBrandClick }) => {
  return (
    <div className="multi-brand-selector">
      {brands.map(brand => (
        <button
          key={brand}
          className={`brand-select-button ${selectedBrands.includes(brand) ? 'active' : ''}`}
          onClick={() => onBrandClick(brand)}
        >
          {brand}
        </button>
      ))}
    </div>
  );
};

// New Segmented Control Component
const SegmentedControl = ({ name, options, selectedValue, onChange }) => {
  return (
    <div className="segmented-control">
      {options.map(({ value, label }) => (
        <button
          key={value}
          className={`segment-button ${selectedValue === value ? 'active' : ''}`}
          onClick={() => onChange({ target: { id: name, value: value } })}
        >
          {label}
        </button>
      ))}
    </div>
  );
};

// New Power Slider Component
const PowerSlider = ({ value, onChange }) => {
  const labels = ['CONTROL', '', '', '', 'POWER'];
  return (
    <div className="power-slider-container">
      <input
        type="range"
        id="powerPref"
        min="1"
        max="5"
        step="1"
        value={value}
        onChange={onChange}
        className="power-slider-input"
      />
      <div className="power-slider-labels">
        {labels.map((label, index) => (
          <span key={index}>{label}</span>
        ))}
      </div>
    </div>
  );
};

// Custom Range Slider Component
const RangeSlider = ({ min, max, step, minValue, maxValue, onChange }) => {
  const trackRef = useRef(null);
  const minHandleRef = useRef(null);
  const maxHandleRef = useRef(null);
  const [dragging, setDragging] = useState(null);

  const valueToPercent = useCallback((value) => ((value - min) / (max - min)) * 100, [min, max]);
  const percentToValue = useCallback((percent) => Math.round((min + (percent / 100) * (max - min)) / step) * step, [min, max, step]);

  const handleMouseMove = useCallback((e) => {
    if (dragging && trackRef.current) {
      const trackRect = trackRef.current.getBoundingClientRect();
      const percent = Math.max(0, Math.min(100, ((e.clientX - trackRect.left) / trackRect.width) * 100));
      let newValue = percentToValue(percent);

      if (dragging === 'min') {
        newValue = Math.min(newValue, maxValue - step);
        onChange({ min: newValue, max: maxValue });
      } else {
        newValue = Math.max(newValue, minValue + step);
        onChange({ min: minValue, max: newValue });
      }
    }
  }, [dragging, percentToValue, minValue, maxValue, step, onChange]);

  const handleMouseUp = useCallback(() => {
    setDragging(null);
  }, []);

  useEffect(() => {
    if (dragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    } else {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [dragging, handleMouseMove, handleMouseUp]);

  const minPercent = valueToPercent(minValue);
  const maxPercent = valueToPercent(maxValue);

  return (
    <div className="range-slider-container">
      <div className="range-slider-track" ref={trackRef}>
        <div className="range-slider-range" style={{ left: `${minPercent}%`, width: `${maxPercent - minPercent}%` }} />
        <div
          className="range-slider-handle"
          ref={minHandleRef}
          style={{ left: `${minPercent}%` }}
          onMouseDown={() => setDragging('min')}
        />
        <div
          className="range-slider-handle"
          ref={maxHandleRef}
          style={{ left: `${maxPercent}%` }}
          onMouseDown={() => setDragging('max')}
        />
      </div>
    </div>
  );
};

const BRAND_COLORS = {
  "Wilson": "#CF102D", "Head": "#E0E0E0", "Babolat": "#1293E5", "Yonex": "#00BC10",
  "Tecnifibre": "#253281", "Dunlop": "#B5FB4C", "Pacific": "#EB4901", "ProKennex": "#26A1A8",
  "Volkl": "#FDF001", "Gamma": "#535353", "Genesis": "#6C21A6", "Prince": "#FF45F9", "Default": "#B0BEC5"
};

const BRAND_LOGOS = {
  "Wilson": "/logos/wilson.jpg", "Head": "/logos/head.jpg", "Babolat": "/logos/babolat.jpg",
  "Yonex": "/logos/yonex.jpg", "Tecnifibre": "/logos/tecnifibre.jpg", "Dunlop": "/logos/dunlop.jpg",
  "ProKennex": "/logos/pro.jpg", "Volkl": "/logos/volkl.jpg", "Gamma": "/logos/gamma.jpg",
  "Pacific": "/logos/pacific.jpg", "Genesis": "/logos/genesis.jpg", "Prince": "/logos/prince.jpg"
};

const RacketComparison = ({ rackets = [], onExit, chartRect, specRanges }) => {
  const [selectedCell, setSelectedCell] = useState(null);
  const [pulsingCell, setPulsingCell] = useState(null); // For animation
  const chartSectionRef = useRef(null); // To scroll to the chart

  // Scroll to chart when a cell is selected
  useEffect(() => {
    if (selectedCell && chartSectionRef.current) {
      chartSectionRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      });
    }
  }, [selectedCell]);
  
  const handleCellClick = (specKey, racketId) => {
    const isSameCell = selectedCell && selectedCell.specKey === specKey && selectedCell.racketId === racketId;

    if (isSameCell) {
      setSelectedCell(null); // Deselect if clicking the same cell
      setPulsingCell(null);
    } else {
      const newSelection = { specKey, racketId };
      setSelectedCell(newSelection);
      setPulsingCell(newSelection); // Trigger pulse effect
      setTimeout(() => setPulsingCell(null), 500); // End pulse effect
    }
  };

  if (!rackets || rackets.length === 0) return null;

  const specs = [
    { label: "Price", key: "price_num", suffix: " $" },
    { label: "Head Size", key: "head_size_in2", suffix: " sq.in" },
    { label: "Weight", key: "weight_g", suffix: " g" },
    { label: "Swingweight", key: "swing_weight", suffix: "" },
    { label: "Flex (RA)", key: "flex_ra", suffix: "" },
    { label: "Power Level", key: "power_lv_num", suffix: "" },
    { label: "Length", key: "length_in", suffix: " in" },
  ];
  
  const showRackets = rackets.slice(0, 3);

  const handleRadarClick = (e) => {
    if (e.points.length > 0) {
      const point = e.points[0];
      let pointIndex = point.pointNumber;
      
      const racketIndex = Math.floor(point.curveNumber / 2);
      const clickedRacket = showRackets[racketIndex];
      if (!clickedRacket) return;

      if (pointIndex === specs.length) pointIndex = 0;

      if (pointIndex < specs.length) {
        const key = specs[pointIndex].key;
        handleCellClick(key, clickedRacket.id);
      }
    }
  };

  const comparisonStyle = chartRect
    ? { top: `${chartRect.top}px`, left: `${chartRect.left}px`, width: `${chartRect.width}px`, height: `${chartRect.height}px` }
    : {};

  const getTextColorForBackground = (hexColor) => {
    if (!hexColor) return "#000000";
    const r = parseInt(hexColor.substr(1, 2), 16);
    const g = parseInt(hexColor.substr(3, 2), 16);
    const b = parseInt(hexColor.substr(5, 2), 16);
    const yiq = (r * 299 + g * 587 + b * 114) / 1000;
    return yiq >= 128 ? "#000000" : "#ffffff";
  };

  const headerColsClass = showRackets.length >= 3 ? "three" : "two";
  const radarIndicators = specs.map((s) => s.label);

  const radarTraces = showRackets.flatMap((r) => {
    const brandColor = BRAND_COLORS[r.brand] || BRAND_COLORS.Default;
    const valuesWithRaw = specs.map((s) => {
      const v = Number(r[s.key]);
      const range = specRanges?.[s.key];
      if (!range || Number.isNaN(v)) return { normalized: 0, raw: v, label: s.label, suffix: s.suffix || '' };
      const min = Number(range.min ?? 0);
      const max = Number(range.max ?? 1);
      const denom = max - min;
      const nv = (denom <= 0) ? 0 : (v - min) / denom;
      return { normalized: Math.max(0, Math.min(1, nv)), raw: v, label: s.label, suffix: s.suffix || '' };
    });

    const rVals = [...valuesWithRaw.map(v => v.normalized), valuesWithRaw[0].normalized];
    const theta = [...radarIndicators, radarIndicators[0]];
    const textVals = [...valuesWithRaw.map(v => `${v.label}: ${v.raw}${v.suffix}`), `${valuesWithRaw[0].label}: ${valuesWithRaw[0].raw}${valuesWithRaw[0].suffix}`];
    
    const markerSizes = new Array(rVals.length).fill(8); // Default size
    if (selectedCell && selectedCell.racketId === r.id) {
        const selectedSpecIndex = specs.findIndex(s => s.key === selectedCell.specKey);
        if (selectedSpecIndex !== -1) {
            markerSizes[selectedSpecIndex] = 16; // Selected size
            if (selectedSpecIndex === 0) markerSizes[specs.length] = 16;
        }
    }
    if (pulsingCell && pulsingCell.racketId === r.id) {
        const pulsingSpecIndex = specs.findIndex(s => s.key === pulsingCell.specKey);
        if (pulsingSpecIndex !== -1) {
            markerSizes[pulsingSpecIndex] = 24; // Pulse size
            if (pulsingSpecIndex === 0) markerSizes[specs.length] = 24;
        }
    }

    const mainTrace = { type: "scatterpolar", r: rVals, theta, fill: "none", name: `${r.brand} ${r.model_name}`, line: { color: brandColor, width: 2 }, hoverinfo: 'none', pointerevents: 'none' };
    const hoverTrace = { type: "scatterpolar", r: rVals, theta, mode: 'markers', name: `${r.brand} ${r.model_name}`, text: textVals, hovertemplate: '%{text}<extra></extra>', hoverinfo: 'text', marker: { color: brandColor, size: markerSizes }, classname: `trace-hover-${r.id}` };
    return [mainTrace, hoverTrace];
  });

  const radarLayout = {
    showlegend: false,
    margin: { t: 40, r: 10, b: 40, l: 10 },
    paper_bgcolor: "#ffffff",
    polar: { bgcolor: "#ffffff", radialaxis: { visible: true, range: [0, 1], gridcolor: "#e9ecef", tickfont: { size: 9 } }, angularaxis: { gridcolor: "#e9ecef", tickfont: { size: 10 } } },
    dragmode: false,
    hovermode: 'closest',
  };

  const colStyle = { gridTemplateColumns: `120px repeat(${showRackets.length}, 1fr)` };

  return (
    <div id="comparison-container" style={comparisonStyle}>
      <div className="comparison-header">
        <h4>RACQUET COMPARISON</h4>
        <button onClick={onExit} className="comparison-back-button close-button"></button>
      </div>

      <div className="comparison-content-split">
        <div className={`comparison-racket-headers ${headerColsClass}`}>
          {showRackets.map((r) => {
            const brandColor = BRAND_COLORS[r.brand] || BRAND_COLORS.Default;
            const textColor = getTextColorForBackground(brandColor);
            return (
              <div key={r.id} className="racket-header-item color-card" style={{ "--brand-color": brandColor, "--brand-text-color": textColor }}>
                <div className="header-logo-container">
                  {BRAND_LOGOS[r.brand] ? <img src={BRAND_LOGOS[r.brand]} alt={`${r.brand} logo`} /> : null}
                </div>
                <div className="header-brand-info">
                  <div className="header-brand-name">{r.brand}</div>
                  <div className="header-model-name">{r.model_name}</div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="chart-section" ref={chartSectionRef}>
          <Plot data={radarTraces} layout={radarLayout} config={{ displayModeBar: false, responsive: true, scrollZoom: false }} style={{ width: "100%", height: "400px" }} useResizeHandler onClick={handleRadarClick} />
        </div>

        <div className="table-section">
          <div className="specs-table-container band-cols">
            <div className="brand-fill-layer" style={colStyle} aria-hidden="true">
              <div className="label-band" />
              {showRackets.map((r) => {
                const brandColor = BRAND_COLORS[r.brand] || BRAND_COLORS.Default;
                return <div key={`fill-${r.id}`} className="brand-fill" style={{ backgroundColor: brandColor }} />;
              })}
            </div>
            <div className="specs-table-body">
              <div className="specs-table-header" style={colStyle}>
                <div className="spec-label"></div>
                {showRackets.map((r) => (
                  <div key={r.id} className="spec-value brand-model-header">
                    <b>{r.brand}</b><br/>{r.model_name}
                  </div>
                ))}
              </div>
              {specs.map((s) => (
                <div key={s.key} className="specs-table-row" style={colStyle}>
                  <div className="spec-label">{s.label}</div>
                  {showRackets.map((r) => {
                    const v = r[s.key];
                    const display = v == null || Number.isNaN(v) ? "N/A" : `${v}${s.suffix ?? ""}`;
                    const isCellSelected = selectedCell && selectedCell.specKey === s.key && selectedCell.racketId === r.id;
                    return (
                      <div key={`${r.id}-${s.key}`} className={`spec-value ${isCellSelected ? 'active-cell' : ''}`} onClick={() => handleCellClick(s.key, r.id)}>
                        {display}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};


const SelectionTooltip = ({ rackets, onClear }) => {
  if (!rackets || rackets.length === 0) return null;
  return (
    <div id="selection-tooltip">
      <div className="selection-tooltip-main-header">
        <h4>MY SELECTIONS</h4>
        <button onClick={onClear} className="tooltip-close-button"></button>
      </div>
      {rackets.map(racket => {
        const brandColor = BRAND_COLORS[racket.brand] || BRAND_COLORS.Default;
        return (
          <div key={racket.id} className="selection-tooltip-item">
            <div className="selection-tooltip-header">
              {BRAND_LOGOS[racket.brand] && (
                <div className="selection-tooltip-logo-bg" style={{ backgroundColor: brandColor }}>
                  <div className="selection-tooltip-logo-container">
                    <img src={BRAND_LOGOS[racket.brand]} alt={`${racket.brand} logo`} className="selection-tooltip-logo" />
                  </div>
                </div>
              )}
              <div className="selection-tooltip-brand-info">
                <b>{racket.brand}</b>
                <div className="selection-tooltip-body">
                  <div>{racket.model_name}</div>
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

const MatchSummaryTooltip = ({ rackets }) => {
  if (!rackets || rackets.length === 0) return null;

  return (
    <div id="match-summary-tooltip">
      <div className="match-summary-header">
        <strong>Your Matching Racquets</strong>
      </div>
      <ul className="match-summary-list">
        {rackets.map(racket => (
          <li key={racket.id}>
            <strong>{racket.brand}</strong> <span className="match-summary-model">{racket.model_name}</span>
            <div className="match-summary-specs">
              <span>SW: {racket.swing_weight}</span>
              <span>Wt: {racket.weight_g}g</span>
              <span>Flex: {racket.flex_ra}</span>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};

const App = () => {
  const [rackets, setRackets] = useState([]);
  const [prefs, setPrefs] = useState({
    level: 'all', powerPref: 3, brandFocuses: Object.keys(BRAND_COLORS).filter(b => b !== 'Default').sort(), swingStyle: 'all',
    minSwingweight: 250, maxSwingweight: 400, minWeight: 250, maxWeight: 350,
  });
  const [loading, setLoading] = useState(true);
  const [comparisonRackets, setComparisonRackets] = useState([]);
  const [selectedBrands, setSelectedBrands] = useState([]);
  const [isComparing, setIsComparing] = useState(false);
  const [chartRect, setChartRect] = useState(null);
  const chartRef = useRef(null);
  const [isHoveringMatches, setIsHoveringMatches] = useState(false);

  useEffect(() => {
    Papa.parse('/data/tennisRacquets_modeladded2.csv', {
      download: true, header: true, dynamicTyping: true,
      transformHeader: header => header.toLowerCase().replace(/\s+/g, '_'),
      complete: (results) => {
        const validData = results.data.filter(r => r.brand).map((r, index) => {
          if (r.brand === 'Pro') r.brand = 'ProKennex';
          const brandKey = Object.keys(BRAND_COLORS).find(key => r.brand && key.toLowerCase() === r.brand.toLowerCase());
          if (brandKey) r.brand = brandKey;
          if (r.price_num) {
            const priceString = String(r.price_num).replace(/[^0-9.]/g, '');
            r.price_num = priceString ? parseFloat(priceString) : null;
          }
          r.id = `${r.brand}-${r.price_num}-${index}`;
          return r;
        });
        const cleanedData = validData.filter(racket => !(racket.brand === 'Gamma' && racket.swing_weight === 412));
        setRackets(cleanedData);
        setLoading(false);
      },
      error: (err) => { console.error("CSV parsing error:", err); setLoading(false); }
    });
  }, []);

useEffect(() => {
    if (isComparing && comparisonRackets.length < 2) {
      setIsComparing(false);
    }
  }, [isComparing, comparisonRackets.length]);
  const specRanges = useMemo(() => {
    if (rackets.length === 0) return {};
    const specsToRange = ['price_num', 'head_size_in2', 'weight_g', 'swing_weight', 'flex_ra', 'power_lv_num', 'length_in'];
    const ranges = {};

    specsToRange.forEach(spec => {
        const values = rackets.map(r => r[spec]).filter(v => v != null && !isNaN(v));
        if (values.length > 0) {
            ranges[spec] = {
                min: Math.min(...values),
                max: Math.max(...values),
            };
        }
    });
    return ranges;
  }, [rackets]);

  const filteredRackets = useMemo(() => rackets.filter(r => {
    if (!r) return false;
    if (r.swing_weight < prefs.minSwingweight || r.swing_weight > prefs.maxSwingweight) return false;
    if (r.weight_g < prefs.minWeight || r.weight_g > prefs.maxWeight) return false;
    if (prefs.brandFocuses.length > 0 && !prefs.brandFocuses.includes(r.brand)) return false;
    if (prefs.powerPref >= 4 && r.power_lv_num < 3) return false;
    if (prefs.powerPref <= 2 && r.power_lv_num > 1) return false;
    if (prefs.level !== 'all') {
      if (prefs.level === 'advanced' && (r.head_size_in2 >= 102 || r.weight_g <= 290)) return false;
      if (prefs.level === 'beginner' && (r.head_size_in2 < 100 || r.weight_g > 300)) return false;
    }
    if (prefs.swingStyle === 'fast' && r.swing_sp_num !== 3) return false;
    if (prefs.swingStyle === 'moderate' && r.swing_sp_num !== 2) return false;
    if (prefs.swingStyle === 'slow' && r.swing_sp_num !== 1) return false;
    return true;
  }), [rackets, prefs]);

  useEffect(() => {
    if (selectedBrands.length > 0) {
      const visibleBrands = new Set(filteredRackets.map(r => r.brand));
      const newSelectedBrands = selectedBrands.filter(b => visibleBrands.has(b));
      if (newSelectedBrands.length !== selectedBrands.length) setSelectedBrands(newSelectedBrands);
    }
  }, [filteredRackets, selectedBrands]);

  const plotData = useMemo(() => {
    if (selectedBrands.length === 0) return filteredRackets;
    return filteredRackets.filter(r => selectedBrands.includes(r.brand));
  }, [filteredRackets, selectedBrands]);

  const top3Rackets = useMemo(() => {
    if (plotData.length === 0) return [];
    const idealSpec = {
      weight_g: (prefs.minWeight + prefs.maxWeight) / 2,
      swing_weight: (prefs.minSwingweight + prefs.maxSwingweight) / 2,
      flex_ra: 65,
    };
    const scoredRackets = plotData.map(racket => ({
      ...racket,
      matchScore: Math.abs(racket.weight_g - idealSpec.weight_g) * 0.5 + Math.abs(racket.swing_weight - idealSpec.swing_weight) * 1.0 + Math.abs(racket.flex_ra - idealSpec.flex_ra) * 0.2
    }));
    return scoredRackets.sort((a, b) => a.matchScore - b.matchScore).slice(0, 3);
  }, [plotData, prefs]);

  const handleRacketSelect = (racket) => {
    setComparisonRackets(prev => {
      const isAlreadySelected = prev.find(r => r.id === racket.id);
      if (isAlreadySelected) {
        return prev.filter(r => r.id !== racket.id);
      }
      if (prev.length < 3) {
        return [...prev, racket];
      }
      return prev;
    });
  };

  const handleCompareClick = () => {
    if (chartRef.current) {
      setChartRect(chartRef.current.getBoundingClientRect());
    }
    setIsComparing(true);
  };

  const handleExitCompare = () => setIsComparing(false);

  const handlePlotClick = (e) => {
    if (e.points.length > 0) {
      const point = e.points[0];
      const racketId = point.customdata[4];
      const racket = rackets.find(r => r.id === racketId);
      if (racket) handleRacketSelect(racket);
    }
  };

  const handlePrefChange = (e) => {
    const { id, value } = e.target;
    setPrefs(p => ({ ...p, [id]: isNaN(value) ? value : Number(value) }));
  };
  const handleSwingweightChange = ({ min, max }) => setPrefs(p => ({ ...p, minSwingweight: min, maxSwingweight: max }));
  const handleWeightChange = ({ min, max }) => setPrefs(p => ({ ...p, minWeight: min, maxWeight: max }));

  const handleBrandFocusChange = (brandName) => {
    setPrefs(p => {
      const currentFocuses = p.brandFocuses;
      const newFocuses = currentFocuses.includes(brandName)
        ? currentFocuses.filter(b => b !== brandName)
        : [...currentFocuses, brandName];
      return { ...p, brandFocuses: newFocuses };
    });
  };

  const handleBrandSelect = (brandName) => {
    setSelectedBrands(prev => 
      prev.includes(brandName) ? prev.filter(b => b !== brandName) : [...prev, brandName]
    );
  };

  const getTextColorForBackground = (hexColor) => {
    if (!hexColor) return '#000000';
    const r = parseInt(hexColor.substr(1, 2), 16);
    const g = parseInt(hexColor.substr(3, 2), 16);
    const b = parseInt(hexColor.substr(5, 2), 16);
    const yiq = ((r * 299) + (g * 587) + (b * 114)) / 1000;
    return (yiq >= 128) ? '#000000' : '#ffffff';
  };

  const brandStats = useMemo(() => {
    if (filteredRackets.length === 0) return [];
    const stats = {};
    filteredRackets.forEach(r => { stats[r.brand] = (stats[r.brand] || 0) + 1; });
    return Object.entries(stats).map(([brand, count]) => ({ brand, count })).sort((a, b) => b.count - a.count);
  }, [filteredRackets]);

  const recommendationZone = useMemo(() => ({
    type: 'rect', xref: 'x', yref: 'y',
    x0: prefs.minSwingweight, y0: prefs.minWeight,
    x1: prefs.maxSwingweight, y1: prefs.maxWeight,
    fillcolor: 'transparent', line: { width: 0, color: 'transparent' },
  }), [prefs.minSwingweight, prefs.maxSwingweight, prefs.minWeight, prefs.maxWeight]);

  const plotLayout = useMemo(() => {
    const layout = {
      xaxis: { range: [270, 380], gridcolor: '#e0e0e0', linecolor: '#cccccc', tickcolor: '#cccccc', title: { text: '' }, tickfont: { color: '#555555' } },
      yaxis: { range: [250, 350], gridcolor: '#e0e0e0', linecolor: '#cccccc', tickcolor: '#cccccc', title: { text: '' }, tickfont: { color: '#555555' } },
      showlegend: false, shapes: [recommendationZone],
      margin: { t: 20, r: 20, b: 40, l: 40 }, autosize: true,
      dragmode: 'pan', hovermode: 'closest',
      plot_bgcolor: '#ffffff', paper_bgcolor: '#ffffff',
      annotations: []
    };
    if (comparisonRackets.length === 1) {
      const selected = comparisonRackets[0];
      layout.xaxis.range = [selected.swing_weight - 15, selected.swing_weight + 15];
      layout.yaxis.range = [selected.weight_g - 15, selected.weight_g + 15];
    } else if (comparisonRackets.length > 1) {
      const swingWeights = comparisonRackets.map(r => r.swing_weight);
      const weights = comparisonRackets.map(r => r.weight_g);
      const minX = Math.min(...swingWeights), maxX = Math.max(...swingWeights);
      const minY = Math.min(...weights), maxY = Math.max(...weights);
      const xRange = maxX - minX, yRange = maxY - minY;
      const minDisplayRange = 25, padding = 10;
      if (xRange < minDisplayRange) {
        const midX = (minX + maxX) / 2;
        layout.xaxis.range = [midX - (minDisplayRange / 2) - padding, midX + (minDisplayRange / 2) + padding];
      } else {
        layout.xaxis.range = [minX - padding, maxX + padding];
      }
      if (yRange < minDisplayRange) {
        const midY = (minY + maxY) / 2;
        layout.yaxis.range = [midY - (minDisplayRange / 2) - padding, midY + (minDisplayRange / 2) + padding];
      } else {
        layout.yaxis.range = [minY - padding, maxY + padding];
      }
    }
    return layout;
  }, [recommendationZone, comparisonRackets]);

  const mainPlotData = useMemo(() => {
    const top3Ids = new Set(top3Rackets.map(r => r.id));
    const comparisonIds = new Set(comparisonRackets.map(r => r.id));
    return plotData.map(racket => {
      const isTop3 = top3Ids.has(racket.id);
      const isSelected = comparisonIds.has(racket.id);
      let size = 9, lineColor = 'white', lineWidth = 1;
      if (isTop3) { size = 16; lineColor = '#FFD700'; lineWidth = 2; }
      if (isSelected) { size = isTop3 ? 25 : 15; lineColor = '#343a40'; lineWidth = 3; }
      return { ...racket, markerSize: size, markerLineColor: lineColor, markerLineWidth: lineWidth };
    });
  }, [plotData, top3Rackets, comparisonRackets]);

  const powerPrefLabels = ['Control', 'Low Control', 'Neutral', 'Low Power', 'Power'];

  if (loading) return <div className="loading-screen">Loading Racket Data...</div>;

  return (
    <div className="page">
      <div id="controls">
        <h3>YOUR PROFILE</h3>
        <p>Adjust your preferences to define your ideal spec zone.</p>
        <label>LEVEL</label>
        <SegmentedControl name="level" selectedValue={prefs.level} onChange={handlePrefChange} options={[{ value: 'all', label: 'All' }, { value: 'beginner', label: 'Beginner' }, { value: 'intermediate', label: 'Intermediate' }, { value: 'advanced', label: 'Advanced' }]} />
        <label>SWING STYLE</label>
        <SegmentedControl name="swingStyle" selectedValue={prefs.swingStyle} onChange={handlePrefChange} options={[{ value: 'all', label: 'All' }, { value: 'slow', label: 'Slow' }, { value: 'moderate', label: 'Moderate' }, { value: 'fast', label: 'Fast' }]} />
        <label>BRAND FOCUS</label>
        <MultiBrandSelector
          brands={Object.keys(BRAND_COLORS).filter(b => b !== 'Default').sort()}
          selectedBrands={prefs.brandFocuses}
          onBrandClick={handleBrandFocusChange}
        />
        <label>SWINGWEIGHT<span className="value-label">{prefs.minSwingweight} - {prefs.maxSwingweight} g</span></label>
        <RangeSlider min={250} max={400} step={5} minValue={prefs.minSwingweight} maxValue={prefs.maxSwingweight} onChange={handleSwingweightChange} />
        <label>RACQUET WEIGHT<span className="value-label">{prefs.minWeight} - {prefs.maxWeight} g</span></label>
        <RangeSlider min={250} max={350} step={5} minValue={prefs.minWeight} maxValue={prefs.maxWeight} onChange={handleWeightChange} />
        <label>POWER PREFERENCE<span className="value-label">{powerPrefLabels[prefs.powerPref - 1]}</span></label>
        <PowerSlider value={prefs.powerPref} onChange={handlePrefChange} />
        <div id="specZoneSummary">
          <h4>YOUR SPEC ZONE</h4>
          <div id="specZoneBody">
            Your ideal zone is defined by rackets with a swingweight between <b>{prefs.minSwingweight}</b> and <b>{prefs.maxSwingweight}</b>,
            and a weight between <b>{prefs.minWeight}g</b> and <b>{prefs.maxWeight}g</b>,
            with a <b>{prefs.level}</b> skill level.
            You are focusing on <b>{prefs.brandFocuses.length > 0 ? prefs.brandFocuses.join(', ') : 'all brands'}</b>.
          </div>
        </div>
      </div>
      <div className="main">
        <div id="titleBar">
          <div><h1>EXPLORE TENNIS RACQUET</h1><span>Full dataset from various brands (n={rackets.length}).</span></div>
          <div className="match-count-container" onMouseLeave={() => setIsHoveringMatches(false)}>
            <span id="matchCountText" onMouseEnter={() => setIsHoveringMatches(true)}>
              {plotData.length} MATCHES
            </span>
            {isHoveringMatches && <MatchSummaryTooltip rackets={plotData} />}
          </div>
        </div>
        <div id="chart" ref={chartRef}>
          <div className="custom-axis-label custom-xaxis-label">SWINGWEIGHT (g)</div>
          <div className="custom-axis-label custom-yaxis-label">RACQUET WEIGHT (g)</div>
          {comparisonRackets.length > 0 && <SelectionTooltip rackets={comparisonRackets} onClear={() => setComparisonRackets([])} />}
          <Plot
            data={[
              { type: 'histogram2dcontour', x: rackets.map(r => r.swing_weight), y: rackets.map(r => r.weight_g), colorscale: [['0', 'rgba(240, 240, 240, 0)'], ['1', 'rgba(128, 128, 128, 0.2)']], showscale: false, contours: { coloring: 'heatmap' }, line: { width: 0 }, hoverinfo: 'skip' },
              { type: 'scatter', mode: 'markers', x: rackets.map(r => r.swing_weight), y: rackets.map(r => r.weight_g), marker: { color: '#e0e0e0', size: 5 }, hovertemplate: '<extra></extra>' },
              {
                type: 'scatter', mode: 'markers',
                x: mainPlotData.map(r => r.swing_weight),
                y: mainPlotData.map(r => r.weight_g),
                customdata: mainPlotData.map(r => [r.brand, r.model_name, r.flex_ra, r.head_size_in2, r.id, r.swing_weight, r.weight_g]),
                hovertemplate: '<b><b>%{customdata[0]}</b></b><br><b>%{customdata[1]}</b><br>Swingweight: %{customdata[5]}<br>Weight: %{customdata[6]}g<br>Flex: %{customdata[2]}<br>Head Size: %{customdata[3]} in²<extra></extra>',
                hoverlabel: { arrowwidth: 0 },
                marker: {
                  color: mainPlotData.map(r => BRAND_COLORS[r.brand] || BRAND_COLORS.Default),
                  size: mainPlotData.map(r => r.markerSize),
                  line: { width: mainPlotData.map(r => r.markerLineWidth), color: mainPlotData.map(r => r.markerLineColor) }
                }
              },
            ]}
            layout={plotLayout}
            config={{ scrollZoom: true }}
            style={{ width: '100%', height: '100%' }}
            useResizeHandler={true}
            onClick={handlePlotClick}
          />
        </div>
      </div>
      <div id="right-sidebar">
        <div id="topPicksSummary">
          <h4>TOP 3 PICKS FOR YOU</h4>
          <div id="topPicksBody">
            {top3Rackets.map((racket, index) => {
              const brandColor = BRAND_COLORS[racket.brand] || BRAND_COLORS.Default;
              return (
                <div key={racket.id} className={`top-pick-card ${comparisonRackets.find(cr => cr.id === racket.id) ? 'active' : ''}`} onClick={() => handleRacketSelect(racket)}>
                  <div className="top-pick-rank" style={{ backgroundColor: brandColor, color: '#ffffff' }}>{index + 1}</div>
                  <div className="top-pick-details"><b>{racket.brand}</b><small>SW: {racket.swing_weight} | Wt: {racket.weight_g}g</small></div>
                </div>
              );
            })}
          </div>
        </div>
        <div id="mySelections">
          <div className="my-selections-header">
            <h4>COMPARE DETAILS</h4>
            {comparisonRackets.length > 0 && <button className="clear-button" onClick={() => setComparisonRackets([])}>CLEAR</button>}
          </div>
          <div id="mySelectionsBody">
            {comparisonRackets.length > 0 ? (
              <div className={`selection-cards-container count-${comparisonRackets.length}`}>
                {comparisonRackets.map(racket => {
                  const brandColor = BRAND_COLORS[racket.brand] || BRAND_COLORS.Default;
                  const textColor = getTextColorForBackground(brandColor);
                  return (
                    <div key={racket.id} className="selection-card" onClick={() => handleRacketSelect(racket)} style={{ '--brand-color': brandColor, '--brand-text-color': textColor }}>
                      <div className="selection-card-logo-container" style={{ backgroundColor: brandColor }}>
                        <img src={BRAND_LOGOS[racket.brand]} alt={`${racket.brand} logo`} className="selection-card-logo" />
                      </div>
                      <div className="selection-card-details">
                        <span className="selection-card-brand">{racket.brand}</span>
                        <span className="selection-card-model">{racket.model_name}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p>Click on rackets in the plot to select for comparison.</p>
            )}
            <div className="selection-actions">
              {comparisonRackets.length > 1 && <button className="compare-button" onClick={handleCompareClick}>COMPARE</button>}
            </div>
          </div>
        </div>
        <div id="brandSummary">
          <div className="brand-summary-header">
            <h4>BRANDS IN YOUR ZONE</h4>
            <button className={`brand-clear-button ${selectedBrands.length > 0 ? '' : 'hidden'}`} onClick={() => setSelectedBrands([])}>Clear</button>
          </div>
          <div id="brandSummaryBody">
            {brandStats.length > 0 ? (
              <ul>
                {brandStats.map(({ brand, count }) => {
                  const backgroundColor = BRAND_COLORS[brand] || BRAND_COLORS.Default;
                  const textColor = getTextColorForBackground(backgroundColor);
                  return (
                    <li key={brand} className={`brand-item ${selectedBrands.includes(brand) ? 'active-brand' : ''}`} onClick={() => handleBrandSelect(brand)} style={{ backgroundColor: backgroundColor, color: textColor }}>
                      <div className="brand-info">
                        {BRAND_LOGOS[brand] ? (
                          <img src={BRAND_LOGOS[brand]} alt={`${brand} logo`} className="brand-logo" />
                        ) : (
                          <div className="brand-logo-placeholder" />
                        )}
                        <span className="brand-name-text" style={{ color: '#000000' }}>{brand}</span>
                      </div>
                      <span className="badge">{count}</span>
                    </li>
                  );
                })}
              </ul>
            ) : ( <p className="empty-state-message">Adjust filters to find matching rackets.</p> )}
          </div>
        </div>
      </div>
      {isComparing && comparisonRackets.length >= 2 && (
  <div className="comparison-overlay">
    <RacketComparison
      rackets={comparisonRackets}
      onExit={handleExitCompare}
      chartRect={chartRect}
      specRanges={specRanges}
    />
  </div>
)}


    </div>
  );
};

export default App;