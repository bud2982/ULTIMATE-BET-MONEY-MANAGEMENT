import React from 'react';
import { Route, Router } from 'wouter';

// Pages
import Home from '@/pages/home';
import StrategyPercentage from '@/pages/strategy-percentage';
import StrategyDalembert from '@/pages/strategy-dalembert';
import StrategyMasaniello from '@/pages/strategy-masaniello';
import StrategyKelly from '@/pages/strategy-kelly';
import StrategyBeatDelay from '@/pages/strategy-beat-delay';
import StrategyProfitfall from '@/pages/strategy-profitfall';
import Account from '@/pages/account';
import Pricing from '@/pages/pricing';
import Subscribe from '@/pages/subscribe';
import Checkout from '@/pages/checkout';
import PaymentSuccess from '@/pages/payment-success';
import SubscriptionSuccess from '@/pages/subscription-success';
import DemoAccess from '@/pages/demo-access';
import DemoFull from '@/pages/demo-full';
import DemoComplete from '@/pages/demo-complete';
import DemoInterface from '@/pages/demo-interface';
import DemoInvite from '@/pages/demo-invite';
import TestBeatDelaySessions from '@/pages/test-beat-delay-sessions';
import NotFound from '@/pages/not-found';

// Components
import SyncStatus from '@/components/sync-status';

function App() {
  return (
    <>
      <Router>
        <Route path="/" component={Home} />
        <Route path="/strategia/percentage" component={StrategyPercentage} />
        <Route path="/strategia/dalembert" component={StrategyDalembert} />
        <Route path="/strategia/masaniello" component={StrategyMasaniello} />
        <Route path="/strategia/kelly" component={StrategyKelly} />
        <Route path="/strategia/beat-delay" component={StrategyBeatDelay} />
        <Route path="/strategia/profitfall" component={StrategyProfitfall} />
        <Route path="/account" component={Account} />
        <Route path="/pricing" component={Pricing} />
        <Route path="/subscribe" component={Subscribe} />
        <Route path="/checkout" component={Checkout} />
        <Route path="/payment-success" component={PaymentSuccess} />
        <Route path="/subscription-success" component={SubscriptionSuccess} />
        <Route path="/demo-access" component={DemoAccess} />
        <Route path="/demo-full" component={DemoFull} />
        <Route path="/demo-complete" component={DemoComplete} />
        <Route path="/demo-interface" component={DemoInterface} />
        <Route path="/demo-invite" component={DemoInvite} />
        <Route path="/test-beat-delay-sessions" component={TestBeatDelaySessions} />
        <Route path="/:rest*" component={NotFound} />
      </Router>
      
      {/* Sync Status Component - Always visible */}
      <SyncStatus />
    </>
  );
}

export default App;