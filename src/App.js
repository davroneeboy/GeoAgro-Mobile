import React from "react";
import { BrowserRouter as Router } from "react-router-dom";
import AppRouter from "./router";
import { ErrorNotificationContainer } from "./components/common/ErrorNotification";

const App = () => {
  return (
    <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <AppRouter />
      <ErrorNotificationContainer position="top-right" maxVisible={5} />
    </Router>
  );
};

export default App;
