import React, { useState, useEffect } from "react";
import { ResponsiveNetwork } from "@nivo/network";
import { aggregateGraphData, filterGraphData } from "../utils/DataProcessor";
import { useGlobalContext } from "../utils/GlobalContext";
import { BiWorld } from "react-icons/bi";

const PatternFinder = () => {
  const { aggregationType } = useGlobalContext();

  // State variables
  const [graphData, setGraphData] = useState({ nodes: [], links: [] });
  const [threshold, setThreshold] = useState(60); // Default threshold set to 60%
  const [loading, setLoading] = useState(true);
  const [isSliding, setIsSliding] = useState(false);

  // Fetch and process data
  useEffect(() => {
    const retrieveData = async () => {
      setLoading(true);
      try {
        // Aggregate node and edge data from sessions
        const { nodeData, edgeData } = await aggregateGraphData(aggregationType, true);

        // Filter graph data based on the current threshold
        const filteredData = filterGraphData(nodeData, edgeData, threshold);

        // Normalize edge weights
        const maxEdgeValue = Math.max(...filteredData.links.map((link) => link.value));
        const normalizedLinks = filteredData.links.map((link) => ({
          ...link,
          value: link.value / (maxEdgeValue || 1), // Avoid division by zero
        }));

        // Set the processed graph data to state
        setGraphData({
          nodes: filteredData.nodes,
          links: normalizedLinks,
        });
      } catch (error) {
        console.error("Error fetching and processing data:", error);
      } finally {
        setLoading(false);
      }
    };

    if (!isSliding) {
      retrieveData();
    }
  }, [threshold, aggregationType, isSliding]);

  // Handle threshold slider changes
  const handleThresholdChange = (event) => {
    setThreshold(event.target.value);
  };

  // Handle slider mouse down event
  const handleSliderMouseDown = () => {
    setIsSliding(true);
  };

  // Handle slider mouse up event
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
      <div style={{ height: "100vh", width: "100%" }}>
        <ResponsiveNetwork
          data={{
            nodes: graphData.nodes,
            links: graphData.links,
          }}
          margin={{ top: 20, right: 20, bottom: 20, left: 20 }}
          nodeSize={(node) => node.size * 5 + 10} // Scale node size for better visibility
          activeNodeSize={(node) => node.size * 7 + 15} // Increase size when active
          nodeColor={(node) => node.color || "rgb(97, 205, 187)"} // Default color for nodes
          nodeBorderWidth={1}
          nodeBorderColor={{
            from: "color",
            modifiers: [["darker", 0.8]],
          }}
          linkDistance={(edge) => 200 - edge.value * 150} // Adjust link distance based on normalized value
          repulsivity={200} // Spread nodes further apart
          linkThickness={(edge) => 2 + edge.value * 6} // Adjust link thickness based on normalized value
          linkBlendMode="multiply"
          motionConfig="wobbly"
          enableLabels={true} // Enable labels for nodes
          labelTextColor={{ from: "color", modifiers: [["darker", 1.6]] }}
          labelSkipRadius={12} // Minimum radius around nodes to skip labels
        />
      </div>
    </div>
  );
};

export default PatternFinder;