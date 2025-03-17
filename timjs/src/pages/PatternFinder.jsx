import React, { useState, useEffect, useMemo, useCallback, useRef } from "react";
import CytoscapeComponent from "react-cytoscapejs";
import { InlineMath, BlockMath } from "react-katex";
import "katex/dist/katex.min.css";
import {
  Box,
  RadioGroup,
  Radio,
  Button,
  HStack,
  Text,
  Spinner,
  useToast,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Collapse,
} from "@chakra-ui/react";
import { motion } from "framer-motion";
import { useGlobalContext } from "../utils/GlobalContext";
import { retrievePatternData } from "../utils/DataProcessor";
import DefaultIcon from "../imgs/BiWorld.png";

const PatternFinder = () => {
  const { aggregationType } = useGlobalContext();
  const [isDirected, setIsDirected] = useState(false);
  const [showDetails, setShowDetails] = useState({});
  const [comparisonResults, setComparisonResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [graphData, setGraphData] = useState({ nodes: [], links: [] });
  const [tooltip, setTooltip] = useState({ show: false, x: 0, y: 0, text: "" });
  const [infoExpanded, setInfoExpanded] = useState(false);
  const [graphVisible, setGraphVisible] = useState(false);
  const [layoutFinished, setLayoutFinished] = useState(false);
  const cyRef = useRef(null); // Use a ref to store the Cytoscape instance
  const toast = useToast();

  // Overall container style
  const containerStyle = {
    display: "flex",
    flexDirection: "column",
    width: "100%",
    padding: "10px 25px",
    gap: "20px",
    backgroundColor: "#f5f5f5",
    borderRadius: "8px",
    animation: "fadeIn 0.5s ease-out",
  };

  // Divider style
  const dividerStyle = {
    backgroundColor: "gray",
    height: "2.5px",
    borderRadius: "10%",
    margin: "0px 20px",
    border: "none",
  };

  // Inject fade-in keyframes using template literals
  useEffect(() => {
    const styleSheet = document.createElement("style");
    styleSheet.innerText = `
      @keyframes fadeIn {
        from { opacity: 0; transform: translateY(20px); }
        to { opacity: 1; transform: translateY(0); }
      }
    `;
    document.head.appendChild(styleSheet);
    return () => {
      document.head.removeChild(styleSheet);
    };
  }, []);

  // Fetch graph and comparison data
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const { graphData, comparisonResults } = await retrievePatternData(aggregationType);
        setGraphData(graphData);
        setComparisonResults(comparisonResults);
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to load pattern data",
          status: "error",
          duration: 3000,
          isClosable: true,
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") fetchData();
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () =>
      document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, [aggregationType, toast]);

  // Layout configuration with improved parameters for better spacing.
  // Note: randomize is set to false to avoid top-left clumping.
  const layout = useMemo(
    () => ({
      name: "cose",
      animate: true,
      animationDuration: 1000,
      refresh: 20,
      fit: true,
      padding: 50,
      idealEdgeLength: 150,
      nodeRepulsion: 8000,
      nodeOverlap: 20,
      gravity: 100,
      numIter: 1000,
      initialTemp: 200,
      coolingFactor: 0.95,
      randomize: true, // Ensure consistent initial placement
    }),
    []
  );

  // Run layout after graphData changes
  useEffect(() => {
    const timer = setTimeout(() => {
      setGraphVisible(true);
      if (cyRef.current && cyRef.current.nodes().length > 0) {
        cyRef.current.ready(() => {
          const layoutInstance = cyRef.current.makeLayout(layout);
          setLayoutFinished(false);
          layoutInstance.run();
          layoutInstance.on("layoutstop", () => {
            setLayoutFinished(true);
            cyRef.current.fit();
          });
        });
      }
    }, 800);
    return () => clearTimeout(timer);
  }, [graphData, layout]);

  // Compute maximum node size for normalization
  const maxNodeSize = useMemo(() => {
    return graphData.nodes.reduce((max, node) => Math.max(max, node.size), 0);
  }, [graphData.nodes]);

  // Compute maximum edge value for directed case
  const maxEdgeValueDirected = useMemo(() => {
    return graphData.links.reduce((max, link) => Math.max(max, link.value), 0);
  }, [graphData.links]);

  // Interpolate link color from light gray (low value) to black (high value)
  const interpolateLinkColor = (value, max) => {
    const ratio = max > 0 ? value / max : 0;
    const colorVal = Math.round(200 - ratio * 200);
    return `rgb(${colorVal}, ${colorVal}, ${colorVal})`;
  };

  // Compute Cytoscape elements for nodes and edges.
  // The raw frequency is stored as "frequency", while the normalized size/width are used for display.
  const cyElements = useMemo(() => {
    // Nodes: assign normalized size and raw frequency.
    const cyNodes = graphData.nodes.map((node) => {
      const normSize =
        maxNodeSize > 0 ? (node.size / maxNodeSize) * (50 - 20) + 20 : 20;
      const icon = node.icon || DefaultIcon;
      return {
        data: {
          id: node.id,
          label: node.id,
          image: icon,
          size: normSize,       // Display size (normalized)
          frequency: node.size, // Raw frequency value
        },
      };
    });

    let cyEdges = [];
    if (isDirected) {
      // Directed edges: assign normalized width and raw frequency.
      cyEdges = graphData.links.map((link) => {
        const normWidth =
          maxEdgeValueDirected > 0
            ? (link.value / maxEdgeValueDirected) * (5 - 1) + 1
            : 1;
        const lineColor = interpolateLinkColor(link.value, maxEdgeValueDirected);
        return {
          data: {
            id: `${link.source}->${link.target}`,
            source: link.source,
            target: link.target,
            frequency: link.value, // Raw frequency value
            value: link.value,
            width: normWidth,      // Display width (normalized)
            lineColor,
          },
        };
      });
    } else {
      // For undirected edges, combine duplicate links.
      const edgeMap = {};
      graphData.links.forEach((link) => {
        const sorted = [link.source, link.target].sort();
        const key = sorted.join("||");
        if (!edgeMap[key]) {
          edgeMap[key] = {
            data: { id: key, source: sorted[0], target: sorted[1], value: 0 },
          };
        }
        edgeMap[key].data.value += link.value;
      });
      const undirectedEdges = Object.values(edgeMap);
      const maxEdgeValueUndirected = undirectedEdges.reduce(
        (max, edge) => Math.max(max, edge.data.value),
        0
      );
      cyEdges = undirectedEdges.map((edge) => {
        const normWidth =
          maxEdgeValueUndirected > 0
            ? (edge.data.value / maxEdgeValueUndirected) * (5 - 1) + 1
            : 1;
        const lineColor = interpolateLinkColor(
          edge.data.value,
          maxEdgeValueUndirected
        );
        return {
          data: {
            id: edge.data.id,
            source: edge.data.source,
            target: edge.data.target,
            frequency: edge.data.value, // Raw frequency value
            value: edge.data.value,
            width: normWidth,           // Display width (normalized)
            lineColor,
          },
        };
      });
    }
    return { nodes: cyNodes, edges: cyEdges };
  }, [graphData, maxNodeSize, maxEdgeValueDirected, isDirected]);

  // Cytoscape stylesheet with rounded edges (using "line-cap": "round").
  const stylesheet = [
    {
      selector: "node",
      style: {
        label: "data(label)",
        "background-image": "data(image)",
        "background-color": "white",
        "background-fit": "cover",
        width: "data(size)",
        height: "data(size)",
        "font-size": "8px",
        "text-valign": "bottom",
        "text-halign": "center",
        "overlay-opacity": 0,
        "z-index": 10,
      },
    },
    {
      selector: "edge",
      style: {
        "curve-style": "unbundled-bezier",
        "control-point-distances": [40],
        "control-point-weights": [0.5],
        width: "data(width)",
        "line-color": "data(lineColor)",
        "target-arrow-color": "data(lineColor)",
        "target-arrow-shape": isDirected ? "vee" : "none",
        "arrow-scale": 1.5,
        "target-distance-from-node": 3,
        "line-cap": "round", // Rounds the edge ends
        opacity: 1,
      },
    },
    {
      selector: ".teal-edge",
      style: {
        "line-color": "teal",
        "target-arrow-color": "teal",
        opacity: 1,
      },
    },
    {
      selector: ".focused",
      style: {
        "border-color": "#FFD700",
        "border-width": 4,
        "z-index": 30,
      },
    },
    {
      selector: ".faded",
      style: {
        opacity: 0.2,
      },
    },
  ];

  // Toggle A/B testing details.
  const toggleDetails = (key) => {
    setShowDetails((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  // Node tap handler: highlights the tapped node and its neighborhood.
  const handleNodeTap = useCallback(
    (event) => {
      if (!cyRef.current || !layoutFinished) return;
      const node = event.target;
      cyRef.current.elements().removeClass("focused teal-edge faded");
      node.addClass("focused");
      node.neighborhood("edge").addClass("teal-edge");
      node.neighborhood("node").addClass("focused");
      cyRef.current.elements().not(node).not(node.neighborhood()).addClass("faded");
    },
    [layoutFinished]
  );

  // Node hover handler: shows tooltip with frequency and normalized size.
  const handleNodeMouseOver = useCallback((event) => {
    if (!cyRef.current) return;
    const node = event.target;
    const frequency = node.data("frequency");
    const normSize = node.data("size");
    setTooltip({
      show: true,
      x: event.originalEvent.clientX,
      y: event.originalEvent.clientY,
      text: `Node: ${node.id()}\nFrequency: ${frequency}\nSize: ${Math.round(normSize)}px`,
    });
    node.addClass("focused");
    node.neighborhood("edge").addClass("teal-edge");
  }, []);

  const handleNodeMouseOut = useCallback(() => {
    setTooltip({ show: false, x: 0, y: 0, text: "" });
    if (cyRef.current) {
      cyRef.current.elements().removeClass("focused teal-edge faded");
    }
  }, []);

  // Edge hover handler: shows tooltip with frequency and rounded normalized width.
  const handleEdgeMouseOver = useCallback(
    (event) => {
      if (!cyRef.current || !layoutFinished) return;
      const edge = event.target;
      const frequency = edge.data("frequency");
      const normWidth = edge.data("width");
      // Show "→" for directed, "—" for undirected
      const arrowSymbol = isDirected ? "→" : "—";
      setTooltip({
        show: true,
        x: event.originalEvent.clientX,
        y: event.originalEvent.clientY,
        text: `Edge: ${edge.source().id()} ${arrowSymbol} ${edge.target().id()}\n` +
              `Frequency: ${frequency}\n` +
              `Width: ${Math.round(normWidth)}px`,
      });
      edge.addClass("focused");
    },
    [layoutFinished, isDirected]
  );

  const handleEdgeMouseOut = useCallback(() => {
    setTooltip({ show: false, x: 0, y: 0, text: "" });
  }, []);

  // Cytoscape instance callback: sets up the instance and event handlers.
  const cyCallback = useCallback(
    (cy) => {
      // Store the Cytoscape instance in the ref
      cyRef.current = cy;
      // Enable user interactions
      cy.userPanningEnabled(true);
      cy.userZoomingEnabled(true);
      // Set up event handlers for nodes and edges
      cy.on("tap", "node", handleNodeTap);
      cy.on("mouseover", "node", handleNodeMouseOver);
      cy.on("mouseout", "node", handleNodeMouseOut);
      cy.on("mouseover", "edge", handleEdgeMouseOver);
      cy.on("mouseout", "edge", handleEdgeMouseOut);
    },
    [
      handleNodeTap,
      handleNodeMouseOver,
      handleNodeMouseOut,
      handleEdgeMouseOver,
      handleEdgeMouseOut,
    ]
  );

  // Framer Motion config for container entrance animation.
  const motionConfig = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.5 },
  };

  return (
    <Box style={containerStyle}>
      {/* Network Graph Section */}
      <Box mb={6} position="relative">
        <HStack justify="space-between" align="center">
          <Box>
            <Text as="h1" fontSize="2xl" fontWeight="bold">
              Network Graph
            </Text>
            {/* Show different message for directed vs undirected */}
            <Text fontSize="md" color="gray.600">
              {isDirected
                ? "Directed Graph: Edges have a direction from source to target."
                : "Undirected Graph: Edges do not imply a particular direction."}
            </Text>
          </Box>
          <Box mb={3}>
            <HStack padding="10px">
              <Text as="h3" fontSize="lg" fontWeight="semibold">
                Network Type:
              </Text>
              <RadioGroup
                colorScheme="gray"
                onChange={(val) => setIsDirected(val === "directed")}
                value={isDirected ? "directed" : "undirected"}
                size="lg"
              >
                <HStack spacing="3vw">
                  <Radio value="undirected">Undirected</Radio>
                  <Radio value="directed">Directed</Radio>
                </HStack>
              </RadioGroup>
            </HStack>
          </Box>
        </HStack>
        {/* Show spinner overlay for graph if still loading */}
        {(!graphVisible || isLoading) ? (
          <Box
            height="35vh"
            border="1px solid #EAEAEA"
            borderRadius="8px"
            display="flex"
            alignItems="center"
            justifyContent="center"
          >
            <Spinner size="xl" />
          </Box>
        ) : (
          <>
            {/* Animated Cytoscape graph */}
            <motion.div {...motionConfig}>
              <CytoscapeComponent
                elements={[...cyElements.nodes, ...cyElements.edges]}
                stylesheet={stylesheet}
                style={{
                  width: "100%",
                  height: "35vh",
                  border: "1px solid #EAEAEA",
                  borderRadius: "8px",
                }}
                cy={cyCallback}
              />
            </motion.div>
            {tooltip.show && (
              <Box
                position="fixed"
                left={tooltip.x}
                top={tooltip.y}
                backgroundColor="gray"
                color="white"
                padding="8px"
                borderRadius="4px"
                zIndex={1000}
                fontSize="sm"
                whiteSpace="pre-wrap"
              >
                {tooltip.text}
              </Box>
            )}
          </>
        )}
      </Box>

      {/* Divider */}
      <hr style={dividerStyle} />

      {/* A/B Testing Results Section */}
      <Box mb={6}>
        <Text fontSize="xl" fontWeight="bold" mb={2} color="#000000">
          A/B Testing Results
        </Text>
        <Box height="20vh" overflowY="auto">
          {isLoading ? (
            <Box
              height="35vh"
              border="1px solid #EAEAEA"
              borderRadius="8px"
              display="flex"
              alignItems="center"
              justifyContent="center"
            >
              <Spinner size="xl" />
            </Box>
          ) : comparisonResults.length === 0 ? (
            <Text>No comparisons available.</Text>
          ) : (
            comparisonResults.map((comp, index) => (
              <Box
                key={comp.key}
                mb={3}
                p={3}
                border="1px solid #EAEAEA"
                borderRadius="8px"
                backgroundColor="#FFFFFF"
                boxShadow="0 2px 4px rgba(0,0,0,0.1)"
                transition="all 0.3s ease"
              >
                <HStack justify="space-between" align="center">
                  <Text>
                    {comp.confidence
                      ? `${index + 1}- With ${comp.confidence} confidence, ${comp.direction.to} was opened after ${comp.direction.from}.`
                      : `${index + 1}- No significant difference between ${comp.nodeA} and ${comp.nodeB}.`}
                  </Text>
                  <Button
                    size="xs"
                    backgroundColor="#000000"
                    color="#FFFFFF"
                    borderRadius="0"
                    px={6}
                    py={4}
                    onClick={() => toggleDetails(comp.key)}
                    _hover={{ backgroundColor: "#333333" }}
                  >
                    {showDetails[comp.key] ? "Hide Details" : "View Details"}
                  </Button>
                </HStack>
                {showDetails[comp.key] && (
                  <Box mt={2}>
                    <HStack justify="space-between" align="start">
                      <Box>
                        <BlockMath
                          math={`\\chi^2 = \\sum_{i=1}^{4} \\frac{(O_i - E_i)^2}{E_i} \\approx ${comp.chi2.toFixed(
                            2
                          )} \\quad (df = 1)`}
                        />
                        <Text mt={1} fontSize="sm">
                          For the contingency table below, where:
                          <br />
                          • <InlineMath math="O_1" /> = transitions from{" "}
                          <strong>{comp.direction.from}</strong> to{" "}
                          <strong>{comp.direction.to}</strong>, •{" "}
                          <InlineMath math="O_2" /> = transitions from{" "}
                          <strong>{comp.direction.from}</strong> to others,
                          <br />
                          • <InlineMath math="O_3" /> = transitions from non-
                          <strong>{comp.direction.from}</strong> to{" "}
                          <strong>{comp.direction.to}</strong>, •{" "}
                          <InlineMath math="O_4" /> = transitions from non-
                          <strong>{comp.direction.from}</strong> to others.
                        </Text>
                      </Box>

                      <Table
                        variant="simple"
                        size="sm"
                        mt={2}
                        width="50%"
                        border="1px solid #ccc"
                      >
                        <Thead backgroundColor="#f0f0f0">
                          <Tr backgroundColor="#C4C4C4">
                            <Th border="1px solid #ccc" p={2}>
                              Transition Type
                            </Th>
                            <Th border="1px solid #ccc" p={2}>
                              {comp.direction.from} Users
                            </Th>
                            <Th border="1px solid #ccc" p={2}>
                              Non-{comp.direction.from} Users
                            </Th>
                          </Tr>
                        </Thead>
                        <Tbody>
                          <Tr>
                            <Td border="1px solid #ccc" p={2}>
                              Transition to {comp.direction.to} (<InlineMath math="O_1" />)
                            </Td>
                            <Td border="1px solid #ccc" p={2}>
                              {comp.O1}
                            </Td>
                            <Td border="1px solid #ccc" p={2}>
                              {comp.O3}
                            </Td>
                          </Tr>
                          <Tr>
                            <Td border="1px solid #ccc" p={2}>
                              Transition to Others (<InlineMath math="O_2" />)
                            </Td>
                            <Td border="1px solid #ccc" p={2}>
                              {comp.O2}
                            </Td>
                            <Td border="1px solid #ccc" p={2}>
                              {comp.O4}
                            </Td>
                          </Tr>
                          <Tr>
                            <Td border="1px solid #ccc" p={2}>
                              Expected (<InlineMath math="E_1" />, <InlineMath math="E_3" />)
                            </Td>
                            <Td border="1px solid #ccc" p={2}>
                              {comp.E1.toFixed(1)}
                            </Td>
                            <Td border="1px solid #ccc" p={2}>
                              {comp.E3.toFixed(1)}
                            </Td>
                          </Tr>
                        </Tbody>
                      </Table>
                    </HStack>

                    <Text mt={1} fontWeight={600}>
                      For{" "}
                      <Box as="span" display="inline-block">
                        <BlockMath math="\\chi^2" />
                      </Box>{" "}
                      = {comp.chi2.toFixed(2)}, the p-value is approximately{" "}
                      {comp.pValue.toFixed(3)}.
                    </Text>
                  </Box>
                )}
              </Box>
            ))
          )}
        </Box>
      </Box>

      {/* Information Section (Collapsible) */}
      <Box
        backgroundColor="#000000"
        p={5}
        color="#FFFFFF"
        fontWeight={200}
        borderRadius="8px"
        boxShadow="0 2px 4px rgba(0,0,0,0.1)"
      >
        <HStack justify="space-between" align="center">
          <Text fontSize="xl" fontWeight="bold" mb={2}>
            Information:
          </Text>
          <Button
            style={{
              backgroundColor: "#F0F0F0",
              border: "1px solid #D0D0D0",
              padding: "10px 20px",
              borderRadius: "4px",
              fontSize: "16px",
              fontWeight: "bold",
              color: "#333",
              transition: "background-color 0.3s",
            }}
            onClick={() => setInfoExpanded(!infoExpanded)}
          >
            {infoExpanded ? "Show Less" : "Show More"}
          </Button>
        </HStack>
        <Collapse in={infoExpanded} animateOpacity>
          <Box mt={2}>
            <Box as="ul" pl={4}>
              <Box as="li" mb={1}>
                Icon Size & Edges Reflect Usage Frequency.
              </Box>
              <Box as="li" mb={1}>
                A/B testing aims to determine whether observed patterns are the result of actual changes or if they reflect consistent usage trends.
              </Box>
              <Box as="li" mb={1}>
                Not All Data is used in The Graph & A/B testing. Only the Top 80% used Websites are used to plot the network graph and implement the A/B Testing.
              </Box>
              <Box as="li" mb={1}>
                Data can be misleading on small frequencies, but the certainty increases with sample size.
              </Box>
            </Box>
          </Box>
        </Collapse>
      </Box>
    </Box>
  );
};

export default PatternFinder;
