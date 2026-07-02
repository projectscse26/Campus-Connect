/**
 * Campus Connect ERP — Student Leave API Service
 */
import axios from 'axios';

const BASE = '/api/student-portal/leave';

const StudentLeaveService = {
  /** Submit a new leave request */
  applyLeave: (data) =>
    axios.post(BASE, data).then(r => r.data),

  /** Get all my leave requests */
  getMyLeaves: () =>
    axios.get(BASE).then(r => r.data),

  /** Withdraw a pending request */
  withdrawLeave: (id) =>
    axios.delete(`${BASE}/${id}`).then(r => r.data),
};

export default StudentLeaveService;
