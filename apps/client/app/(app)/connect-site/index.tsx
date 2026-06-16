/**
 * Connect Site route ("/connect-site"). Thin wrapper around the feature screen.
 */
import React from 'react';

import { ConnectSiteScreen } from '@/features/connect-site/ConnectSiteScreen';

export default function ConnectSiteRoute(): React.JSX.Element {
  return <ConnectSiteScreen />;
}
