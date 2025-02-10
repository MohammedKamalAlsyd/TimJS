import React, { useState, useEffect, useMemo } from 'react';
import CytoscapeComponent from 'react-cytoscapejs';
import { InlineMath, BlockMath } from 'react-katex';
import 'katex/dist/katex.min.css';
import {
  Box,
  Slider,
  SliderTrack,
  SliderFilledTrack,
  SliderThumb,
  RadioGroup,
  Radio,
  Button,
  HStack,
  VStack,
  Text,
  Spinner,
  Tooltip,
  useToast
} from '@chakra-ui/react';
import { useGlobalContext } from '../utils/GlobalContext';

// -----------------------------
// Sample Test Data (refined)
// -----------------------------
const testData = {
  sessions: {
    "2025-01-11": {
      "google.com": { 
        icon: "https://www.google.com/favicon.ico", 
        time: 120, 
        nextWebsites: { "youtube.com": 5 } 
      },
      "youtube.com": { 
        icon: "https://www.youtube.com/favicon.ico", 
        time: 50, 
        nextWebsites: { "facebook.com": 3, "twitter.com": 2 } 
      }
    },
    "2025-01-20": {
      "facebook.com": { 
        icon: "https://www.facebook.com/favicon.ico", 
        time: 35, 
        nextWebsites: { "youtube.com": 1, "twitter.com": 3 } 
      },
      "twitter.com": { 
        icon: "https://twitter.com/favicon.ico", 
        time: 50, 
        nextWebsites: { "google.com": 2, "youtube.com": 1 } 
      }
    },
    "2025-01-25": {
      "reddit.com": { 
        icon: "https://www.reddit.com/favicon.ico", 
        time: 60, 
        nextWebsites: { "youtube.com": 6, "facebook.com": 2 } 
      },
      "youtube.com": { 
        icon: "https://www.youtube.com/favicon.ico", 
        time: 70, 
        nextWebsites: { "facebook.com": 10 } 
      }
    },
    "2025-01-30": {
      "tiktok.com": { 
        icon: "https://www.tiktok.com/favicon.ico", 
        time: 30, 
        nextWebsites: { "youtube.com": 3, "instagram.com": 4 } 
      },
      "instagram.com": { 
        icon: "https://www.instagram.com/favicon.ico", 
        time: 80, 
        nextWebsites: { "tiktok.com": 1, "facebook.com": 2 } 
      }
    },
    "2025-02-04": {
      "pinterest.com": { 
        icon: "https://www.pinterest.com/favicon.ico", 
        time: 40, 
        nextWebsites: { "youtube.com": 4 } 
      },
      "youtube.com": { 
        icon: "https://www.youtube.com/favicon.ico", 
        time: 100, 
        nextWebsites: { "pinterest.com": 3, "facebook.com": 7 } 
      }
    },
    "2025-02-09": {
      "linkedin.com": { 
        icon: "https://www.linkedin.com/favicon.ico", 
        time: 20, 
        nextWebsites: { "twitter.com": 3 } 
      },
      "twitter.com": { 
        icon: "https://twitter.com/favicon.ico", 
        time: 35, 
        nextWebsites: { "linkedin.com": 4, "facebook.com": 2 } 
      }
    },
    "2025-02-10": {
      "google.com": { 
        icon: "https://www.google.com/favicon.ico", 
        time: 90, 
        nextWebsites: { "youtube.com": 5, "reddit.com": 2 } 
      },
      "youtube.com": { 
        icon: "https://www.youtube.com/favicon.ico", 
        time: 60, 
        nextWebsites: { "google.com": 4, "facebook.com": 3 } 
      }
    }
  },
  browsing: {
    "2025-01-11": 170,
    "2025-01-20": 120,
    "2025-01-25": 160,
    "2025-01-30": 180,
    "2025-02-04": 190,
    "2025-02-09": 100,
    "2025-02-10": 200
  },
  urlsOpened: {
    "2025-01-11": 30,
    "2025-01-20": 25,
    "2025-01-25": 35,
    "2025-01-30": 40,
    "2025-02-04": 45,
    "2025-02-09": 25,
    "2025-02-10": 50
  },
  total_browsing_time: 1265,
  total_urls_opened: 210
};

