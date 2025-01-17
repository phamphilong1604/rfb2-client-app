import './heatmap_style.css';

import { useEffect, useState } from 'preact/hooks'
import { DateTime } from 'luxon';
import graphQL from '../graphQL.js';
import { initMap } from './heatmap_code.js';
import { render } from 'preact'

function HeatMapControls({ allHouseholds, mapApi }) {
  const { renderHeatMap } = mapApi;

  function getSelectedHouseholds(timeLimit) {
    let households = allHouseholds;
    if (timeLimit !== "all") {
      const now = DateTime.now();
      const delta = {};
      delta[timeLimit] = 1;
      const startDate = now.minus(delta);
      households = households.filter(h => h.lastVisit >= startDate.toISODate());
    }

    // divide households into those with a latlng / address and those missing a latlng/address
    const noAddress = households.filter(({ address1, latlng }) => address1 == '' || latlng == '');
    households = households.filter( ({ address1, latlng }) => address1 != '' && latlng != '');

    // group the noAddress households by city and count them
    const cityCounts = {};
    noAddress.forEach(({ city }) => {
      if (city && city.name) {
        cityCounts[city.name] = (cityCounts[city.name] || 0) + 1;
      } else {
        const unknownCity = "Unknown";
        cityCounts[unknownCity] = (cityCounts[unknownCity] || 0 ) + 1;
      }
    });

    return { households, cityCounts };
  }

  const defaultTimeLimit = 'year';
  const { households: defaultHouseholds, cityCounts: defaultCityCounts } = getSelectedHouseholds(defaultTimeLimit)

  const [colorCities, setColorCities] = useState(mapApi.state.colorCities);
  const [dissipating, setDissipating] = useState(mapApi.state.dissipating);
  const [households, setHouseholds] = useState(defaultHouseholds);
  const [opacity, setOpacity] = useState(mapApi.state.opacity);
  const [radius, setRadius] = useState(mapApi.state.radius);
  const [showPins, setShowPins] = useState(mapApi.state.showPins);
  const [timeLimit, setTimeLimit] = useState(defaultTimeLimit);
  const [cityCounts, setCityCounts] = useState(defaultCityCounts);

  renderHeatMap({
    dissipating,
    opacity,
    radius,
    households,
    showPins,
    colorCities,
    cityCounts,
  });

  return (
    <div id="floating-panel">
      <button id="toggle-pins" onclick={() => setShowPins(!showPins) }>Toggle Pins</button>
      <button id="decrease-radius" onClick={() => setRadius(radius - 5) }>Decrease radius</button>
      <button id="increase-radius" onClick={() => setRadius(radius + 5) }>Increase radius</button>
      <button id="change-opacity" onClick={() => setOpacity(1- opacity) }>Change opacity</button>
      <button id="change-dissipating" onClick={() => setDissipating(!dissipating) }>Change dissipating</button>
      <button id="change-show-cities" onClick={() => setColorCities(!colorCities) }>Fill City Boundaries</button>
      <label>
        <span style={{ padding: "15px" }}>Households visited in the last:</span>
        <select id="timeLimitSelect"
          onChange={e => {
            setTimeLimit(e.target.value);
            const { households, cityCounts } = getSelectedHouseholds(e.target.value);
            setHouseholds(households);
            setCityCounts(cityCounts);
          }}
          value={timeLimit}>
          <option value="week">Last Week</option>
          <option value="month">Last Month</option>
          <option value="quarter">Last Quarter</option>
          <option value="year">Last year</option>
          <option value="all">All Time</option>
        </select>
      </label>
    </div>);
}

export function initHeatMap(allHouseholds, mapApi) {
  render(
    <HeatMapControls allHouseholds={allHouseholds} mapApi={mapApi} />,
    document.getElementById('heatmap-controls')
  );
}

export default function HeatMap() {
  const [mapApi, setMapApi] = useState(null);
  const [allHouseholds, setAllHouseholds] = useState([]);

  useEffect( () => {
    if (allHouseholds.length == 0) {
      const query = `{households(ids: []) { latlng lastVisit address1 city{name} }}`;

      graphQL(query, 'households').then( json => {
        let { households } = json.data;
        households = households
          .map( ({ lastVisit, latlng, address1, city }) => ({
            lastVisit,
            latlng: latlng ? JSON.parse(latlng) : '',
            address1,
            city,
          }));
        initMap().then( mapApi => {
          setAllHouseholds(households);
          setMapApi(mapApi);
        });
      });
    }
  });
  return (
    <>
      { mapApi && <HeatMapControls allHouseholds={allHouseholds} mapApi={mapApi} /> }
      <div id="map" />
    </>
  );
}
