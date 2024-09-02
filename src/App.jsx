import React, { useEffect, useState } from 'react';
import 'ol/ol.css'; 
import Map from 'ol/Map'; 
import View from 'ol/View'; 
import TileLayer from 'ol/layer/Tile'; 
import OSM from 'ol/source/OSM'; 
import { fromLonLat, toLonLat } from 'ol/proj'; 
import { Draw } from 'ol/interaction'; 
import { Vector as VectorLayer } from 'ol/layer';
import { Vector as VectorSource } from 'ol/source'; 
import * as turf from '@turf/turf'; 

function App() {
  const [map, setMap] = useState(null); 
  const [bollean, setBollean] = useState(null);
  const [lines, setLines] = useState([]); 
  const [miles, setMiles] = useState(false);
  const [rad, setRad] = useState(false);

  useEffect(() => {
    console.log(miles)
  }, [miles])


  useEffect(() => {
    if (map) {
      const vectorSource = new VectorSource();
      const draw = new Draw({
        source: vectorSource,
        type: 'LineString',
      });

      
      const clearInteractions = () => {
        map.getInteractions().forEach((interaction) => {
          if (interaction instanceof Draw) {
            map.removeInteraction(interaction);
          }
        });
      };

      
      clearInteractions();

      if (bollean) {
      
        draw.on('drawend', (event) => {
          const feature = event.feature;
          const coordinates = feature.getGeometry().getCoordinates();

          
          const start = toLonLat(coordinates[0]);
          const end = toLonLat(coordinates[1]);

         
          const line = turf.lineString([start, end]);

      
          const length = turf.length(line, { units: 'kilometers' }); 
          const bearing = turf.bearing(turf.point(start), turf.point(end)); 

        
          console.log(miles)
          if (document.getElementById("km").style.backgroundColor === "crimson"){
            alert(`Length: ${length.toFixed(2)} km\nAzimuth: ${bearing.toFixed(2)}°`);
          }else{
            alert(`Length: ${length.toFixed(2)/1.6} Miles\nAzimuth: ${bearing.toFixed(2)}°`);
          }
         
        });
      } else {
        
        draw.on('drawend', (event) => {
          const feature = event.feature;
          const coordinates = feature.getGeometry().getCoordinates();
          console.log(coordinates)
          console.log([lines, coordinates]);

          setLines((prevLines) => {
            const newLines = [...prevLines, coordinates];
            console.log(newLines);
            if (newLines.length === 2) {
             
              const angle = calculateAngle(newLines);
              if (document.getElementById("deg").style.backgroundColor === "crimson"){
                alert(`The angle is: ${angle.toFixed(2)}°`);
              }else{
                var pi = Math.PI;
                alert(`The angle is: ${(angle.toFixed(2)*(pi/180))} Rad`);
              }
            
              return []; 
            }
            return newLines;
          });
         
        });
      }

      map.addInteraction(draw); 
      setMap(map);
    }
  }, [bollean, map]);

  useEffect(() => {
    
    const vectorSource = new VectorSource();

    const vectorLayer = new VectorLayer({
      source: vectorSource,
    });

  
    const initialMap = new Map({
      layers: [
        new TileLayer({
          source: new OSM(), 
        }),
        vectorLayer, 
      ],
      view: new View({
        center: fromLonLat([0, 0]), 
        zoom: 2, 
      }),
      target: 'map', 
    });

    setMap(initialMap); 

    return () => {
      initialMap.setTarget(null); 
    };
  }, []); 

  const calculateAngle = (lines) => {
    const commonPoint = lines[0][1]; 
    const firstLineStart = lines[0][0];
    const secondLineEnd = lines[1][1];

    
    const point1 = toLonLat(firstLineStart);
    const point2 = toLonLat(commonPoint);
    const point3 = toLonLat(secondLineEnd);

    const bearingA = turf.bearing(turf.point(point2), turf.point(point1));
    const bearingB = turf.bearing(turf.point(point2), turf.point(point3));

    let angle = bearingB - bearingA;
    if (angle < 0) angle += 360; 
    return angle;
  };

  return (
    <div className="mapDiv">
      <div
        id="map" 
        style={{
          width: '100%',
          height: '500px', 
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