// -----------------------------
// Process testData into raw nodes and links
// -----------------------------
function processTestData(data) {
  const nodeMap = {};
  const linkMap = {};
  const sessions = data.sessions;
  for (const date in sessions) {
    const session = sessions[date];
    for (const website in session) {
      const info = session[website];
      if (!nodeMap[website]) {
        nodeMap[website] = { id: website, size: 0, favicon: info.icon };
      }
      nodeMap[website].size += info.time;
      if (info.nextWebsites) {
        for (const target in info.nextWebsites) {
          const weight = info.nextWebsites[target];
          const key = website + "->" + target;
          if (!linkMap[key]) {
            linkMap[key] = { source: website, target: target, value: 0 };
          }
          linkMap[key].value += weight;
        }
      }
    }
  }
  return { nodes: Object.values(nodeMap), links: Object.values(linkMap) };
}

// -----------------------------
// Filter & aggregate data based on threshold and aggregation type.
// -----------------------------
const filterGraphData = (nodes, links, thresholdPercentage, aggregationType = "day") => {
  const factor = aggregationType === "day" ? 1 : aggregationType === "week" ? 7 : 30;
  const aggregatedNodes = nodes.map((node) => ({
    ...node,
    size: node.size * factor
  }));
  const aggregatedLinks = links.map((link) => ({
    ...link,
    value: link.value * factor
  }));
  const totalVisitTime = aggregatedNodes.reduce((acc, node) => acc + node.size, 0);
  const thresholdValue = (totalVisitTime * thresholdPercentage) / 100;
  const sortedNodes = [...aggregatedNodes].sort((a, b) => b.size - a.size);
  let filteredNodes = [];
  let cumulative = 0;
  for (const node of sortedNodes) {
    if (cumulative < thresholdValue) {
      filteredNodes.push(node);
      cumulative += node.size;
    } else {
      break;
    }
  }
  const filteredNodeIds = new Set(filteredNodes.map((n) => n.id));
  const filteredLinks = aggregatedLinks.filter(
    (link) =>
      filteredNodeIds.has(link.source) && filteredNodeIds.has(link.target)
  );
  return { nodes: filteredNodes, links: filteredLinks };
};

// -----------------------------
// Chi–square p–value (df=1) using standard normal CDF.
// -----------------------------
function chiSquarePValue(chi2, df = 1) {
  if (df === 1) {
    const x = Math.sqrt(chi2);
    return 2 * (1 - normCdf(x));
  }
  return 1;
}
function normCdf(x) {
  return 0.5 * (1 + erf(x / Math.sqrt(2)));
}
function erf(x) {
  const sign = x >= 0 ? 1 : -1;
  x = Math.abs(x);
  const a1 = 0.254829592, a2 = -0.284496736, a3 = 1.421413741,
        a4 = -1.453152027, a5 = 1.061405429, p = 0.3275911;
  const t = 1.0 / (1.0 + p * x);
  const y = 1.0 - (((a5 * t + a4) * t + a3) * t + a2) * t * Math.exp(-x * x)
  return sign * y;
}

