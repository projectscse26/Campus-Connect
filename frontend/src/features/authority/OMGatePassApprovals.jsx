import React from 'react';
import { GatePassApprovalList } from '../gatepass/GatePassApprovalList';

export const OMGatePassApprovals = () => {
  return <GatePassApprovalList roleTitle="Office Manager" apiEndpoint="/api/gatepass/om" />;
};
