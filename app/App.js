import React, { useEffect } from 'react';
import Navigation from './src/Navigation';
import { initializeUsers } from "./src/store/user";

export default function App() {

  useEffect(() => {
    initializeUsers();
  }, []);

  useEffect(() => {
    // Checking login status and user role from storage or API
    // setLoggedIn(true);
    // setManager(true);
  }, []);

  return <Navigation />;
}