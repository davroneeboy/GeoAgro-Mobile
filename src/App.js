import React from "react";
import { BrowserRouter as Router } from "react-router-dom";
import AppRouter from "./router";

const App = () => {
  return (
    <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <AppRouter />
    </Router>
  );
};

export default App;
