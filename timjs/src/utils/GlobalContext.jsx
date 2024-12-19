// GlobalContext.js
import React, { createContext, useState, useContext } from "react";

const GlobalContext = createContext();

export const useGlobalContext = () => useContext(GlobalContext);

export const GlobalProvider = ({ children }) => {
  const [aggregationType, setAggregationType] = useState("day");
  const [viewType, setViewType] = useState("list"); // Example additional state
  const [timePeriod, setTimePeriod] = useState("current"); // Example additional state

  const changeAggregationType = (type) => {
    setAggregationType(type);
  };

  const changeViewType = (type) => {
    setViewType(type);
  };

  const changeTimePeriod = (period) => {
    setTimePeriod(period);
  };

  return (
    <GlobalContext.Provider value={{ aggregationType, viewType, timePeriod, changeAggregationType, changeViewType, changeTimePeriod }}>
      {children}
    </GlobalContext.Provider>
  );
};
