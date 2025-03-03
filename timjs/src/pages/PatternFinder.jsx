import React, { useState, useEffect, useMemo } from "react";
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
} from "@chakra-ui/react";
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
  const [arrange, setArrange] = useState(false);
  const toast = useToast();

  // Container style (replacing PatternFinder.css)
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

  // Fade-in keyframes via inline style (injected into document head)
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

  // Graph styling constants
  const MAX_NODE_SIZE = 50;
  const MIN_NODE_SIZE = 20;
  const MAX_EDGE_WIDTH = 5;
  const MIN_EDGE_WIDTH = 1;

  const maxNodeSize = useMemo(() => {
    return graphData.nodes.reduce((max, node) => Math.max(max, node.size), 0);
  }, [graphData.nodes]);

  const maxEdgeValue = useMemo(() => {
    return graphData.links.reduce((max, link) => Math.max(max, link.value), 0);
  }, [graphData.links]);

  // Compute Cytoscape elements
  const cyElements = useMemo(() => {
    const cyNodes = graphData.nodes.map((node) => {
      const normSize =
        maxNodeSize > 0
          ? (node.size / maxNodeSize) * (MAX_NODE_SIZE - MIN_NODE_SIZE) + MIN_NODE_SIZE
          : MIN_NODE_SIZE;
      const icon = node.icon || DefaultIcon;
      return {
        data: { id: node.id, label: node.id, image: icon, size: normSize },
      };
    });

    let cyEdges = [];
    if (isDirected) {
      cyEdges = graphData.links.map((link) => {
        const normWidth =
          maxEdgeValue > 0
            ? (link.value / maxEdgeValue) * (MAX_EDGE_WIDTH - MIN_EDGE_WIDTH) + MIN_EDGE_WIDTH
            : MIN_EDGE_WIDTH;
        return {
          data: {
            id: `${link.source}->${link.target}`,
            source: link.source,
            target: link.target,
            value: link.value,
            width: normWidth,
          },
        };
      });
    } else {
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

      cyEdges = Object.values(edgeMap).map((edge) => {
        const normWidth =
          maxEdgeValue > 0
            ? (edge.data.value / maxEdgeValue) * (MAX_EDGE_WIDTH - MIN_EDGE_WIDTH) + MIN_EDGE_WIDTH
            : MIN_EDGE_WIDTH;
        return {
          data: {
            id: edge.data.id,
            source: edge.data.source,
            target: edge.data.target,
            value: edge.data.value,
            width: normWidth,
          },
        };
      });
    }
    return { nodes: cyNodes, edges: cyEdges };
  }, [graphData, maxNodeSize, maxEdgeValue, isDirected]);

  const toggleDetails = (key) => {
    setShowDetails((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  // Cytoscape stylesheet (unchanged but applied inline)
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
      },
    },
    {
      selector: "edge",
      style: {
        "curve-style": "bezier",
        width: "data(width)",
        "line-color": (ele) => {
          const value = ele.data("value");
          const normalized = maxEdgeValue > 0 ? value / maxEdgeValue : 0;
          const grayValue = Math.round(128 + (255 - 128) * (1 - normalized));
          return `rgb(${grayValue}, ${grayValue}, ${grayValue})`;
        },
        "target-arrow-color": (ele) => {
          const value = ele.data("value");
          const normalized = maxEdgeValue > 0 ? value / maxEdgeValue : 0;
          const grayValue = Math.round(128 + (255 - 128) * (1 - normalized));
          return `rgb(${grayValue}, ${grayValue}, ${grayValue})`;
        },
        "target-arrow-shape": isDirected ? "triangle" : "none",
      },
    },
  ];

  // Layout configuration for Cytoscape
  const layout = {
    name: "cose",
    animate: true,
    idealEdgeLength: 100,
    nodeRepulsion: 400000,
    gravity: 80,
    numIter: 100,
    coolingFactor: 0.95,
    fit: true,
  };

  return (
    <Box style={containerStyle}>
      {/* Network Graph Section */}
      <Box mb={6}>
        <HStack justify="space-between" align="center">
          <Text as="h1" fontSize="2xl" fontWeight="bold">
            Network Graph
          </Text>
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
        {isLoading ? (
          <Spinner />
        ) : (
          <>
            <CytoscapeComponent
              elements={CytoscapeComponent.normalizeElements({
                nodes: cyElements.nodes,
                edges: cyElements.edges,
              })}
              stylesheet={stylesheet}
              layout={layout}
              style={{
                width: "100%",
                height: "35vh",
                border: "1px solid #EAEAEA",
                borderRadius: "8px",
              }}
              cy={(cy) => {
                cy.userPanningEnabled(false);
                cy.userZoomingEnabled(false);
                if (!arrange) {
                  cy.resize();
                  cy.layout(layout).run();
                  setArrange(true);
                }
                cy.on("mouseover", "edge", (event) => {
                  const edge = event.target;
                  const from = edge.source().id();
                  const to = edge.target().id();
                  const value = edge.data("value");
                  setTooltip({
                    show: true,
                    x: event.originalEvent.clientX,
                    y: event.originalEvent.clientY,
                    text: `${from} to ${to}: ${value}`,
                  });
                });
                cy.on("mouseout", "edge", () => {
                  setTooltip({ show: false, x: 0, y: 0, text: "" });
                });
              }}
            />
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
            <Spinner />
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
                              Transition to {comp.direction.to} (
                              <InlineMath math="O_1" />)
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
                              Expected (<InlineMath math="E_1" />,{" "}
                              <InlineMath math="E_3" />)
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

      {/* Information Section */}
      <Box
        backgroundColor="#000000"
        p={5}
        color="#FFFFFF"
        fontWeight={200}
        borderRadius="8px"
        boxShadow="0 2px 4px rgba(0,0,0,0.1)"
      >
        <Text fontSize="xl" fontWeight="bold" mb={2}>
          Information:
        </Text>
        <Box as="ul" pl={4}>
          <Box as="li" mb={1}>
            Icon Size & Edges Reflect Usage Frequency.
          </Box>
          <Box as="li">
            A/B testing aims to determine whether observed patterns are the result of actual changes or if they reflect consistent usage trends.
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

export default PatternFinder;
