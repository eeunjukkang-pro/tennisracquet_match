import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import Papa from 'papaparse';
import Plot from 'react-plotly.js';
import './App.css';

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
  const labels = ['Control', 'Control', 'Neutral', 'Power', 'Power'];
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
    }
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
  "Tecnifibre": "#253281", "Dunlop": "#B5FB4C", "Pacific": "#EB4901", "Pro": "#26A1A8",
  "Volkl": "#FDF001", "Gamma": "#535353", "Genesis": "#6C21A6", "Prince": "#FF45F9", "Default": "#B0BEC5"
};

const BRAND_LOGOS = {
  "Wilson": "/logos/wilson.jpg", "Head": "/logos/head.jpg", "Babolat": "/logos/babolat.jpg",
  "Yonex": "/logos/yonex.jpg", "Tecnifibre": "/logos/tecnifibre.jpg", "Dunlop": "/logos/dunlop.jpg",
  "Pro": "/logos/pro.jpg", "Volkl": "/logos/volkl.jpg", "Gamma": "/logos/gamma.jpg",
  "Pacific": "/logos/pacific.jpg", "Genesis": "/logos/genesis.jpg", "Prince": "/logos/prince.jpg"
};

const RacketComparison = ({ rackets, onExit, chartRect }) => {
  if (rackets.length < 2) return null;

  const specs = [
    { label: 'Brand', key: 'brand' }, { label: 'Price', key: 'price_num', suffix: '$' },
    { label: 'Head Size', key: 'head_size_in2', suffix: ' sq.in' }, { label: 'Weight', key: 'weight_g', suffix: ' g' },
    { label: 'Swingweight', key: 'swing_weight' }, { label: 'Flex', key: 'flex_ra' },
    { label: 'Power Level', key: 'power_lv_num' }, { label: 'Length', key: 'length_in', suffix: ' in' },
  ];

  const comparisonStyle = chartRect ? {
    top: `${chartRect.top}px`, left: `${chartRect.left}px`,
    width: `${chartRect.width}px`, height: `${chartRect.height}px`,
  } : {};

  return (
    <div id="comparison-container" style={comparisonStyle}>
      <h4>RACQUET COMPARISON</h4>
      <div className="comparison-flex-container">
        <div className="comparison-column labels-column">
          <div className="comparison-cell header-cell empty-header-cell"></div>
          {specs.map(spec => <div className="comparison-cell label-cell" key={spec.key}>{spec.label}</div>)}
        </div>
        {rackets.map(racket => (
          <div className="comparison-column racket-column" key={racket.id} style={{ backgroundColor: (BRAND_COLORS[racket.brand] || BRAND_COLORS.Default) + '20' }}>
            <div className="comparison-cell header-cell" style={{ color: BRAND_COLORS[racket.brand] || BRAND_COLORS.Default }}>{racket.brand}</div>
            {specs.map(spec => (
              <div className="comparison-cell data-cell" key={spec.key}>
                {racket[spec.key] || 'N/A'}{spec.suffix || ''}
              </div>
            ))}
          </div>
        ))}
      </div>
      <button onClick={onExit} className="comparison-back-button">BACK TO SUMMARY</button>
    </div>
  );
};

const SelectionTooltip = ({ rackets }) => {
  if (!rackets || rackets.length === 0) return null;
  return (
    <div id="selection-tooltip">
      {rackets.map(racket => (
        <div key={racket.id} className="selection-tooltip-item">
          <div className="selection-tooltip-header">
            {BRAND_LOGOS[racket.brand] && (
              <div className="selection-tooltip-logo-container" style={{ backgroundColor: BRAND_COLORS[racket.brand] || BRAND_COLORS.Default }}>
                <img src={BRAND_LOGOS[racket.brand]} alt={`${racket.brand} logo`} className="selection-tooltip-logo" />
              </div>
            )}
            <b>{racket.brand}</b>
          </div>
          <div className="selection-tooltip-body">
            <div>{racket.model_name}</div>
          </div>
        </div>
      ))}
    </div>
  );
};

