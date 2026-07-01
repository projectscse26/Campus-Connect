import React from 'react';
import { GatePassApprovalList } from '../gatepass/GatePassApprovalList';

export const GatePassApprovals = () => {
  return <GatePassApprovalList roleTitle="HOD" apiEndpoint="/api/gatepass/hod" />;
};
