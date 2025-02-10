import React, { useState, useEffect } from 'react';
import { ResponsiveNetwork } from '@nivo/network';
import { aggregateGraphData, filterGraphData } from '../utils/DataProcessor';
import { useGlobalContext } from "../utils/GlobalContext";
import { BiWorld } from "react-icons/bi";

const PatternFinder = () => {
  const { aggregationType } = useGlobalContext();
  // Initialize state variables
  const [graphData, setGraphData] = useState({ nodes: [], links: [] });
  const [threshold, setThreshold] = useState(60);  // Default threshold set to 60%
  const [loading, setLoading] = useState(true);
  const [isSliding, setIsSliding] = useState(false);

  // Fetch the data on page load
  useEffect(() => {
    const retrieveData = async () => {
      setLoading(true);
      try {
        // Aggregate node and edge data from the sessions
        const { nodeData, edgeData } = await aggregateGraphData(aggregationType, true);

        // Filter the graph data based on the current threshold
        const filteredData = filterGraphData(nodeData, edgeData, threshold);

        // Set the rescaled graph data to the state
        setGraphData({ nodes: filteredData.nodes, links: filteredData.links });
      } catch (error) {
        console.error('Error fetching and processing data:', error);
      } finally {
        setLoading(false);
      }
    };

    if (!isSliding) {
      retrieveData();
    }
  }, [threshold, aggregationType, isSliding]); // Re-run whenever threshold, aggregationType, or isSliding changes

  // Function to handle threshold slider change
  const handleThresholdChange = (event) => {
    setThreshold(event.target.value);
  };

  // Function to handle slider mouse down
  const handleSliderMouseDown = () => {
    setIsSliding(true);
  };

  // Function to handle slider mouse up
  const handleSliderMouseUp = () => {
    setIsSliding(false);
  };

  // Render loading state
  if (loading) {
    return <div>Loading graph data...</div>;
  }

  // Render the graph using @nivo/network
  return (
    <div>
      <h1>Network Graph of Browsing Patterns</h1>

      {/* Threshold slider */}
      <div>
        <label>
          Threshold: {threshold}%
          <input
            type="range"
            min="40"
            max="80"
            value={threshold}
            onChange={handleThresholdChange}
            onMouseDown={handleSliderMouseDown}
            onMouseUp={handleSliderMouseUp}
            step="1"
          />
        </label>
      </div>

      {/* Graph rendering container */}
      {console.log(graphData)}
      <div style={{ height: '100vh', width: '100%' }}>
        <ResponsiveNetwork
          data={{
            nodes: graphData.nodes,
            links: graphData.links,
          }}
          margin={{ top: 0, right: 0, bottom: 0, left: 0 }}
          linkDistance={e => e.distance}
          centeringStrength={0.3}
          repulsivity={6}
          nodeSize={n => n.size}
          activeNodeSize={n => 1.5 * n.size}
          nodeColor={e => e.color}
          nodeBorderWidth={1}
          nodeBorderColor={{
            from: 'color',
            modifiers: [
              [
                'darker',
                0.8
              ]
            ]
          }}
          linkThickness={n => 2 + 2 * n.target.data.height}
          linkBlendMode="multiply"
          motionConfig="wobbly"

        />
      </div>
    </div>
  );
};

export default PatternFinder;