const App = () => {
  const [rackets, setRackets] = useState([]);
  const [prefs, setPrefs] = useState({
    level: 'intermediate', powerPref: 3, brandFocus: 'all', swingStyle: 'all',
    minSwingweight: 280, maxSwingweight: 370, minWeight: 260, maxWeight: 340,
  });
  const [loading, setLoading] = useState(true);
  const [comparisonRackets, setComparisonRackets] = useState([]);
  const [selectedBrands, setSelectedBrands] = useState([]);
  const [isComparing, setIsComparing] = useState(false);
  const [chartRect, setChartRect] = useState(null);
  const mainRef = useRef(null);

  useEffect(() => {
    Papa.parse('/data/tennisRacquets_modeladded2.csv', {
      download: true, header: true, dynamicTyping: true,
      transformHeader: header => header.toLowerCase().replace(/\s+/g, '_'),
      complete: (results) => {
        const validData = results.data.filter(r => r.brand).map((r, index) => {
          const brandKey = Object.keys(BRAND_COLORS).find(key => r.brand && key.toLowerCase() === r.brand.toLowerCase());
          if (brandKey) r.brand = brandKey;
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

  const filteredRackets = useMemo(() => rackets.filter(r => {
    if (!r) return false;
    if (r.swing_weight < prefs.minSwingweight || r.swing_weight > prefs.maxSwingweight) return false;
    if (r.weight_g < prefs.minWeight || r.weight_g > prefs.maxWeight) return false;
    if (prefs.brandFocus !== 'all' && r.brand !== prefs.brandFocus) return false;
    if (prefs.powerPref >= 4 && r.power_lv_num < 3) return false;
    if (prefs.powerPref <= 2 && r.power_lv_num > 1) return false;
    if (prefs.level === 'advanced' && (r.head_size_in2 >= 102 || r.weight_g <= 290)) return false;
    if (prefs.level === 'beginner' && (r.head_size_in2 < 100 || r.weight_g > 300)) return false;
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
      if (isAlreadySelected) return prev.filter(r => r.id !== racket.id);
      if (prev.length < 3) return [...prev, racket];
      return prev;
    });
  };

  const handleCompareClick = () => {
    if (mainRef.current) {
      setChartRect(mainRef.current.getBoundingClientRect());
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
      margin: { t: 20, r: 20, b: 60, l: 70 }, autosize: true,
      dragmode: 'pan', hovermode: 'closest',
      hoverlabel: { arrowwidth: 0 },
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

  if (loading) return <div className="loading-screen">Loading Racket Data...</div>;

  return (
    <div className="page">
      <div id="controls">
        <h3>YOUR PROFILE</h3>
        <p>Adjust your preferences to define your ideal spec zone.</p>
        <label>LEVEL</label>
        <SegmentedControl name="level" selectedValue={prefs.level} onChange={handlePrefChange} options={[{ value: 'beginner', label: 'Beginner' }, { value: 'intermediate', label: 'Intermediate' }, { value: 'advanced', label: 'Advanced' }]} />
        <label>SWING STYLE</label>
        <SegmentedControl name="swingStyle" selectedValue={prefs.swingStyle} onChange={handlePrefChange} options={[{ value: 'all', label: 'All' }, { value: 'slow', label: 'Slow' }, { value: 'moderate', label: 'Moderate' }, { value: 'fast', label: 'Fast' }]} />
        <label>BRAND FOCUS<span className="value-label">{prefs.brandFocus}</span></label>
        <div className="select-wrapper">
          <select id="brandFocus" value={prefs.brandFocus} onChange={handlePrefChange}>
            <option value="all">All</option>
            {Object.keys(BRAND_COLORS).filter(b => b !== 'Default').map(brand => <option key={brand} value={brand}>{brand}</option>)}
          </select>
        </div>
        <label>SWINGWEIGHT<span className="value-label">{prefs.minSwingweight} - {prefs.maxSwingweight}</span></label>
        <RangeSlider min={250} max={400} step={5} minValue={prefs.minSwingweight} maxValue={prefs.maxSwingweight} onChange={handleSwingweightChange} />
        <label>RACQUET WEIGHT<span className="value-label">{prefs.minWeight} - {prefs.maxWeight} g</span></label>
        <RangeSlider min={250} max={350} step={5} minValue={prefs.minWeight} maxValue={prefs.maxWeight} onChange={handleWeightChange} />
        <PowerSlider value={prefs.powerPref} onChange={handlePrefChange} />
        <div id="specZoneSummary">
          <h4>YOUR SPEC ZONE</h4>
          <div id="specZoneBody">
            Your ideal zone is defined by rackets with a swingweight between <b>{prefs.minSwingweight}</b> and <b>{prefs.maxSwingweight}</b>,
            and a weight between <b>{prefs.minWeight}g</b> and <b>{prefs.maxWeight}g</b>,
            with a <b>{prefs.level}</b> skill level.
            You are focusing on <b>{prefs.brandFocus === 'all' ? 'all brands' : prefs.brandFocus}</b>.
          </div>
        </div>
      </div>
      <div className="main" ref={mainRef}>
        <div id="titleBar">
          <div><h1>EXPLORE YOUR RACQUET</h1><span>Full dataset from various brands (n={rackets.length}).</span></div>
          <span id="matchCountText">{plotData.length} MATCHES</span>
        </div>
        <div id="chart">
          <div className="custom-axis-label custom-xaxis-label">Swingweight</div>
          <div className="custom-axis-label custom-yaxis-label">RACQUET WEIGHT (g)</div>
          {comparisonRackets.length > 0 && <SelectionTooltip rackets={comparisonRackets} />}
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
            style={{ width: '100%', height: '100%', zIndex: 100 }}
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
              const textColor = getTextColorForBackground(brandColor);
              return (
                <div key={racket.id} className={`top-pick-card ${comparisonRackets.find(cr => cr.id === racket.id) ? 'active' : ''}`} onClick={() => handleRacketSelect(racket)}>
                  <div className="top-pick-rank" style={{ backgroundColor: brandColor, color: textColor }}>{index + 1}</div>
                  <div className="top-pick-details"><b>{racket.brand}</b><small>SW: {racket.swing_weight} | Wt: {racket.weight_g}g</small></div>
                </div>
              );
            })}
          </div>
        </div>
        <div id="mySelections">
          <h4>MY SELECTIONS</h4>
          <div id="mySelectionsBody">
            {comparisonRackets.length > 0 ? (
              comparisonRackets.map(racket => {
                const brandColor = BRAND_COLORS[racket.brand] || BRAND_COLORS.Default;
                const textColor = getTextColorForBackground(brandColor);
                return (
                  <div key={racket.id} className="selection-card" onClick={() => handleRacketSelect(racket)} style={{ '--brand-color': brandColor, '--brand-text-color': textColor }}>
                    <div className="selection-card-logo-container" style={{ backgroundColor: brandColor }}>
                      <img src={BRAND_LOGOS[racket.brand]} alt={`${racket.brand} logo`} className="selection-card-logo" />
                    </div>
                    <span className="selection-card-brand">{racket.brand}</span>
                    <span className="selection-card-info">{racket.swing_weight} / {racket.weight_g}g</span>
                  </div>
                );
              })
            ) : (
              <p>Click on rackets in the plot to select for comparison.</p>
            )}
            <div className="selection-actions">
              {comparisonRackets.length > 0 && <button className="clear-button" onClick={() => setComparisonRackets([])}>CLEAR</button>}
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
                        <span style={{ color: '#000000' }}>{brand}</span>
                      </div>
                      <span className="badge">{count}</span>
                    </li>
                  );
                })}
              </ul>
            ) : ( 'Adjust filters to find matching rackets.' )}
          </div>
        </div>
      </div>
      {isComparing && comparisonRackets.length > 1 && (
        <div className="comparison-overlay">
          <RacketComparison rackets={comparisonRackets} onExit={handleExitCompare} chartRect={chartRect} />
        </div>
      )}
    </div>
  );
};

export default App;
