import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { fetchVnpayPaymentStatus } from '../../features/cart/cartApi';
import VnpayResultCard from '../../components/checkout/VnpayResultCard';

const MAX_STATUS_CHECKS = 15;
const STATUS_CHECK_INTERVAL_MS = 2000;

export default function VnpayResultPage() {
  const [searchParams] = useSearchParams();
  const checkoutRef = searchParams.get('checkout_ref');
  const signatureValid = searchParams.get('signature_valid') === 'true';
  const [checkout, setCheckout] = useState(null);
  const [status, setStatus] = useState(signatureValid ? 'Pending' : 'Invalid');
  const [checking, setChecking] = useState(signatureValid);

  useEffect(() => {
    if (!signatureValid || !checkoutRef) return undefined;

    let cancelled = false;
    let attempts = 0;
    let timer;

    const checkStatus = async () => {
      attempts += 1;
      try {
        const response = await fetchVnpayPaymentStatus(checkoutRef);
        if (cancelled) return;
        const nextCheckout = response.data.checkout;
        setCheckout(nextCheckout);
        setStatus(nextCheckout.status);

        if (nextCheckout.status !== 'Pending') {
          setChecking(false);
        }
        if (nextCheckout.status === 'Success') {
          window.dispatchEvent(new CustomEvent('cart:updated'));
          return;
        }
        if (nextCheckout.status !== 'Pending') return;
        if (attempts >= MAX_STATUS_CHECKS) {
          setChecking(false);
          return;
        }
      } catch {
        if (cancelled) return;
        setStatus('Failed');
        setChecking(false);
        return;
      }
      timer = window.setTimeout(checkStatus, STATUS_CHECK_INTERVAL_MS);
    };

    checkStatus();
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [checkoutRef, signatureValid]);

  return <VnpayResultCard status={status} checkout={checkout} checking={checking} />;
}
