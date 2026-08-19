import api from '../../utils/api';

export const fetchVouchers = () => api.get('/instructor/vouchers');
export const createVoucher = (voucherData) => api.post('/instructor/vouchers', voucherData);
export const deleteVoucher = (id) => api.delete(`/instructor/vouchers/${id}`);
