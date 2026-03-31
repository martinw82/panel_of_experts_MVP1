import React, { useState, useEffect } from 'react';
import LandingPage from './pages/landing-page';
import AppPage from './pages/app-page';
import { parseEmbedConfig } from './lib/plugin-api';

// Simple hash-based router for SPA without dependencies
type Route = 'landing' | 'app';

function App() {
  const [currentRoute, setCurrentRoute] = useState<Route>('landing');
  const [embedConfig, setEmbedConfig] = useState<{
    embed: boolean;
    compact: boolean;
    hideHeader: boolean;
    hideSidebar: boolean;
    initialPipeline?: string;
    initialModels?: string[];
    autoRun: boolean;
  }>({
    embed: false,
    compact: false,
    hideHeader: false,
    hideSidebar: false,
    autoRun: false,
  });

  // Parse URL params on mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const config = parseEmbedConfig(params);
    
    setEmbedConfig({
      embed: config.embed ?? false,
      compact: config.compact ?? false,
      hideHeader: config.hideHeader ?? false,
      hideSidebar: config.hideSidebar ?? false,
      initialPipeline: config.pipeline,
      initialModels: config.models,
      autoRun: config.autoRun ?? false,
    });

    // If embed mode, skip landing page
    if (config.embed) {
      setCurrentRoute('app');
    }

    // Listen for hash changes
    const handleHashChange = () => {
      const hash = window.location.hash.replace('#', '');
      if (hash === 'app') {
        setCurrentRoute('app');
      } else if (hash === 'landing' || hash === '') {
        setCurrentRoute('landing');
      }
    };

    window.addEventListener('hashchange', handleHashChange);
    handleHashChange(); // Check initial hash

    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const navigateToApp = () => {
    window.location.hash = 'app';
    setCurrentRoute('app');
  };

  const navigateToLanding = () => {
    window.location.hash = 'landing';
    setCurrentRoute('landing');
  };

  // Embed mode - render app directly without chrome
  if (embedConfig.embed) {
    return (
      <AppPage
        embed
        compact={embedConfig.compact}
        hideHeader={embedConfig.hideHeader}
        hideSidebar={embedConfig.hideSidebar}
        initialPipeline={embedConfig.initialPipeline}
        initialModels={embedConfig.initialModels}
        autoRun={embedConfig.autoRun}
      />
    );
  }

  // Normal mode - with landing page
  return (
    <>
      {currentRoute === 'landing' ? (
        <LandingPage onLaunch={navigateToApp} />
      ) : (
        <AppPage />
      )}
    </>
  );
}

export default App;
