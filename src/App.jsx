import React, { useEffect, useState } from 'react';
import 'ol/ol.css'; // Import základního CSS OpenLayers
import Map from 'ol/Map'; // Import třídy Map
import View from 'ol/View'; // Import třídy View
import TileLayer from 'ol/layer/Tile'; // Import třídy TileLayer
import OSM from 'ol/source/OSM'; // Import třídy OSM
import { fromLonLat, toLonLat } from 'ol/proj'; // Import funkce pro převod souřadnic
import { Draw } from 'ol/interaction'; // Import interakcí pro kreslení
import { Vector as VectorLayer } from 'ol/layer'; // Import VectorLayer
import { Vector as VectorSource } from 'ol/source'; // Import VectorSource
import * as turf from '@turf/turf'; // Import knihovny Turf.js

function App() {
  const [map, setMap] = useState(null); // Stav pro mapu
  const [bollean, setBollean] = useState(null);
  const [lines, setLines] = useState([]); // Stav pro uchovávání úseček
  const [miles, setMiles] = useState(false);
  const [rad, setRad] = useState(false);

  useEffect(() => {
    console.log(miles)
  }, [miles])

  // useEffect pro přidávání a odebírání interakcí při změně bollean
  useEffect(() => {
    if (map) {
      const vectorSource = new VectorSource(); // Vektorový zdroj pro úsečky
      const draw = new Draw({
        source: vectorSource,
        type: 'LineString',
      });

      // Funkce pro odstranění všech interakcí z mapy
      const clearInteractions = () => {
        map.getInteractions().forEach((interaction) => {
          if (interaction instanceof Draw) {
            map.removeInteraction(interaction);
          }
        });
      };

      // Odstranit staré interakce před přidáním nové
      clearInteractions();

      if (bollean) {
        // Pokud bollean je true, přidáme logiku pro měření délky
        draw.on('drawend', (event) => {
          const feature = event.feature;
          const coordinates = feature.getGeometry().getCoordinates();

          // Transformace souřadnic z EPSG:3857 na EPSG:4326
          const start = toLonLat(coordinates[0]);
          const end = toLonLat(coordinates[1]);

          // Vytvoření úsečky v Turf.js
          const line = turf.lineString([start, end]);

          // Výpočet délky a azimutu
          const length = turf.length(line, { units: 'kilometers' }); // Délka v kilometrech
          const bearing = turf.bearing(turf.point(start), turf.point(end)); // Azimut

          // Upozornění na výsledky
          console.log(miles)
          if (document.getElementById("km").style.backgroundColor === "crimson"){
            alert(`Length: ${length.toFixed(2)} km\nAzimuth: ${bearing.toFixed(2)}°`);
          }else{
            alert(`Length: ${length.toFixed(2)/1.6} Miles\nAzimuth: ${bearing.toFixed(2)}°`);
          }
         
        });
      } else {
        // Pokud bollean je false, přidáme logiku pro měření úhlu
        draw.on('drawend', (event) => {
          const feature = event.feature;
          const coordinates = feature.getGeometry().getCoordinates();
          console.log(coordinates)
          console.log([lines, coordinates]);

          setLines((prevLines) => {
            const newLines = [...prevLines, coordinates];
            console.log(newLines);
            if (newLines.length === 2) {
              // Vypočítat úhel, pokud máme dvě úsečky
              const angle = calculateAngle(newLines);
              if (document.getElementById("deg").style.backgroundColor === "crimson"){
                alert(`The angle is: ${angle.toFixed(2)}°`);
              }else{
                var pi = Math.PI;
                alert(`The angle is: ${(angle.toFixed(2)*(pi/180))} Rad`);
              }
            
              return []; // Reset lines pro nové měření
            }
            return newLines;
          });
         
        });
      }

      map.addInteraction(draw); // Přidání aktuální interakce na mapu
      setMap(map);
    }
  }, [bollean, map]);

  useEffect(() => {
    // Inicializace mapy při prvním renderování
    const vectorSource = new VectorSource(); // Vektorový zdroj pro úsečky

    const vectorLayer = new VectorLayer({
      source: vectorSource,
    });

    // Vytvoření nové instance mapy OpenLayers
    const initialMap = new Map({
      layers: [
        new TileLayer({
          source: new OSM(), // Zdroj mapy - OpenStreetMap
        }),
        vectorLayer, // Přidání vektorové vrstvy do mapy
      ],
      view: new View({
        center: fromLonLat([0, 0]), // Počáteční pozice [délka, šířka] v EPSG:3857
        zoom: 2, // Počáteční úroveň přiblížení
      }),
      target: 'map', // ID HTML elementu, kam se mapa připojí
    });

    setMap(initialMap); // Nastavení instance mapy do stavu

    return () => {
      initialMap.setTarget(null); // Odstranění mapy při unmountování
    };
  }, []); // useEffect spouštěný pouze při mountování a unmountování

  const calculateAngle = (lines) => {
    const commonPoint = lines[0][1]; // Předpokládáme, že úsečky mají společný druhý bod
    const firstLineStart = lines[0][0];
    const secondLineEnd = lines[1][1];

    // Transformace souřadnic do EPSG:4326
    const point1 = toLonLat(firstLineStart);
    const point2 = toLonLat(commonPoint);
    const point3 = toLonLat(secondLineEnd);

    const bearingA = turf.bearing(turf.point(point2), turf.point(point1));
    const bearingB = turf.bearing(turf.point(point2), turf.point(point3));

    let angle = bearingB - bearingA;
    if (angle < 0) angle += 360; // Normalizace úhlu
    return angle;
  };

  return (
    <div className="mapDiv">
      <div
        id="map" // ID HTML elementu, které bude použit jako cíl pro vykreslení mapy
        style={{
          width: '100%',
          height: '500px', // Výška mapy
        }}
      ></div>
      <div className="buttons">

        <div className="lenghts">
        <button
          className="length"
          style={bollean ? { backgroundColor: 'crimson' } : { backgroundColor: 'aqua' }}
          onClick={() => setBollean(true)}
        >
          Length
        </button>
        <div className="">
        <button id='km' onClick={() => setMiles(false)}  style={!miles ? { backgroundColor: 'crimson' } : { backgroundColor: 'grey' }}>Km</button>
        <button id='mile' onClick={() => setMiles(true)}  style={miles ? { backgroundColor: 'crimson' } : { backgroundColor: 'grey' }}>Miles</button>
        </div>
        </div>
       
        <div className="angles">
        <button
          className="angle"
          style={!bollean ? { backgroundColor: 'crimson' } : { backgroundColor: 'aqua' }}
          onClick={() => setBollean(false)}
        >
          Angle
        </button>
         <div className="">
         <button id='deg' onClick={() => setRad(false)} style={!rad ? { backgroundColor: 'crimson' } : { backgroundColor: 'grey' }}>Degrees</button>
         <button onClick={() => setRad(true)} style={rad ? { backgroundColor: 'crimson' } : { backgroundColor: 'grey' }}>Rad</button>
         </div>
        </div>
       
      </div>
    </div>
  );
}

export default App;