// -----------------------------
// Compute pairwise A/B comparisons using a chi–square test.
// -----------------------------
const computePairComparisons = (links, filteredNodes) => {
  const totalOut = {};
  filteredNodes.forEach(node => {
    totalOut[node.id] = 0;
  });
  links.forEach(link => {
    if (link.source in totalOut) {
      totalOut[link.source] += link.value;
    }
  });
  const totalOutAll = Object.values(totalOut).reduce((a, b) => a + b, 0);
  
  const pairMap = {};
  links.forEach(link => {
    const { source, target, value } = link;
    const key = [source, target].sort().join("||");
    if (!pairMap[key]) {
      const sorted = [source, target].sort();
      pairMap[key] = { nodeA: sorted[0], nodeB: sorted[1], a2b: 0, b2a: 0 };
    }
    if (link.source === pairMap[key].nodeA && link.target === pairMap[key].nodeB) {
      pairMap[key].a2b += value;
    } else if (link.source === pairMap[key].nodeB && link.target === pairMap[key].nodeA) {
      pairMap[key].b2a += value;
    }
  });
  
  const comparisons = [];
  for (const key in pairMap) {
    const pair = pairMap[key];
    const pairTotal = pair.a2b + pair.b2a;
    if (pairTotal === 0) continue;
    let direction;
    if (pair.a2b >= pair.b2a) {
      direction = { from: pair.nodeA, to: pair.nodeB };
    } else {
      direction = { from: pair.nodeB, to: pair.nodeA };
    }
    const user = direction.from;
    const target = direction.to;
    const edgeUserToTarget = links.find(link => link.source === user && link.target === target);
    const O1 = edgeUserToTarget ? edgeUserToTarget.value : 0;
    const totalUser = totalOut[user] || 0;
    const O2 = totalUser - O1;
    let O3 = 0;
    links.forEach(link => {
      if (link.source !== user && link.target === target) {
        O3 += link.value;
      }
    });
    const totalNonUser = totalOutAll - totalUser;
    const O4 = totalNonUser - O3;
    const grandTotal = O1 + O2 + O3 + O4;
    const E1 = (totalUser * (O1 + O3)) / grandTotal;
    const E3 = (totalNonUser * (O1 + O3)) / grandTotal;
    const E2 = totalUser - E1;
    const E4 = totalNonUser - E3;
    const chi2 = ((O1 - E1) ** 2 / E1) + ((O2 - E2) ** 2 / E2) + ((O3 - E3) ** 2 / E3) + ((O4 - E4) ** 2 / E4);
    const pValue = chiSquarePValue(chi2, 1);
    let confidence = null;
    if (pValue < 0.01) confidence = "99%";
    else if (pValue < 0.05) confidence = "95%";
    else if (pValue < 0.10) confidence = "90%";
    else if (pValue < 0.15) confidence = "85%";
    comparisons.push({
      key,
      nodeA: pair.nodeA,
      nodeB: pair.nodeB,
      direction,
      O1, O2, O3, O4,
      totalUser,
      totalNonUser,
      E1, E2, E3, E4,
      chi2,
      pValue,
      confidence
    });
  }
  return comparisons;
};

