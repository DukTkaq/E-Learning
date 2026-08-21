import api from '../../utils/api';

export const fetchVouchers = (params = {}) => api.get('/instructor/vouchers', { params });
export const createVoucher = (voucherData) => api.post('/instructor/vouchers', voucherData);
export const deleteVoucher = (id) => api.delete(`/instructor/vouchers/${id}`);
