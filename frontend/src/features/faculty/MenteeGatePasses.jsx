import React from 'react';
import { GatePassApprovalList } from '../gatepass/GatePassApprovalList';

export const MenteeGatePasses = () => {
  return <GatePassApprovalList roleTitle="Mentor" apiEndpoint="/api/gatepass/mentor" />;
};