// ==========================================================================
// Main Component
// ==========================================================================
const CytoscapeGraphDashboard = () => {
  const { aggregationType } = useGlobalContext();
  const [threshold, setThreshold] = useState(60);
  const [tempThreshold, setTempThreshold] = useState(60);
  const [isDirected, setIsDirected] = useState(false);
  const [showDetails, setShowDetails] = useState({});
  const [comparisonResults, setComparisonResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const toast = useToast();

  const processedData = useMemo(() => processTestData(testData), []);

  const filteredData = useMemo(
    () => filterGraphData(processedData.nodes, processedData.links, threshold, aggregationType),
    [processedData, threshold, aggregationType]
  );

  const MAX_NODE_SIZE = 50;
  const MIN_NODE_SIZE = 20;
  const maxNodeSize = useMemo(() => {
    return filteredData.nodes.reduce((max, node) => Math.max(max, node.size), 0);
  }, [filteredData.nodes]);

  const MAX_EDGE_WIDTH = 5;
  const MIN_EDGE_WIDTH = 1;
  const maxEdgeValue = useMemo(() => {
    return filteredData.links.reduce((max, link) => Math.max(max, link.value), 0);
  }, [filteredData.links]);

  const cyElements = useMemo(() => {
    const cyNodes = filteredData.nodes.map((node) => {
      const normSize = maxNodeSize > 0 ? ((node.size / maxNodeSize) * (MAX_NODE_SIZE - MIN_NODE_SIZE)) + MIN_NODE_SIZE : MIN_NODE_SIZE;
      return { data: { id: node.id, label: node.id, image: node.favicon, size: normSize } };
    });
    const filteredNodeIds = new Set(filteredData.nodes.map(n => n.id));
    let cyEdges = [];
    if (isDirected) {
      cyEdges = filteredData.links
        .filter(link => filteredNodeIds.has(link.source) && filteredNodeIds.has(link.target))
        .map(link => {
          const normWidth = maxEdgeValue > 0 ? ((link.value / maxEdgeValue) * (MAX_EDGE_WIDTH - MIN_EDGE_WIDTH)) + MIN_EDGE_WIDTH : MIN_EDGE_WIDTH;
          return { data: { id: `${link.source}->${link.target}`, source: link.source, target: link.target, value: link.value, label: link.value.toString(), width: normWidth } };
        });
    } else {
      const edgeMap = {};
      filteredData.links.forEach(link => {
        if (filteredNodeIds.has(link.source) && filteredNodeIds.has(link.target)) {
          const key = [link.source, link.target].sort().join("||");
          if (edgeMap[key]) {
            edgeMap[key].value += link.value;
          } else {
            edgeMap[key] = {
              data: {
                id: key,
                source: link.source,
                target: link.target,
                value: link.value,
                label: link.value.toString()
              }
            };
          }
        }
      });
      cyEdges = Object.values(edgeMap).map(edge => {
        const normWidth = maxEdgeValue > 0 ? ((edge.data.value / maxEdgeValue) * (MAX_EDGE_WIDTH - MIN_EDGE_WIDTH)) + MIN_EDGE_WIDTH : MIN_EDGE_WIDTH;
        return { data: { ...edge.data, width: normWidth, label: edge.data.value.toString() } };
      });
    }
    return { nodes: cyNodes, edges: cyEdges };
  }, [filteredData, maxNodeSize, maxEdgeValue, isDirected]);

  useEffect(() => {
    setIsLoading(true);
    const comps = computePairComparisons(filteredData.links, filteredData.nodes);
    comps.sort((a, b) => a.pValue - b.pValue);
    setComparisonResults(comps);
    setIsLoading(false);
  }, [filteredData]);

  const handleSliderChangeEnd = (val) => {
    setThreshold(val);
  };

  const toggleDetails = (key) => {
    setShowDetails((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const stylesheet = [
    {
      selector: 'node',
      style: {
        'label': 'data(label)',
        'background-image': 'data(image)',
        'background-fit': 'cover',
        'width': 'data(size)',
        'height': 'data(size)',
        'font-size': '10px',
        'text-valign': 'bottom',
        'text-halign': 'center'
      }
    },
    {
      selector: 'edge',
      style: {
        'label': 'data(label)',
        'curve-style': 'bezier',
        'width': 'data(width)',
        'line-color': '#ccc',
        'target-arrow-color': '#ccc',
        'target-arrow-shape': isDirected ? 'triangle' : 'none'
      }
    }
  ];

  const layout = { name: 'cose', animate: true };

  return (
    <Box p={4}>
      {/* --- Network Graph Section --- */}
      <Box mb={6}>
        <Text fontSize="xl" fontWeight="bold" mb={2}>Network Graph</Text>
        <Box mb={3}>
          <Text>Threshold: {tempThreshold}%</Text>
          <Slider
            value={tempThreshold}
            min={40}
            max={80}
            step={1}
            onChange={(val) => setTempThreshold(val)}
            onChangeEnd={(val) => handleSliderChangeEnd(val)}
            mb={2}
          >
            <SliderTrack bg="gray.300">
              <SliderFilledTrack bg="blue.500" />
            </SliderTrack>
            <SliderThumb boxSize={5} bg="blue.700" />
          </Slider>
          <RadioGroup
            onChange={(val) => setIsDirected(val === 'directed')}
            value={isDirected ? 'directed' : 'undirected'}
            mb={2}
          >
            <HStack spacing={4}>
              <Radio value="undirected">Undirected</Radio>
              <Radio value="directed">Directed</Radio>
            </HStack>
          </RadioGroup>
          <Text>Aggregation Type: {aggregationType}</Text>
        </Box>
        <CytoscapeComponent
          key={`${isDirected}-${JSON.stringify(filteredData)}`}
          elements={CytoscapeComponent.normalizeElements({ nodes: cyElements.nodes, edges: cyElements.edges })}
          stylesheet={stylesheet}
          layout={layout}
          style={{ width: '600px', height: '400px' }}
        />
      </Box>
      
      {/* --- A/B Testing Results Section --- */}
      <Box mb={6}>
        <Text fontSize="xl" fontWeight="bold" mb={2}>A/B Testing Results</Text>
        {isLoading ? (
          <Spinner />
        ) : comparisonResults.length === 0 ? (
          <Text>No comparisons available.</Text>
        ) : (
          comparisonResults.map((comp) => (
            <Box key={comp.key} mb={3} p={3} border="1px solid #EAEAEA" borderRadius="8px">
              <Text>
                {comp.confidence
                  ? `With ${comp.confidence} confidence, ${comp.direction.to} was opened after ${comp.direction.from}.`
                  : `No significant difference between ${comp.nodeA} and ${comp.nodeB}.`}
                <Button size="xs" ml={2} onClick={() => toggleDetails(comp.key)}>
                  {showDetails[comp.key] ? 'Hide Details' : 'Show Details'}
                </Button>
              </Text>
              {showDetails[comp.key] && (
                <Box mt={2}>
                  <BlockMath math={`\\chi^2 = \\sum_{i=1}^{4} \\frac{(O_i - E_i)^2}{E_i} \\approx ${comp.chi2.toFixed(2)} \\quad (df = 1)`} />
                  <Text mt={1}>
                    For the contingency table below, where:
                    <br />
                    • <InlineMath math="O_1" /> = transitions from <strong>{comp.direction.from}</strong> to <strong>{comp.direction.to}</strong>,
                    &nbsp;&nbsp;• <InlineMath math="O_2" /> = transitions from <strong>{comp.direction.from}</strong> to others,
                    <br />
                    • <InlineMath math="O_3" /> = transitions from non-<strong>{comp.direction.from}</strong> to <strong>{comp.direction.to}</strong>,
                    &nbsp;&nbsp;• <InlineMath math="O_4" /> = transitions from non-<strong>{comp.direction.from}</strong> to others.
                  </Text>
                  <Box as="table" mt={2} width="100%" border="1px solid #ccc" borderCollapse="collapse">
                    <Box as="thead" bg="#f0f0f0">
                      <Box as="tr">
                        <Box as="th" p="4px" border="1px solid #ccc">Transition Type</Box>
                        <Box as="th" p="4px" border="1px solid #ccc">{comp.direction.from} Users</Box>
                        <Box as="th" p="4px" border="1px solid #ccc">Non-{comp.direction.from} Users</Box>
                      </Box>
                    </Box>
                    <Box as="tbody">
                      <Box as="tr">
                        <Box as="td" p="4px" border="1px solid #ccc">
                          Transition to {comp.direction.to} (<InlineMath math="O_1" />)
                        </Box>
                        <Box as="td" p="4px" border="1px solid #ccc">{comp.O1}</Box>
                        <Box as="td" p="4px" border="1px solid #ccc">{comp.O3}</Box>
                      </Box>
                      <Box as="tr">
                        <Box as="td" p="4px" border="1px solid #ccc">
                          Transition to Others (<InlineMath math="O_2" />)
                        </Box>
                        <Box as="td" p="4px" border="1px solid #ccc">{comp.O2}</Box>
                        <Box as="td" p="4px" border="1px solid #ccc">{comp.O4}</Box>
                      </Box>
                      <Box as="tr">
                        <Box as="td" p="4px" border="1px solid #ccc">
                          Expected (<InlineMath math="E_1" />, <InlineMath math="E_3" />)
                        </Box>
                        <Box as="td" p="4px" border="1px solid #ccc">{comp.E1.toFixed(1)}</Box>
                        <Box as="td" p="4px" border="1px solid #ccc">{comp.E3.toFixed(1)}</Box>
                      </Box>
                    </Box>
                  </Box>
                </Box>
              )}
            </Box>
          ))
        )}
      </Box>
      
      {/* --- Information Section --- */}
      <Box>
        <Text fontSize="xl" fontWeight="bold" mb={2}>Information</Text>
        <Box as="ul" pl={4}>
          <Box as="li" mb={1}>Icon Size &amp; Edges Reflect Usage Frequency.</Box>
          <Box as="li">A/B testing aims to determine whether observed patterns are the result of actual changes or if they reflect consistent usage trends.</Box>
        </Box>
      </Box>
    </Box>
  );
};

export default CytoscapeGraphDashboard;