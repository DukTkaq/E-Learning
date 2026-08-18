import api from '../../utils/api';

export const fetchVouchers = () => api.get('/instructor/vouchers');
export const createVoucher = (voucherData) => api.post('/instructor/vouchers', voucherData);
